<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import type { NoteDocument, NoteSummary } from '../../electron/shared/electron-api'

const emit = defineEmits<{
    back: []
    open: [note: NoteDocument]
}>()

const panel = ref<HTMLElement | null>(null)
const notes = ref<NoteSummary[]>([])
const isLoading = ref(true)
const errorMessage = ref('')
const selectedIndex = ref(-1)
const isOpening = ref(false)
const openingError = ref('')

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
        panel.value?.querySelector<HTMLButtonElement>(`[data-note-index="${selectedIndex.value}"]`)?.focus()
    }
}

const handleListKeydown = (event: KeyboardEvent) => {
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
            <div class="brand-mark" aria-hidden="true">m</div>
            <div class="heading-copy">
                <p class="eyebrow">MAYO / YOUR NOTES</p>
                <h1 id="notes-title">保存したメモ</h1>
            </div>
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
                    </tr>
                </tbody>
            </table>

            <p v-if="isLoading" class="note-list-message" role="status">読み込み中…</p>
            <p v-else-if="errorMessage" class="note-list-message is-error" role="alert">{{ errorMessage }}</p>
            <p v-else-if="notes.length === 0" class="note-list-message">保存されたメモはありません</p>
            <p v-if="openingError" class="note-list-message is-error" role="alert">{{ openingError }}</p>
            <p v-else-if="isOpening" class="note-list-message" role="status">メモを開いています…</p>
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
                </div>
            </div>
        </footer>
    </section>
</template>
