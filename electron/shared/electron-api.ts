export interface NoteSummary {
    filename: string
    updatedAt: number
}

export default interface ElectronAPI {
    // funcs
    log(...args: Array<any>): void,
    send(note: string, currentFilename: string | null): Promise<string>,
    listNotes(): Promise<NoteSummary[]>,
    hideWindow(): void,

    // events
    onShow(callback: () => void): void
}
