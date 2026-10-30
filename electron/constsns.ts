import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { app } from 'electron'



export const __filename = fileURLToPath(import.meta.url)
export const __dirname = path.dirname(__filename)
export const appName = 'Mayo'
// Keep packaged user data outside the installation directory so updates don't replace notes.
export const rootDir = app.isPackaged ? app.getPath('userData') : path.join(__dirname, '..')
