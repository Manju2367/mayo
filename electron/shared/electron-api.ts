export default interface ElectronAPI {
    // funcs
    log(...args: Array<any>): void,
    send(message: string): void,
    hideWindow(): void,

    // events
    onShow(callback: () => void): void
}