<script setup lang="ts">
import { onMounted, ref } from 'vue'

defineProps<{
    mode: 'open' | 'new'
    filename?: string
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
    const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('.confirm-dialog button'))
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
            class="confirm-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="discard-dialog-title"
            aria-describedby="discard-dialog-description"
            @keydown="handleKeydown"
        >
            <div class="dialog-icon" aria-hidden="true">!</div>
            <p class="dialog-eyebrow">UNSAVED CHANGES</p>
            <h2 id="discard-dialog-title">編集内容を破棄しますか？</h2>
            <p id="discard-dialog-description" class="dialog-description">
                <template v-if="mode === 'open'">
                    保存されていない変更があります。<br>
                    「{{ filename }}」を開くと、現在の編集内容は失われます。
                </template>
                <template v-else>
                    保存されていない変更があります。<br>
                    新しいメモを作成すると、現在の編集内容は失われます。
                </template>
            </p>
            <div class="dialog-actions">
                <button ref="cancelButton" class="dialog-cancel-button" type="button" @click="emit('cancel')">
                    編集を続ける
                </button>
                <button class="dialog-confirm-button" type="button" @click="emit('confirm')">
                    {{ mode === 'open' ? '破棄して開く' : '破棄して新規作成' }}
                </button>
            </div>
        </section>
    </div>
</template>
