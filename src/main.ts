const send = (message: string) => {
    // @ts-expect-error electron API
    window.electron.send(message)
}

document.addEventListener('DOMContentLoaded', () => {
    const elemMemo = document.getElementById('memo')

    if (elemMemo !== null && elemMemo instanceof HTMLTextAreaElement) {
        elemMemo.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.shiftKey) {
                e.preventDefault()
                send(elemMemo.value)
            }
        })
    }

    // @ts-expect-error electron API
    window.electron.onShow(() => {
        if (elemMemo !== null && elemMemo instanceof HTMLTextAreaElement) {
            elemMemo.focus()
        }
    })
})

document.addEventListener('keydown', (e) => {
    // @ts-expect-error electron API
    window.electron.log(e.key)
})