<script setup lang="ts">
defineProps<{
    eyebrow: string
    title: string
    titleId: string
}>()
</script>

<template>
    <div class="page-heading">
        <iframe class="brand-mark" src="/mayo-icon-embed.html" frameborder="0" allowtransparency="true"></iframe>
        <div class="heading-copy">
            <p class="eyebrow">{{ eyebrow }}</p>
            <h1 :id="titleId">{{ title }}</h1>
            <slot name="below"></slot>
        </div>
    </div>
</template>
