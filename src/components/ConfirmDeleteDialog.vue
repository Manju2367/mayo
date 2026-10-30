<script setup lang="ts">
import { onMounted, ref } from 'vue'

defineProps<{
    filename: string
}>()

const emit = defineEmits<{
    cancel: []
    confirm: []
}>()

const cancelButton = ref<HTMLButtonElement | null>(null)

const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        emit('cancel')
        return
    }

    if (event.key !== 'Tab') return
    const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('.confirm-delete-dialog button'))
    const first = buttons[0]
    const last = buttons[buttons.length - 1]
    if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last?.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first?.focus()
    }
}

onMounted(() => cancelButton.value?.focus())
</script>

<template>
    <div class="dialog-backdrop" @click.self="emit('cancel')">
        <section
            class="confirm-dialog confirm-delete-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
            aria-describedby="delete-dialog-description"
            @keydown="handleKeydown"
        >
            <div class="dialog-icon is-danger" aria-hidden="true">
                <img src="../assets/images/trash.svg" alt="">
            </div>
            <p class="dialog-eyebrow">DELETE NOTE</p>
            <h2 id="delete-dialog-title">メモを削除しますか？</h2>
            <p id="delete-dialog-description" class="dialog-description">
                「{{ filename }}」を完全に削除します。<br>
                この操作は元に戻せません。
            </p>
            <div class="dialog-actions">
                <button ref="cancelButton" class="dialog-cancel-button" type="button" @click="emit('cancel')">
                    キャンセル
                </button>
                <button class="dialog-confirm-button" type="button" @click="emit('confirm')">
                    削除する
                </button>
            </div>
        </section>
    </div>
</template>
