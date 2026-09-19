import { contextBridge, ipcRenderer } from 'electron'



contextBridge.exposeInMainWorld('electron', {
    send: (message: string) => ipcRenderer.invoke('send', message)
})