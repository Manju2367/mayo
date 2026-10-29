import { app, BrowserWindow, Tray, Menu, ipcMain, globalShortcut } from 'electron'
import path from 'node:path'
import * as C from './constsns.js'
import type ElectronAPI from './shared/electron-api.js'
import { existsSync } from 'node:fs'
import { mkdir, readFile, readdir, rename, stat, writeFile } from 'node:fs/promises'



let mainWindow: BrowserWindow | null = null
const createWindow = () => {
    mainWindow = new BrowserWindow({
        title: C.appName,
        width: 960,
        height: 640,
        fullscreen: true,
        autoHideMenuBar: true,
        transparent: true,
        frame: false,
        alwaysOnTop: true,
        skipTaskbar: true,
        show: false,
        webPreferences: {
            contextIsolation: true,
            preload: path.join(C.__dirname, 'preload.cjs')
        }
    })

    mainWindow.on('blur', () => {
        mainWindow?.hide()
    })

    if (app.isPackaged) {
        mainWindow.loadFile(path.join(C.__dirname, '../dist/index.html'))
    } else {
        mainWindow.loadURL('http://localhost:5173/')
    }
}

const generateTimestamp = (): string => {
    return new Date()
        .toLocaleString()
        .replaceAll('/', '-')
        .replaceAll(':', '')
}

const parseFilename = (filename: string): string => {
    const invalidChars = /[\n\t/\?<>\\:\*|"]/g
    const reservedWords = [
        'com1', 'com2', 'com3', 'com4', 'com5', 'com6', 'com7', 'com8', 'com9',
        'lpt1', 'lpt2', 'lpt3', 'lpt4', 'lpt5', 'lpt6', 'lpt7', 'lpt8', 'lpt9',
        'con', 'nul', 'prn', 'aux'
    ]

    // 禁止文字
    filename = filename.replaceAll(invalidChars, '')

    // 末尾の.を削除
    filename = filename.replace(/[. ]+$/, '')

    // 空文字
    if (filename.match(/^\s*$/))
        return generateTimestamp()

    // 予約語
    if (reservedWords.includes(filename.toLowerCase()))
        return filename + '_'

    // ファイル名の文字数制限
    if (filename.length > 20) {
        filename = filename.slice(0, 19) + '…'
    } 

    return filename
}



// プロセス間通信
const apiFuncs: Pick<ElectronAPI,
        'log' | 'send' | 'listNotes' | 'openNote' | 'hideWindow'
    > = {
    log: (args): void => {
        console.log(...args)
    },
    send: async (note, currentFilename) => {
        const notesPath = path.join(C.rootDir, 'notes')
        await mkdir(notesPath, { recursive: true })

        if (currentFilename !== null && path.basename(currentFilename) !== currentFilename)
            throw new Error('Invalid current filename')

        const firstLine = note.split('\n')[0] ?? ''
        const title = currentFilename !== null && firstLine.match(/^\s*$/)
            ? path.parse(currentFilename).name
            : parseFilename(firstLine)
        const filename = `${ title }.txt`
        const nextPath = path.join(notesPath, filename)
        const currentPath = currentFilename === null
            ? null
            : path.join(notesPath, currentFilename)

        if (currentPath !== null && currentFilename !== filename) {
            if (existsSync(nextPath))
                throw new Error(`ファイル ${ filename } は既に存在します。`)

            await rename(currentPath, nextPath)
            try {
                await writeFile(nextPath, note, 'utf-8')
            } catch (error) {
                await rename(nextPath, currentPath).catch(() => undefined)
                throw error
            }
        } else {
            await writeFile(nextPath, note, 'utf-8')
        }

        console.log(`ファイル ${ filename } を保存しました。`)
        return filename
    },
    listNotes: async () => {
        const notesPath = path.join(C.rootDir, 'notes')
        if (!existsSync(notesPath)) return []

        const entries = await readdir(notesPath, { withFileTypes: true })
        const notes = await Promise.all(
            entries
                .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.txt'))
                .map(async (entry) => {
                    const filePath = path.join(notesPath, entry.name)
                    const fileStat = await stat(filePath)
                    return {
                        filename: entry.name,
                        updatedAt: fileStat.mtimeMs
                    }
                })
        )

        return notes.sort((a, b) => b.updatedAt - a.updatedAt)
    },
    openNote: async (filename) => {
        if (
            path.basename(filename) !== filename ||
            !filename.toLowerCase().endsWith('.txt')
        ) {
            throw new Error('Invalid note filename')
        }

        const notesPath = path.join(C.rootDir, 'notes')
        const content = await readFile(path.join(notesPath, filename), 'utf-8')
        return { filename, content }
    },
    hideWindow: () => {
        mainWindow?.hide()
    }
}



app.whenReady().then(() => {
    // handle funcs
    ipcMain.handle('log', (e, args: Array<any>) => apiFuncs.log(args))
    ipcMain.handle('send', (e, message: string, currentFilename: string | null) =>
        apiFuncs.send(message, currentFilename)
    )
    ipcMain.handle('listNotes', () => apiFuncs.listNotes())
    ipcMain.handle('openNote', (e, filename: string) => apiFuncs.openNote(filename))
    ipcMain.handle('hideWindow', (e) => apiFuncs.hideWindow())



    // global shortcut
    globalShortcut.register('CommandOrControl+Alt+M', () => {
        if (mainWindow?.isVisible()) {
            mainWindow?.hide()
        } else {
            mainWindow?.show()

            mainWindow?.webContents.send('show')
        }
    })

    const tray = new Tray(path.join(C.__dirname, '../public/icon-512.png'))
    tray.setContextMenu(Menu.buildFromTemplate([
        {
            label: '終了',
            click: () => app.quit()
        }
    ]))
    createWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })

    console.log('app started.')
})

app.on('will-quit', () => {
    globalShortcut.unregisterAll()
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})
