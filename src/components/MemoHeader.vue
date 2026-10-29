<script setup lang="ts">
const brandIcon = `${import.meta.env.BASE_URL}icon-bg-512.png`

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
        <img class="brand-mark" :src="brandIcon" alt="">
        <div class="heading-copy">
            <p class="eyebrow">MAYO / QUICK NOTE</p>
            <h1 id="memo-title">クイックメモ</h1>
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
        </div>
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
