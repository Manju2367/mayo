<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { UpdateStatus } from '../../electron/shared/electron-api'

defineProps<{ status: Exclude<UpdateStatus, { status: 'error' }> }>()
const emit = defineEmits<{ later: []; restart: [] }>()
const laterButton = ref<HTMLButtonElement | null>(null)

const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        emit('later')
        return
    }
    if (event.key !== 'Tab') return
    const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('.update-dialog button:not(:disabled)'))
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

onMounted(() => laterButton.value?.focus())
</script>

<template>
    <div class="dialog-backdrop">
        <section
            class="confirm-dialog update-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="update-dialog-title"
            aria-describedby="update-dialog-description"
            @keydown="handleKeydown"
        >
            <div class="dialog-icon update-dialog-icon" aria-hidden="true">↻</div>
            <p class="dialog-eyebrow">MAYO UPDATE</p>
            <h2 id="update-dialog-title">
                {{ status.status === 'downloaded' ? 'アップデートの準備ができました' : '新しいバージョンがあります' }}
            </h2>
            <p id="update-dialog-description" class="dialog-description">
                バージョン {{ status.version }}
                <template v-if="status.status === 'available'">をダウンロードしています…</template>
                <template v-else-if="status.status === 'downloading'">をダウンロードしています（{{ Math.floor(status.percent) }}%）</template>
                <template v-else>を適用するには、Mayoを再起動してください。</template>
            </p>
            <div v-if="status.status === 'downloading'" class="update-progress" aria-hidden="true">
                <span :style="{ width: `${Math.max(0, Math.min(status.percent, 100))}%` }"></span>
            </div>
            <div class="dialog-actions">
                <button ref="laterButton" class="dialog-cancel-button" type="button" @click="emit('later')">後で</button>
                <button
                    v-if="status.status === 'downloaded'"
                    class="dialog-confirm-button"
                    type="button"
                    @click="emit('restart')"
                >
                    再起動して適用
                </button>
            </div>
        </section>
    </div>
</template>
