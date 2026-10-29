<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { NoteSummary } from '../../electron/shared/electron-api'

defineEmits<{
    back: []
}>()

const panel = ref<HTMLElement | null>(null)
const notes = ref<NoteSummary[]>([])
const isLoading = ref(true)
const errorMessage = ref('')

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

defineExpose({ focus })

onMounted(() => {
    focus()
    void loadNotes()
})
</script>

<template>
    <section ref="panel" class="memo-card note-list-card" aria-labelledby="notes-title" tabindex="-1">
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
                    <tr v-for="note in notes" :key="note.filename">
                        <td class="note-name-cell">{{ note.filename }}</td>
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
        </div>

        <footer class="note-list-footer">
            <span>更新日時の新しい順</span>
            <span><kbd>Esc</kbd> メモへ戻る</span>
        </footer>
    </section>
</template>
