import { app, BrowserWindow, Tray, Menu, ipcMain, globalShortcut } from 'electron'
import path from 'node:path'
import * as C from './constsns.js'



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

    if (app.isPackaged) {
        mainWindow.loadFile(path.join(C.__dirname, '../dist/index.html'))
    } else {
        mainWindow.loadURL('http://localhost:5173/')
    }
}

const send = (message: string) => {
    console.log(message)
}



app.whenReady().then(() => {
    // handle funcs
    ipcMain.handle('send', (e, message) => send(message))



    // global shortcut
    globalShortcut.register('CommandOrControl+Alt+M', () => {
        if (mainWindow !== null) {
            if (mainWindow.isVisible()) {
                mainWindow.hide()
            } else {
                mainWindow.show()

                mainWindow.webContents.send('show')
            }
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
})

app.on('will-quit', () => {
    globalShortcut.unregisterAll()
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})