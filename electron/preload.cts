const { contextBridge, ipcRenderer } = require('electron')
import type ElectronAPI from './shared/electron-api'



const api: ElectronAPI = {
    log: (args) => ipcRenderer.invoke('log', args),
    send: (note, currentFilename) => ipcRenderer.invoke('send', note, currentFilename),
    listNotes: () => ipcRenderer.invoke('listNotes'),
    openNote: (filename) => ipcRenderer.invoke('openNote', filename),
    deleteNote: (filename) => ipcRenderer.invoke('deleteNote', filename),
    hideWindow: () => ipcRenderer.invoke('hideWindow'),

    onShow: (callback) => ipcRenderer.on('show', (_event: any) => callback())
}

contextBridge.exposeInMainWorld('electronAPI', api)
