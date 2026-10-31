const { contextBridge, ipcRenderer } = require('electron')
import type ElectronAPI from './shared/electron-api'
import type { UpdateStatus } from './shared/electron-api'



const api: ElectronAPI = {
    log: (args) => ipcRenderer.invoke('log', args),
    send: (note, currentFilename) => ipcRenderer.invoke('send', note, currentFilename),
    listNotes: () => ipcRenderer.invoke('listNotes'),
    openNote: (filename) => ipcRenderer.invoke('openNote', filename),
    deleteNote: (filename) => ipcRenderer.invoke('deleteNote', filename),
    onQuitRequest: (callback) => ipcRenderer.on('app-quit-requested', () => callback()),
    readyForQuitRequests: () => ipcRenderer.send('renderer-ready-for-quit'),
    showQuitPrompt: () => ipcRenderer.send('show-quit-prompt'),
    resolveQuit: (shouldQuit) => ipcRenderer.send('resolve-quit', shouldQuit),
    requestUpdateInstall: () => ipcRenderer.send('request-update-install'),
    onUpdateStatus: (callback) => ipcRenderer.on('update-status', (_event: any, status: UpdateStatus) => callback(status)),
    isUpdatePreviewEnabled: () => ipcRenderer.invoke('is-update-preview-enabled'),
    hideWindow: () => ipcRenderer.invoke('hideWindow'),

    onShow: (callback) => ipcRenderer.on('show', (_event: any) => callback())
}

contextBridge.exposeInMainWorld('electronAPI', api)
