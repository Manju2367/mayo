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
    deleteNote(filename: string): Promise<void>,
    onQuitRequest(callback: () => void): void,
    readyForQuitRequests(): void,
    showQuitPrompt(): void,
    resolveQuit(shouldQuit: boolean): void,
    hideWindow(): void,

    // events
    onShow(callback: () => void): void
}
