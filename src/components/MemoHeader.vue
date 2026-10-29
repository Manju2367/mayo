<script setup lang="ts">
import PageHeading from './PageHeading.vue'

defineProps<{
    filename: string | null
    isDirty: boolean
}>()

defineEmits<{
    close: []
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
