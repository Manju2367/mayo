<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import type { NoteDocument, NoteSummary } from '../../electron/shared/electron-api'
import type { UpdateStatus } from '../../electron/shared/electron-api'
import PageHeading from './PageHeading.vue'
import ConfirmDeleteDialog from './ConfirmDeleteDialog.vue'
import UpdateStatusBar from './UpdateStatusBar.vue'

defineProps<{
    updateStatus: UpdateStatus | null
    updatePreviewEnabled: boolean
}>()

const emit = defineEmits<{
    back: []
    open: [note: NoteDocument]
    deleted: [filename: string]
    dismissUpdate: []
    restartUpdate: []
    previewUpdateStatus: [status: UpdateStatus | null]
}>()

const panel = ref<HTMLElement | null>(null)
const notes = ref<NoteSummary[]>([])
const isLoading = ref(true)
const errorMessage = ref('')
const selectedIndex = ref(-1)
const isOpening = ref(false)
const openingError = ref('')
const deleteError = ref('')
const pendingDelete = ref<NoteSummary | null>(null)
const isDeleting = ref(false)

const formatUpdatedAt = (timestamp: number) =>
    new Intl.DateTimeFormat('ja-JP', {
        dateStyle: 'medium',
        timeStyle: 'short'
    }).format(timestamp)

const loadNotes = async () => {
    isLoading.value = true
    errorMessage.value = ''

    try {
        notes.value = await window.electronAPI.listNotes()
    } catch {
        errorMessage.value = 'メモ一覧を読み込めませんでした'
    } finally {
        isLoading.value = false
    }
}

const focus = () => panel.value?.focus()

const openSelected = async () => {
    const note = notes.value[selectedIndex.value]
    if (!note || isOpening.value) return

    isOpening.value = true
    openingError.value = ''
    try {
        emit('open', await window.electronAPI.openNote(note.filename))
    } catch {
        openingError.value = 'メモを開けませんでした'
    } finally {
        isOpening.value = false
    }
}

const selectNote = async (index: number, shouldFocus = false) => {
    if (notes.value.length === 0) return
    selectedIndex.value = (index + notes.value.length) % notes.value.length
    if (shouldFocus) {
        await nextTick()
        const button = panel.value?.querySelector<HTMLButtonElement>(`[data-note-index="${selectedIndex.value}"]`)
        const scrollArea = panel.value?.querySelector<HTMLElement>('.note-table-wrap')
        const row = button?.closest('tr')

        button?.focus({ preventScroll: true })
        if (!button || !scrollArea || !row) return

        const areaRect = scrollArea.getBoundingClientRect()
        const rowRect = row.getBoundingClientRect()
        const stickyHeaderHeight = scrollArea.querySelector('thead')?.getBoundingClientRect().height ?? 0
        const visibleTop = areaRect.top + stickyHeaderHeight
        const visibleBottom = areaRect.bottom

        if (rowRect.top < visibleTop) {
            scrollArea.scrollTop -= visibleTop - rowRect.top
        } else if (rowRect.bottom > visibleBottom) {
            scrollArea.scrollTop += rowRect.bottom - visibleBottom
        }
    }
}

const requestDelete = (note: NoteSummary) => {
    if (!isDeleting.value) pendingDelete.value = note
}

const cancelDelete = async () => {
    pendingDelete.value = null
    await nextTick()
    panel.value?.querySelector<HTMLButtonElement>(`.note-open-button[data-note-index="${selectedIndex.value}"]`)?.focus()
}

const confirmDelete = () => {
    const note = pendingDelete.value
    if (note) void deleteNote(note)
}

const deleteNote = async (note: NoteSummary) => {
    if (isDeleting.value) return

    isDeleting.value = true
    deleteError.value = ''
    const deletedIndex = notes.value.findIndex((item) => item.filename === note.filename)
    try {
        await window.electronAPI.deleteNote(note.filename)
        emit('deleted', note.filename)
        notes.value = notes.value.filter((item) => item.filename !== note.filename)
        if (notes.value.length === 0) {
            selectedIndex.value = -1
        } else {
            selectedIndex.value = Math.min(Math.max(deletedIndex, 0), notes.value.length - 1)
            await selectNote(selectedIndex.value, true)
        }
    } catch {
        deleteError.value = 'メモを削除できませんでした'
    } finally {
        pendingDelete.value = null
        isDeleting.value = false
        await nextTick()
        const button = panel.value?.querySelector<HTMLButtonElement>(`.note-open-button[data-note-index="${selectedIndex.value}"]`)
        if (button) button.focus({ preventScroll: true })
        else panel.value?.focus()
    }
}

