<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import MemoEditor from './components/MemoEditor.vue'
import MemoFooter from './components/MemoFooter.vue'
import MemoHeader from './components/MemoHeader.vue'
import NoteListPage from './components/NoteListPage.vue'
import ConfirmDiscardDialog from './components/ConfirmDiscardDialog.vue'
import ConfirmQuitDialog from './components/ConfirmQuitDialog.vue'
import type { InputDebugEvent, InputDebugTarget, NoteDocument, UpdateStatus } from '../electron/shared/electron-api'

const placeholderOptions = [
    'メモを書き留める',
    'ささっとメモる',
    '何を書こうか？',
    '何か書いてみよう',
    'メモメモ…',
    'マヨってる？',
    'アイデアを書き残す',
    '忘れないようにメモしよう',
    '何を書こうとしてたんだっけ…？',
    '未来の自分へ'
]

const choosePlaceholder = (): string => {
    const index = Math.floor(Math.random() * placeholderOptions.length)
    return placeholderOptions[index] ?? 'メモを書き留める'
}

const currentPage = ref<'memo' | 'list'>('memo')
const memo = ref('')
const placeholder = ref(choosePlaceholder())
const memoEditor = ref<{ focus: () => void } | null>(null)
const noteListPage = ref<{ focus: () => void } | null>(null)
const currentFilename = ref<string | null>(null)
const lastSavedContent = ref<string | null>(null)
const isSaving = ref(false)
const saveStatus = ref('すぐに書き始められます')
const saveSucceeded = ref(false)
const pendingAction = ref<{ type: 'open'; note: NoteDocument } | { type: 'new' } | null>(null)
const isQuitDialogOpen = ref(false)
const quitSaveError = ref('')
const updateStatus = ref<UpdateStatus | null>(null)
const updatePreviewEnabled = ref(false)

const characterCount = computed(() => `${memo.value.length.toLocaleString('ja-JP')} 文字`)
const isDirty = computed(() =>
    lastSavedContent.value === null ? memo.value.length > 0 : memo.value !== lastSavedContent.value
)

