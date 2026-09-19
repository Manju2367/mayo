import { app, BrowserWindow, Tray, Menu } from 'electron'
import path from 'node:path'
import * as C from './constsns.js'



const createWindow = () => {
    const mainWindow = new BrowserWindow({
        title: C.appName,
        width: 960,
        height: 640,
        autoHideMenuBar: true,
        transparent: false
    })

    if (app.isPackaged) {
        mainWindow.loadFile(path.join(C.__dirname, '../dist/index.html'))
    } else {
        mainWindow.loadURL('http://localhost:5173/')
    }
}



app.whenReady().then(() => {
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