const handleListKeydown = (event: KeyboardEvent) => {
    if (pendingDelete.value) return

    const target = event.target
    const noteIndex = target instanceof HTMLButtonElement
        ? Number(target.dataset.noteIndex)
        : -1
    const focusedNote = noteIndex === selectedIndex.value ? notes.value[noteIndex] : undefined
    const key = event.key.toLowerCase()
    const forceDelete = (event.ctrlKey || event.metaKey) && event.shiftKey && key === 'd'

    if (focusedNote && forceDelete) {
        event.preventDefault()
        void deleteNote(focusedNote)
        return
    }

    if (
        focusedNote &&
        !event.ctrlKey && !event.metaKey && !event.altKey &&
        (key === 'd' || key === 'delete')
    ) {
        event.preventDefault()
        requestDelete(focusedNote)
        return
    }

    if (event.key === 'ArrowDown') {
        event.preventDefault()
        void selectNote(selectedIndex.value < 0 ? 0 : selectedIndex.value + 1, true)
    } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        void selectNote(selectedIndex.value < 0 ? notes.value.length - 1 : selectedIndex.value - 1, true)
    } else if (event.key === 'Enter' && selectedIndex.value >= 0 && !(event.target instanceof HTMLButtonElement)) {
        event.preventDefault()
        void openSelected()
    }
}

defineExpose({ focus })

onMounted(() => {
    focus()
    void loadNotes()
})
</script>

<template>
    <section ref="panel" class="memo-card note-list-card" aria-labelledby="notes-title" tabindex="-1" @keydown="handleListKeydown">
        <header class="memo-header note-list-header">
            <PageHeading eyebrow="MAYO / YOUR NOTES" title="保存したメモ" title-id="notes-title" />
            <UpdateStatusBar
                :status="updateStatus"
                :preview-enabled="updatePreviewEnabled"
                @dismiss="emit('dismissUpdate')"
                @restart="emit('restartUpdate')"
                @preview-status="emit('previewUpdateStatus', $event)"
            />
            <button class="back-button" type="button" @click="$emit('back')">
                <span aria-hidden="true">←</span>
                <span>メモへ戻る</span>
            </button>
        </header>

        <div class="note-table-wrap">
            <table class="note-table">
                <thead>
                    <tr>
                        <th scope="col">ファイル名</th>
                        <th scope="col">更新日時</th>
                        <th scope="col"><span class="sr-only">操作</span></th>
                    </tr>
                </thead>
                <tbody v-if="notes.length > 0">
                    <tr
                        v-for="(note, index) in notes"
                        :key="note.filename"
                        :class="{ 'is-selected': selectedIndex === index }"
                        @click="selectedIndex = index; openSelected()"
                        @mouseenter="selectedIndex = index"
                    >
                        <td class="note-name-cell">
                            <button
                                class="note-open-button"
                                type="button"
                                :data-note-index="index"
                                :disabled="isOpening"
                                @focus="selectedIndex = index"
                                @keydown.enter.stop
                                @click.stop="selectedIndex = index; openSelected()"
                            >{{ note.filename }}</button>
                        </td>
                        <td class="note-date-cell">
                            <time :datetime="new Date(note.updatedAt).toISOString()">
                                {{ formatUpdatedAt(note.updatedAt) }}
                            </time>
                        </td>
                        <td class="note-action-cell">
                            <button
                                class="note-delete-button"
                                type="button"
                                :data-note-index="index"
                                :aria-label="`${note.filename}を削除`"
                                :disabled="isDeleting"
                                @focus="selectedIndex = index"
                                @click.stop="selectedIndex = index; requestDelete(note)"
                            >
                                <img src="../assets/images/trash.svg" alt="">
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>

            <p v-if="isLoading" class="note-list-message" role="status">読み込み中…</p>
            <p v-else-if="errorMessage" class="note-list-message is-error" role="alert">{{ errorMessage }}</p>
            <p v-else-if="notes.length === 0" class="note-list-message">保存されたメモはありません</p>
            <p v-if="openingError" class="note-list-message is-error" role="alert">{{ openingError }}</p>
            <p v-else-if="isOpening" class="note-list-message" role="status">メモを開いています…</p>
            <p v-if="deleteError" class="note-list-message is-error" role="alert">{{ deleteError }}</p>
        </div>

        <footer class="memo-footer note-list-footer">
            <div class="footer-meta">
                <span>更新日時の新しい順</span>
                <span>{{ notes.length }} 件</span>
            </div>
            <div class="footer-actions">
                <div class="shortcut-hint">
                    <span class="shortcut"><kbd>↑</kbd><span>+</span><kbd>↓</kbd><span class="shortcut-label">選択</span></span>
                    <span class="shortcut-divider" aria-hidden="true"></span>
                    <span class="shortcut"><kbd>Enter</kbd><span class="shortcut-label">開く</span></span>
                    <span class="shortcut-divider" aria-hidden="true"></span>
                    <span class="shortcut"><kbd>Ctrl</kbd><span>+</span><kbd>N</kbd><span class="shortcut-label">新規</span></span>
                    <span class="shortcut-divider" aria-hidden="true"></span>
                    <span class="shortcut"><kbd>D</kbd><span>/</span><kbd>Del</kbd><span class="shortcut-label">削除</span></span>
                    <span class="shortcut-divider" aria-hidden="true"></span>
                    <span class="shortcut"><kbd>Ctrl</kbd><span>+</span><kbd>Shift</kbd><span>+</span><kbd>D</kbd><span class="shortcut-label">即削除</span></span>
                </div>
            </div>
        </footer>
        <ConfirmDeleteDialog
            v-if="pendingDelete"
            :filename="pendingDelete.filename"
            @cancel="cancelDelete"
            @confirm="confirmDelete"
        />
    </section>
</template>
