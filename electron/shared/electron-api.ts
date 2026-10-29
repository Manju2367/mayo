export interface NoteSummary {
    filename: string
    updatedAt: number
}

export interface NoteDocument {
    filename: string
    content: string
}

export default interface ElectronAPI {
    // funcs
    log(...args: Array<any>): void,
    send(note: string, currentFilename: string | null): Promise<string>,
    listNotes(): Promise<NoteSummary[]>,
    openNote(filename: string): Promise<NoteDocument>,
    hideWindow(): void,

    // events
    onShow(callback: () => void): void
}
