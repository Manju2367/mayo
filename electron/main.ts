import { app, BrowserWindow, Tray, Menu, ipcMain } from 'electron'
import path from 'node:path'
import * as C from './constsns.js'



const createWindow = () => {
    const mainWindow = new BrowserWindow({
        title: C.appName,
        width: 960,
        height: 640,
        fullscreen: false,
        autoHideMenuBar: true,
        transparent: false,
        frame: true,
        alwaysOnTop: false,
        webPreferences: {
            preload: path.join(C.__dirname, 'preload.js'),
            nodeIntegration: true
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
    ipcMain.handle('send', (e, message) => send(message))



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

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})