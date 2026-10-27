const send = (message: string) => {
    window.electronAPI.send(message)
}

document.addEventListener('DOMContentLoaded', () => {
    const elemMemo = document.getElementById('memo')

    if (elemMemo instanceof HTMLTextAreaElement) {
        elemMemo.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.shiftKey) {
                e.preventDefault()
                send(elemMemo.value)
            }
        })
    }

    window.electronAPI.onShow(() => {
        if (elemMemo instanceof HTMLTextAreaElement) {
            elemMemo.focus()
        }
    })
})

document.addEventListener('keydown', (e) => {
    switch (e.key) {
        case 'Escape': {
            window.electronAPI.hideWindow()

            break
        }
    }
})