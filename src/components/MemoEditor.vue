<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
    modelValue: string
    placeholder: string
}>()

const emit = defineEmits<{
    'update:modelValue': [value: string]
    input: []
    save: []
}>()

const textarea = ref<HTMLTextAreaElement | null>(null)

const focus = () => textarea.value?.focus()

const handleInput = (event: Event) => {
    emit('update:modelValue', (event.target as HTMLTextAreaElement).value)
    emit('input')
}

const handleKeydown = (event: KeyboardEvent) => {
    const input = textarea.value
    if (!input) return

    if (event.key === 'Tab') {
        event.preventDefault()
        input.setRangeText('\t', input.selectionStart, input.selectionEnd, 'end')
        emit('update:modelValue', input.value)
        emit('input')
        return
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault()
        emit('save')
    }
}

defineExpose({ focus })
</script>

<template>
    <label class="sr-only" for="memo">メモの内容</label>
    <textarea
        id="memo"
        ref="textarea"
        :value="modelValue"
        name="memo"
        :placeholder="placeholder"
        spellcheck="false"
        autofocus
        @input="handleInput"
        @keydown="handleKeydown"
    ></textarea>
</template>
