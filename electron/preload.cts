const { contextBridge, ipcRenderer } = require('electron')



contextBridge.exposeInMainWorld('electron', {
    send: (message: string) => ipcRenderer.invoke('send', message),

    onShow: (callback: Function) => ipcRenderer.on('show', (_event: any) => callback())
})