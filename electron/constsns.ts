import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { app } from 'electron'



export const __filename = fileURLToPath(import.meta.url)
export const __dirname = path.dirname(__filename)
export const appName = 'Mayo'
export const rootDir = app.isPackaged ? path.dirname(app.getPath('exe')) : path.join(__dirname, '..')