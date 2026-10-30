export interface NoteSummary {
    filename: string
    updatedAt: number
}

export interface NoteDocument {
    filename: string
    content: string
}

export type UpdateStatus =
    | { status: 'available'; version: string }
    | { status: 'downloading'; version: string; percent: number }
    | { status: 'downloaded'; version: string }
    | { status: 'error'; message: string }

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
    requestUpdateInstall(): void,
    onUpdateStatus(callback: (status: UpdateStatus) => void): void,
    hideWindow(): void,

    // events
    onShow(callback: () => void): void
}
