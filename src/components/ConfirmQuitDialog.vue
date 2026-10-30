<script setup lang="ts">
import { onMounted, ref } from 'vue'

defineProps<{
    isSaving: boolean
    saveError: string
}>()

const emit = defineEmits<{
    save: []
    discard: []
    cancel: []
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
    const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('.confirm-quit-dialog button:not(:disabled)'))
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
    <div class="dialog-backdrop">
        <section
            class="confirm-dialog confirm-quit-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="quit-dialog-title"
            aria-describedby="quit-dialog-description"
            @keydown="handleKeydown"
        >
            <div class="dialog-icon is-danger" aria-hidden="true">!</div>
            <p class="dialog-eyebrow">UNSAVED CHANGES</p>
            <h2 id="quit-dialog-title">未保存のメモがあります</h2>
            <p id="quit-dialog-description" class="dialog-description">
                終了する前に、メモを保存しますか？
            </p>
            <p v-if="saveError" class="dialog-save-error" role="alert">{{ saveError }}</p>
            <div class="dialog-actions quit-dialog-actions">
                <button class="dialog-save-button" type="button" :disabled="isSaving" @click="emit('save')">
                    {{ isSaving ? '保存中…' : '保存' }}
                </button>
                <button class="dialog-discard-button" type="button" @click="emit('discard')">
                    保存しない
                </button>
                <button ref="cancelButton" class="dialog-cancel-button" type="button" @click="emit('cancel')">
                    キャンセル
                </button>
            </div>
        </section>
    </div>
</template>
