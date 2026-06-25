<template>
  <VitePwaManifest />
  <NuxtPage />
  <Toaster position="top-center" />
</template>

<script setup lang="ts">
import { Toaster } from '~/components/ui/toast'

useHead({
  link: [
    { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
    { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
    { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
    { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
  ],
  script: [{ src: 'https://accounts.google.com/gsi/client', async: true, defer: true }],
})

const { startSync } = useSync()
onMounted(() => startSync())
</script>
