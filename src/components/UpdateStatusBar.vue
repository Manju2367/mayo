<script setup lang="ts">
import { ref, watch } from 'vue'
import type { UpdateStatus } from '../../electron/shared/electron-api'

const props = defineProps<{
    status: UpdateStatus | null
    previewEnabled: boolean
}>()

const emit = defineEmits<{
    dismiss: []
    restart: []
    previewStatus: [status: UpdateStatus | null]
}>()

const previewNotice = ref('')

watch(() => props.status, () => {
    previewNotice.value = ''
})

const changePreviewStatus = (event: Event) => {
    const value = (event.target as HTMLSelectElement).value
    previewNotice.value = ''

    const statuses: Record<string, UpdateStatus | null> = {
        '': null,
        available: { status: 'available', version: '99.0.0-preview' },
        downloading: { status: 'downloading', version: '99.0.0-preview', percent: 42 },
        downloaded: { status: 'downloaded', version: '99.0.0-preview' },
        error: { status: 'error', message: 'Preview error' }
    }

    emit('previewStatus', statuses[value] ?? null)
}

const changePreviewProgress = (event: Event) => {
    if (props.status?.status !== 'downloading') return
    emit('previewStatus', {
        ...props.status,
        percent: Number((event.target as HTMLInputElement).value)
    })
}

const handleRestart = () => {
    if (props.previewEnabled) {
        previewNotice.value = 'プレビュー中のため、更新は実行されません'
        return
    }
    emit('restart')
}
</script>

<template>
    <aside v-if="status || previewEnabled" class="update-status-bar" aria-live="polite">
        <div v-if="status" class="update-status-content">
            <span class="update-status-mark" aria-hidden="true">↻</span>
            <span class="update-status-message" :title="status.status === 'error' ? status.message : undefined">
                <template v-if="status.status === 'available'">
                    バージョン {{ status.version }} をダウンロード中…
                </template>
                <template v-else-if="status.status === 'downloading'">
                    バージョン {{ status.version }} をダウンロード中（{{ Math.floor(status.percent) }}%）
                </template>
                <template v-else-if="status.status === 'downloaded'">
                    バージョン {{ status.version }} を適用できます
                </template>
                <template v-else>
                    更新を確認できませんでした
                </template>
            </span>
            <div v-if="status.status === 'downloading'" class="update-status-progress" aria-hidden="true">
                <span :style="{ width: `${Math.max(0, Math.min(status.percent, 100))}%` }"></span>
            </div>
            <button
                v-if="status.status === 'downloaded'"
                class="update-apply-button"
                type="button"
                tabindex="-1"
                @click="handleRestart"
            >
                再起動して適用
            </button>
            <button
                v-if="status.status === 'error'"
                class="update-dismiss-button"
                type="button"
                tabindex="-1"
                aria-label="更新通知を閉じる"
                @click="emit('dismiss')"
            >×</button>
        </div>

        <div v-if="previewEnabled" class="update-preview-controls">
            <span class="update-preview-label">更新プレビュー</span>
            <select
                :value="status?.status ?? ''"
                tabindex="-1"
                aria-label="プレビューする更新状態"
                @change="changePreviewStatus"
            >
                <option value="">非表示</option>
                <option value="available">ダウンロード開始</option>
                <option value="downloading">ダウンロード中</option>
                <option value="downloaded">更新準備完了</option>
                <option value="error">エラー</option>
            </select>
            <input
                v-if="status?.status === 'downloading'"
                type="range"
                min="0"
                max="100"
                :value="status.percent"
                tabindex="-1"
                aria-label="プレビュー進捗率"
                @input="changePreviewProgress"
            >
        </div>
        <span v-if="previewNotice" class="update-preview-notice" role="status">{{ previewNotice }}</span>
    </aside>
</template>
