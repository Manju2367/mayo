import './style.scss'



const memo = document.getElementById('memo')
const saveButton = document.getElementById('save-button')
const closeButton = document.getElementById('close-button')
const saveStatus = document.getElementById('save-status')
const characterCount = document.getElementById('character-count')
const mainContainer = document.getElementById('main-container')
const documentFilename = document.getElementById('document-filename')
const unsavedIndicator = document.getElementById('unsaved-indicator')

let lastSavedContent: string | null = null
let currentFilename: string | null = null
let isSaving = false

const updateDocumentState = (isDirty: boolean) => {
    if (unsavedIndicator) unsavedIndicator.hidden = !isDirty || currentFilename === null
    if (documentFilename) {
        documentFilename.textContent = currentFilename ?? ''
        documentFilename.hidden = currentFilename === null
        documentFilename.title = currentFilename ?? ''
    }
}

const updateCharacterCount = () => {
    if (memo instanceof HTMLTextAreaElement && characterCount) {
        characterCount.textContent = `${memo.value.length.toLocaleString('ja-JP')} 文字`
    }
}

const saveMemo = async () => {
    if (!(memo instanceof HTMLTextAreaElement) || isSaving) return

    isSaving = true
    const content = memo.value
    if (saveButton instanceof HTMLButtonElement) saveButton.disabled = true

    if (saveStatus) saveStatus.textContent = '保存中…'

    try {
        const filename = await window.electronAPI.send(content, currentFilename)

        currentFilename = filename
        lastSavedContent = content
        const isDirty = memo.value !== content
        updateDocumentState(isDirty)

        if (saveStatus) {
            saveStatus.textContent = isDirty ? '' : '保存しました'
            saveStatus.classList.toggle('is-saved', !isDirty)
        }
    } catch (error) {
        if (saveStatus) {
            const message = error instanceof Error ? error.message : String(error)
            saveStatus.textContent = message.includes('既に存在します')
                ? '同名のファイルがあります'
                : '保存できませんでした'
            saveStatus.classList.remove('is-saved')
        }
    } finally {
        isSaving = false
        if (saveButton instanceof HTMLButtonElement) saveButton.disabled = false
    }
}



if (memo instanceof HTMLTextAreaElement) {
    memo.addEventListener('input', () => {
        updateCharacterCount()
        const isDirty = lastSavedContent === null || memo.value !== lastSavedContent
        updateDocumentState(isDirty)
        if (saveStatus) {
            saveStatus.textContent = isDirty ? '' : '保存済み'
            saveStatus.classList.toggle('is-saved', !isDirty && lastSavedContent !== null)
        }
    })

    memo.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            e.preventDefault()
            memo.setRangeText('\t', memo.selectionStart, memo.selectionEnd, 'end')
            memo.dispatchEvent(new Event('input', { bubbles: true }))
            return
        }

        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
            e.preventDefault()
            saveMemo()
        }
    })
}

saveButton?.addEventListener('click', saveMemo)
closeButton?.addEventListener('click', () => window.electronAPI.hideWindow())

window.electronAPI.onShow(() => {
    if (memo instanceof HTMLTextAreaElement) memo.focus()
})

document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') e.preventDefault()
    if (e.key === 'Escape') window.electronAPI.hideWindow()
})
