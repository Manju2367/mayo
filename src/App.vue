<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import MemoEditor from './components/MemoEditor.vue'
import MemoFooter from './components/MemoFooter.vue'
import MemoHeader from './components/MemoHeader.vue'

const memo = ref('')
const memoEditor = ref<{ focus: () => void } | null>(null)
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

const handleWindowKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Tab') event.preventDefault()
    if (event.key === 'Escape') hideWindow()
}

onMounted(() => {
    window.addEventListener('keydown', handleWindowKeydown)
    window.electronAPI.onShow(() => memoEditor.value?.focus())
    memoEditor.value?.focus()
})

onUnmounted(() => {
    window.removeEventListener('keydown', handleWindowKeydown)
})
</script>

<template>
    <main id="main-container" aria-label="クイックメモ" @click.self="hideWindow">
        <section class="memo-card" aria-labelledby="memo-title">
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
        <p class="backdrop-tip"><kbd>Esc</kbd> で閉じます</p>
    </main>
</template>