const saveMemo = async (): Promise<boolean> => {
    if (isSaving.value) return false

    isSaving.value = true
    const content = memo.value
    saveSucceeded.value = false
    saveStatus.value = '保存中…'

    try {
        currentFilename.value = await window.electronAPI.send(content, currentFilename.value)
        lastSavedContent.value = content
        saveSucceeded.value = memo.value === content
        saveStatus.value = saveSucceeded.value ? '保存しました' : ''
        return saveSucceeded.value
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        saveStatus.value = message.includes('既に存在します')
            ? '同名のファイルがあります'
            : '保存できませんでした'
        return false
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

const applyOpenNote = async (note: NoteDocument) => {
    pendingAction.value = null
    memo.value = note.content
    currentFilename.value = note.filename
    lastSavedContent.value = note.content
    saveSucceeded.value = true
    saveStatus.value = '保存済み'
    await returnToMemo()
}

const openNote = async (note: NoteDocument) => {
    if (isDirty.value) {
        pendingAction.value = { type: 'open', note }
        await nextTick()
        return
    }

    await applyOpenNote(note)
}

const handleNoteDeleted = (filename: string) => {
    if (currentFilename.value !== filename) return
    memo.value = ''
    currentFilename.value = null
    lastSavedContent.value = null
    placeholder.value = choosePlaceholder()
    saveSucceeded.value = false
    saveStatus.value = 'すぐに書き始められます'
}

const applyNewMemo = async () => {
    pendingAction.value = null
    memo.value = ''
    placeholder.value = choosePlaceholder()
    currentFilename.value = null
    lastSavedContent.value = null
    saveSucceeded.value = false
    saveStatus.value = 'すぐに書き始められます'
    await returnToMemo()
}

const createNewMemo = async () => {
    if (isDirty.value) {
        pendingAction.value = { type: 'new' }
        await nextTick()
        return
    }

    await applyNewMemo()
}

const cancelPendingAction = async () => {
    pendingAction.value = null
    await nextTick()
    if (currentPage.value === 'list') noteListPage.value?.focus()
    else memoEditor.value?.focus()
}

const confirmPendingAction = async () => {
    const action = pendingAction.value
    if (!action) return
    if (action.type === 'open') await applyOpenNote(action.note)
    else await applyNewMemo()
}

const requestQuit = async () => {
    if (!isDirty.value) {
        window.electronAPI.resolveQuit(true)
        return
    }

    pendingAction.value = null
    quitSaveError.value = ''
    isQuitDialogOpen.value = true
    await nextTick()
    window.electronAPI.showQuitPrompt()
}

const cancelQuit = async () => {
    isQuitDialogOpen.value = false
    quitSaveError.value = ''
    window.electronAPI.resolveQuit(false)
    await nextTick()
    if (currentPage.value === 'list') noteListPage.value?.focus()
    else memoEditor.value?.focus()
}

const discardAndQuit = () => {
    isQuitDialogOpen.value = false
    window.electronAPI.resolveQuit(true)
}

const saveAndQuit = async () => {
    if (isSaving.value) return
    quitSaveError.value = ''
    if (await saveMemo()) {
        isQuitDialogOpen.value = false
        window.electronAPI.resolveQuit(true)
    } else {
        quitSaveError.value = '保存できませんでした。内容を確認して、もう一度お試しください。'
    }
}

const restartToInstallUpdate = () => {
    window.electronAPI.requestUpdateInstall()
}

const setPreviewUpdateStatus = (status: UpdateStatus | null) => {
    if (!updatePreviewEnabled.value) return
    updateStatus.value = status
}

const handleWindowKeydown = (event: KeyboardEvent) => {
    if (event.isComposing) return

    if (isQuitDialogOpen.value) return

    if (pendingAction.value) {
        if (event.key === 'Escape') {
            event.preventDefault()
            void cancelPendingAction()
        }
        return
    }

    const key = event.key.toLowerCase()
    const hasModifier = event.ctrlKey || event.metaKey

    if (hasModifier && key === 'l') {
        event.preventDefault()
        if (currentPage.value === 'memo') void showNoteList()
        else void returnToMemo()
        return
    }

    if (hasModifier && key === 'n') {
        event.preventDefault()
        void createNewMemo()
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

const handleInputModalityKeydown = (event: KeyboardEvent) => {
    if (event.isComposing || event.key === 'Shift' || event.key === 'Control' || event.key === 'Alt' || event.key === 'Meta') return
    document.documentElement.classList.add('is-keyboard-mode')
}

const handlePointerActivity = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse') return
    document.documentElement.classList.remove('is-keyboard-mode')
}

const handleBrandMarkActivation = (event: MessageEvent) => {
    if (event.data?.type !== 'mayo-brand-mark-activated') return

    const brandFrame = document.querySelector<HTMLIFrameElement>('.brand-mark')
    if (!brandFrame || event.source !== brandFrame.contentWindow) return

    if (currentPage.value === 'list') noteListPage.value?.focus()
    else memoEditor.value?.focus()
}

const describeInputTarget = (element: Element | null): InputDebugTarget | null => {
    if (!element) return null

    const interactive = element.closest('button, a, input, textarea, select, [role="button"], [tabindex]') ?? element
    const tagName = interactive.tagName.toLowerCase()
    const isNoteName = interactive.matches('.note-open-button')
    const isTableHeader = interactive.matches('th')
    const label = isNoteName || isTableHeader
        ? (interactive.textContent ?? '').trim().slice(0, 100)
        : ''

    return {
        tagName,
        id: interactive.id,
        className: interactive.getAttribute('class') ?? '',
        role: interactive.getAttribute('role') ?? '',
        ariaLabel: interactive.getAttribute('aria-label') ?? '',
        label,
        noteIndex: interactive.getAttribute('data-note-index') ?? '',
        tabIndex: interactive instanceof HTMLElement ? interactive.tabIndex : -1
    }
}

const logInputEvent = (event: Event) => {
    const rawTarget = event.target instanceof Element ? event.target : null
    const eventTarget = rawTarget
    const target = rawTarget?.closest('button, a, input, textarea, select, [role="button"], [tabindex]') ?? rawTarget
    const focusedTarget = describeInputTarget(document.activeElement)
    const payload: InputDebugEvent = {
        eventType: event.type as InputDebugEvent['eventType'],
        eventTarget: eventTarget ? {
            tagName: eventTarget.tagName.toLowerCase(),
            id: eventTarget.id,
            className: eventTarget.getAttribute('class') ?? '',
            role: eventTarget.getAttribute('role') ?? '',
            ariaLabel: eventTarget.getAttribute('aria-label') ?? '',
            label: '',
            noteIndex: eventTarget.getAttribute('data-note-index') ?? '',
            tabIndex: eventTarget instanceof HTMLElement ? eventTarget.tabIndex : -1
        } : null,
        target: describeInputTarget(target),
        focusedTarget,
        defaultPrevented: event.defaultPrevented
    }

    if (event instanceof KeyboardEvent) {
        const hasModifier = event.ctrlKey || event.metaKey || event.altKey
        payload.key = event.key.length === 1 && !hasModifier ? '[printable]' : event.key
        payload.ctrlKey = event.ctrlKey
        payload.shiftKey = event.shiftKey
        payload.altKey = event.altKey
        payload.metaKey = event.metaKey
        payload.isComposing = event.isComposing
        payload.repeat = event.repeat
    } else if (event instanceof PointerEvent) {
        payload.button = event.button
        payload.pointerType = event.pointerType
    } else if (event instanceof MouseEvent) {
        payload.button = event.button
        payload.detail = event.detail
    }

    // Capture phaseで記録するとVue側のpreventDefaultより先になるため、伝播完了後に状態を確定する。
    window.setTimeout(() => {
        payload.defaultPrevented = event.defaultPrevented
        window.electronAPI.logInputDebugEvent(payload)
    }, 0)
}

onMounted(() => {
    window.addEventListener('keydown', handleWindowKeydown)
    document.addEventListener('keydown', handleInputModalityKeydown, true)
    document.addEventListener('pointermove', handlePointerActivity, true)
    document.addEventListener('pointerdown', handlePointerActivity, true)
    window.addEventListener('message', handleBrandMarkActivation)
    window.electronAPI.onQuitRequest(requestQuit)
    window.electronAPI.onUpdateStatus((status) => {
        updateStatus.value = status
    })
    void window.electronAPI.isUpdatePreviewEnabled().then((enabled) => {
        updatePreviewEnabled.value = enabled
    })
    window.electronAPI.readyForQuitRequests()
    window.electronAPI.onShow(() => {
        if (currentPage.value === 'list') noteListPage.value?.focus()
        else memoEditor.value?.focus()
    })
    memoEditor.value?.focus()
    void window.electronAPI.isInputDebugEnabled().then((enabled) => {
        if (!enabled) return
        document.addEventListener('keydown', logInputEvent, true)
        document.addEventListener('pointerdown', logInputEvent, true)
        document.addEventListener('click', logInputEvent, true)
    })
})

onUnmounted(() => {
    window.removeEventListener('keydown', handleWindowKeydown)
    document.removeEventListener('keydown', handleInputModalityKeydown, true)
    document.removeEventListener('pointermove', handlePointerActivity, true)
    document.removeEventListener('pointerdown', handlePointerActivity, true)
    window.removeEventListener('message', handleBrandMarkActivation)
    document.removeEventListener('keydown', logInputEvent, true)
    document.removeEventListener('pointerdown', logInputEvent, true)
    document.removeEventListener('click', logInputEvent, true)
})
</script>

<template>
    <main
        id="main-container"
        :aria-label="currentPage === 'memo' ? 'クイックメモ' : '保存したメモ'"
    >
        <section v-if="currentPage === 'memo'" class="memo-card" aria-labelledby="memo-title">
            <MemoHeader
                :filename="currentFilename"
                :is-dirty="isDirty"
                :update-status="updateStatus"
                :update-preview-enabled="updatePreviewEnabled"
                @close="hideWindow"
                @dismiss-update="updateStatus = null"
                @restart-update="restartToInstallUpdate"
                @preview-update-status="setPreviewUpdateStatus"
            />
            <MemoEditor
                ref="memoEditor"
                v-model="memo"
                :placeholder="placeholder"
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
            :update-status="updateStatus"
            :update-preview-enabled="updatePreviewEnabled"
            @back="returnToMemo"
            @open="openNote"
            @deleted="handleNoteDeleted"
            @dismiss-update="updateStatus = null"
            @restart-update="restartToInstallUpdate"
            @preview-update-status="setPreviewUpdateStatus"
        />
        <ConfirmDiscardDialog
            v-if="pendingAction"
            :mode="pendingAction.type"
            :filename="pendingAction.type === 'open' ? pendingAction.note.filename : undefined"
            @cancel="cancelPendingAction"
            @confirm="confirmPendingAction"
        />
        <ConfirmQuitDialog
            v-if="isQuitDialogOpen"
            :is-saving="isSaving"
            :save-error="quitSaveError"
            @save="saveAndQuit"
            @discard="discardAndQuit"
            @cancel="cancelQuit"
        />
        <p class="backdrop-tip">
            <template v-if="currentPage === 'list'">
                <kbd>Esc</kbd> / <kbd>Ctrl</kbd>+<kbd>L</kbd> メモへ戻る
            </template>
            <template v-else>
                <kbd>Esc</kbd> 閉じる
                <span class="page-shortcut-hint"><kbd>Ctrl</kbd>+<kbd>L</kbd> 一覧</span>
            </template>
        </p>
    </main>
</template>
