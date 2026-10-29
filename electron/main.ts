import { app, BrowserWindow, Tray, Menu, ipcMain, globalShortcut } from 'electron'
import path from 'node:path'
import * as C from './constsns.js'
import type ElectronAPI from './shared/electron-api.js'
import { existsSync, mkdirSync, writeFile } from 'node:fs'



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

    return filename
}



// プロセス間通信
const apiFuncs: Pick<ElectronAPI,
        'log' | 'send' | 'hideWindow'
    > = {
    log: (args): void => {
        console.log(...args)
    },
    send: (note) => {
        // console.log(note)

        const notesPath = path.join(C.__dirname, '../notes')

        if (!existsSync(notesPath)) mkdirSync(notesPath)

        const title = parseFilename(note.split('\n')[0] ?? '')
        const filename = `${ title }.txt`
        writeFile(path.join(notesPath, filename), note, 'utf-8', () => {
            console.log(`ファイル ${ filename } を保存しました。`)
        })
    },
    hideWindow: () => {
        mainWindow?.hide()
    }
}



app.whenReady().then(() => {
    // handle funcs
    ipcMain.handle('log', (e, args: Array<any>) => apiFuncs.log(args))
    ipcMain.handle('send', (e, message) => apiFuncs.send(message))
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

    const tray = new Tray(path.join(C.__dirname, '../public/icon.png'))
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