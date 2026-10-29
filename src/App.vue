<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import MemoEditor from './components/MemoEditor.vue'
import MemoFooter from './components/MemoFooter.vue'
import MemoHeader from './components/MemoHeader.vue'
import NoteListPage from './components/NoteListPage.vue'

const currentPage = ref<'memo' | 'list'>('memo')
const memo = ref('')
const memoEditor = ref<{ focus: () => void } | null>(null)
const noteListPage = ref<{ focus: () => void } | null>(null)
const currentFilename = ref<string | null>(null)
const lastSavedContent = ref<string | null>(null)
const isSaving = ref(false)
const saveStatus = ref('すぐに書き始められます')
const saveSucceeded = ref(false)

const characterCount = computed(() => `${memo.value.length.toLocaleString('ja-JP')} 文字`)
const isDirty = computed(() =>
    lastSavedContent.value === null || memo.value !== lastSavedContent.value
)

const saveMemo = async () => {
    if (isSaving.value) return

    isSaving.value = true
    const content = memo.value
    saveSucceeded.value = false
    saveStatus.value = '保存中…'

    try {
        currentFilename.value = await window.electronAPI.send(content, currentFilename.value)
        lastSavedContent.value = content
        saveSucceeded.value = memo.value === content
        saveStatus.value = saveSucceeded.value ? '保存しました' : ''
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        saveStatus.value = message.includes('既に存在します')
            ? '同名のファイルがあります'
            : '保存できませんでした'
    } finally {
        isSaving.value = false
    }
}

const handleInput = () => {
    saveSucceeded.value = !isDirty.value && lastSavedContent.value !== null
    saveStatus.value = isDirty.value
        ? ''
        : lastSavedContent.value === null
            ? 'すぐに書き始められます'
            : '保存済み'
}

const hideWindow = () => window.electronAPI.hideWindow()

const showNoteList = async () => {
    currentPage.value = 'list'
    await nextTick()
    noteListPage.value?.focus()
}

const returnToMemo = async () => {
    currentPage.value = 'memo'
    await nextTick()
    memoEditor.value?.focus()
}

const handleWindowKeydown = (event: KeyboardEvent) => {
    if (event.isComposing) return

    const key = event.key.toLowerCase()
    const hasModifier = event.ctrlKey || event.metaKey

    if (hasModifier && key === 'l') {
        event.preventDefault()
        if (currentPage.value === 'memo') void showNoteList()
        else void returnToMemo()
        return
    }

    if (hasModifier && key === 's') {
        event.preventDefault()
        return
    }

    if (currentPage.value === 'memo' && event.key === 'Tab') event.preventDefault()

    if (event.key === 'Escape') {
        if (currentPage.value === 'list') void returnToMemo()
        else hideWindow()
    }
}

onMounted(() => {
    window.addEventListener('keydown', handleWindowKeydown)
    window.electronAPI.onShow(() => {
        if (currentPage.value === 'list') noteListPage.value?.focus()
        else memoEditor.value?.focus()
    })
    memoEditor.value?.focus()
})

onUnmounted(() => {
    window.removeEventListener('keydown', handleWindowKeydown)
})
</script>

<template>
    <main
        id="main-container"
        :aria-label="currentPage === 'memo' ? 'クイックメモ' : '保存したメモ'"
        @click.self="hideWindow"
    >
        <section v-if="currentPage === 'memo'" class="memo-card" aria-labelledby="memo-title">
            <MemoHeader
                :filename="currentFilename"
                :is-dirty="isDirty"
                @close="hideWindow"
            />
            <MemoEditor
                ref="memoEditor"
                v-model="memo"
                @input="handleInput"
                @save="saveMemo"
            />
            <MemoFooter
                :status="saveStatus"
                :character-count="characterCount"
                :is-saving="isSaving"
                :save-succeeded="saveSucceeded"
                @save="saveMemo"
            />
        </section>
        <NoteListPage
            v-else
            ref="noteListPage"
            @back="returnToMemo"
        />
        <p class="backdrop-tip">
            <kbd>Esc</kbd>
            {{ currentPage === 'list' ? 'メモへ戻る' : '閉じる' }}
            <span class="page-shortcut-hint"><kbd>Ctrl</kbd>+<kbd>L</kbd> {{ currentPage === 'list' ? 'メモへ戻る' : '一覧' }}</span>
        </p>
    </main>
</template>
