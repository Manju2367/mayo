import './style.scss'

const memo = document.getElementById('memo')
const saveButton = document.getElementById('save-button')
const closeButton = document.getElementById('close-button')
const saveStatus = document.getElementById('save-status')
const characterCount = document.getElementById('character-count')

const updateCharacterCount = () => {
    if (memo instanceof HTMLTextAreaElement && characterCount) {
        characterCount.textContent = `${memo.value.length.toLocaleString('ja-JP')} 文字`
    }
}

const saveMemo = () => {
    if (!(memo instanceof HTMLTextAreaElement)) return

    window.electronAPI.send(memo.value)

    if (saveStatus) {
        saveStatus.textContent = '保存しました'
        saveStatus.classList.add('is-saved')
    }
}

if (memo instanceof HTMLTextAreaElement) {
    memo.addEventListener('input', () => {
        updateCharacterCount()
        if (saveStatus) {
            saveStatus.textContent = '未保存の変更'
            saveStatus.classList.remove('is-saved')
        }
    })

    memo.addEventListener('keydown', (event) => {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
            event.preventDefault()
            saveMemo()
        }
    })
}

saveButton?.addEventListener('click', saveMemo)
closeButton?.addEventListener('click', () => window.electronAPI.hideWindow())

window.electronAPI.onShow(() => {
    if (memo instanceof HTMLTextAreaElement) memo.focus()
})

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') window.electronAPI.hideWindow()
})
