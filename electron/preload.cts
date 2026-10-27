const { contextBridge, ipcRenderer } = require('electron')



contextBridge.exposeInMainWorld('electron', {
    log: (args: Array<any>) => ipcRenderer.invoke('log', args),
    send: (message: string) => ipcRenderer.invoke('send', message),
    hideWindow: () => ipcRenderer.invoke('hideWindow'),

    onShow: (callback: Function) => ipcRenderer.on('show', (_event: any) => callback())
})