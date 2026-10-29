<script setup lang="ts">
const brandIcon = `${import.meta.env.BASE_URL}icon-bg-512.png`

defineProps<{
    eyebrow: string
    title: string
    titleId: string
}>()
</script>

<template>
    <div class="page-heading">
        <img class="brand-mark" :src="brandIcon" alt="">
        <div class="heading-copy">
            <p class="eyebrow">{{ eyebrow }}</p>
            <h1 :id="titleId">{{ title }}</h1>
            <slot name="below"></slot>
        </div>
    </div>
</template>
