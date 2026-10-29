<script setup lang="ts">
defineProps<{
    status: string
    characterCount: string
    isSaving: boolean
    saveSucceeded: boolean
}>()

defineEmits<{
    save: []
}>()
</script>

<template>
    <footer class="memo-footer">
        <div class="footer-meta">
            <span class="save-status" :class="{ 'is-saved': saveSucceeded }" role="status" aria-live="polite">{{ status }}</span>
            <span class="character-count">{{ characterCount }}</span>
        </div>
        <div class="footer-actions">
            <div class="shortcut-hint">
                <span class="shortcut"><kbd>Ctrl</kbd><span>+</span><kbd>S</kbd><span class="shortcut-label">保存</span></span>
                <span class="shortcut-divider" aria-hidden="true"></span>
                <span class="shortcut"><kbd>Ctrl</kbd><span>+</span><kbd>N</kbd><span class="shortcut-label">新規</span></span>
                <span class="shortcut-divider" aria-hidden="true"></span>
                <span class="shortcut"><kbd>Esc</kbd><span class="shortcut-label">閉じる</span></span>
            </div>
            <button class="save-button" type="button" :disabled="isSaving" @click="$emit('save')">
                <img src="../assets/images/save.svg" alt="">
                <span>保存</span>
                <kbd>Ctrl S</kbd>
            </button>
        </div>
    </footer>
</template>
