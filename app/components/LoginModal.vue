<template>
  <Dialog :open="true" size="sm" :show-close="false" @close="$emit('close')">
    <div class="flex flex-col items-center gap-4 py-6 text-center">
      <img src="/android-chrome-192x192.png" alt="InfaQRIS" class="w-12 h-12 rounded-xl" />
      <div>
        <h2 class="text-lg font-semibold text-(--text-primary)">Sign in</h2>
        <p class="text-sm text-(--text-secondary) mt-1">To add QRIS locations</p>
      </div>
      <div ref="gsiButtonRef" class="flex justify-center min-h-11" />
      <Button variant="ghost" size="sm" @click="$emit('close')">Cancel</Button>
      <NuxtLink
        to="/privacy"
        class="text-xs text-(--text-tertiary) hover:text-(--accent) transition-colors"
        @click="$emit('close')"
      >
        Kebijakan Privasi <em>/ Privacy Policy</em>
      </NuxtLink>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { Dialog } from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'

defineEmits<{ close: [] }>()

const gsiButtonRef = ref<HTMLElement | null>(null)

onMounted(async () => {
  // Wait for GSI script to load (max 5 s)
  for (let i = 0; i < 50; i++) {
    if ((window as any).google?.accounts?.id) break
    await new Promise((r) => setTimeout(r, 100))
  }
  const gsi = (window as any).google?.accounts?.id
  if (!gsi || !gsiButtonRef.value) return
  gsi.renderButton(gsiButtonRef.value, {
    theme: 'outline',
    size: 'large',
    text: 'sign_in_with',
    shape: 'rectangular',
    width: '240',
  })
})
</script>
