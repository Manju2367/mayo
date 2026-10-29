export default interface ElectronAPI {
    // funcs
    log(...args: Array<any>): void,
    send(note: string, currentFilename: string | null): Promise<string>,
    hideWindow(): void,

    // events
    onShow(callback: () => void): void
}
