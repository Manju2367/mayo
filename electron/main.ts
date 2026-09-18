import { app, BrowserWindow } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'



const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const title = 'Mayo'

const createWindow = () => {
    const mainWindow = new BrowserWindow({
        title,
        width: 960,
        height: 640,
        autoHideMenuBar: true
    })

    if (app.isPackaged) {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
    } else {
        mainWindow.loadURL('http://localhost:5173/')
    }
}



app.whenReady().then(() => {
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