<script setup lang="ts">
import PageHeading from './PageHeading.vue'
import UpdateStatusBar from './UpdateStatusBar.vue'
import type { UpdateStatus } from '../../electron/shared/electron-api'

defineProps<{
    filename: string | null
    isDirty: boolean
    updateStatus: UpdateStatus | null
    updatePreviewEnabled: boolean
}>()

defineEmits<{
    close: []
    dismissUpdate: []
    restartUpdate: []
    previewUpdateStatus: [status: UpdateStatus | null]
}>()
</script>

<template>
    <header class="memo-header">
        <PageHeading eyebrow="MAYO / QUICK NOTE" title="クイックメモ" title-id="memo-title">
            <template #below>
                <div v-if="filename" class="document-label-row">
                    <p class="document-filename" :title="filename">{{ filename }}</p>
                    <span
                        v-if="isDirty"
                        class="unsaved-indicator"
                        role="img"
                        aria-label="未保存の変更があります"
                        title="未保存の変更があります"
                    ></span>
                </div>
            </template>
        </PageHeading>
        <UpdateStatusBar
            :status="updateStatus"
            :preview-enabled="updatePreviewEnabled"
            @dismiss="$emit('dismissUpdate')"
            @restart="$emit('restartUpdate')"
            @preview-status="$emit('previewUpdateStatus', $event)"
        />
        <button
            class="icon-button close-button"
            type="button"
            aria-label="閉じる"
            title="閉じる (Esc)"
            @click="$emit('close')"
        >
            <img class="close-button" src="../assets/images/close.svg" alt="">
        </button>
    </header>
</template>
