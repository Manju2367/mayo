<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'

const memo = ref('')
const memoInput = ref<HTMLTextAreaElement | null>(null)
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

const handleMemoKeydown = (event: KeyboardEvent) => {
    const input = memoInput.value
    if (!input) return

    if (event.key === 'Tab') {
        event.preventDefault()
        input.setRangeText('\t', input.selectionStart, input.selectionEnd, 'end')
        memo.value = input.value
        handleInput()
        return
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault()
        void saveMemo()
    }
}

const hideWindow = () => window.electronAPI.hideWindow()

const handleWindowKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Tab') event.preventDefault()
    if (event.key === 'Escape') hideWindow()
}

onMounted(() => {
    window.addEventListener('keydown', handleWindowKeydown)
    window.electronAPI.onShow(() => memoInput.value?.focus())
    memoInput.value?.focus()
})

onUnmounted(() => {
    window.removeEventListener('keydown', handleWindowKeydown)
})
</script>

<template>
    <main id="main-container" aria-label="クイックメモ" @click.self="hideWindow">
        <section class="memo-card" aria-labelledby="memo-title">
            <header class="memo-header">
                <div class="brand-mark" aria-hidden="true">m</div>
                <div class="heading-copy">
                    <p class="eyebrow">MAYO / QUICK NOTE</p>
                    <h1 id="memo-title">クイックメモ</h1>
                    <div class="document-label-row">
                        <p
                            v-if="currentFilename"
                            class="document-filename"
                            :title="currentFilename"
                        >{{ currentFilename }}</p>
                        <span
                            v-if="currentFilename && isDirty"
                            class="unsaved-indicator"
                            role="img"
                            aria-label="未保存の変更があります"
                            title="未保存の変更があります"
                        ></span>
                    </div>
                </div>
                <button
                    class="icon-button close-button"
                    type="button"
                    aria-label="閉じる"
                    title="閉じる (Esc)"
                    @click="hideWindow"
                >
                    <img class="close-button" src="./assets/images/close.svg" alt="">
                </button>
            </header>

            <label class="sr-only" for="memo">メモの内容</label>
            <textarea
                id="memo"
                ref="memoInput"
                v-model="memo"
                name="memo"
                placeholder="思いついたことを書き留める…"
                spellcheck="false"
                autofocus
                @input="handleInput"
                @keydown="handleMemoKeydown"
            ></textarea>

            <footer class="memo-footer">
                <div class="footer-meta">
                    <span class="save-status" :class="{ 'is-saved': saveSucceeded }" role="status" aria-live="polite">{{ saveStatus }}</span>
                    <span class="character-count">{{ characterCount }}</span>
                </div>
                <div class="footer-actions">
                    <div class="shortcut-hint">
                        <span class="shortcut"><kbd>Ctrl</kbd><span>+</span><kbd>S</kbd><span class="shortcut-label">保存</span></span>
                        <span class="shortcut-divider" aria-hidden="true"></span>
                        <span class="shortcut"><kbd>Esc</kbd><span class="shortcut-label">閉じる</span></span>
                    </div>
                    <button class="save-button" type="button" :disabled="isSaving" @click="saveMemo">
                        <img src="./assets/images/save.svg" alt="">
                        <span>保存</span>
                        <kbd>Ctrl S</kbd>
                    </button>
                </div>
            </footer>
        </section>
        <p class="backdrop-tip"><kbd>Esc</kbd> で閉じます</p>
    </main>
</template>
