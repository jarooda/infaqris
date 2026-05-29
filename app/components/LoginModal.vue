<template>
  <div
    class="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50"
    @click.self="$emit('close')"
  >
    <div
      class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl w-80 flex flex-col items-center gap-4"
    >
      <img src="/android-chrome-192x192.png" alt="InfaQRIS" class="w-12 h-12 rounded-xl" />
      <div class="text-center">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Sign in</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">To add QRIS locations</p>
      </div>
      <div ref="gsiButtonRef" class="flex justify-center min-h-[44px]" />
      <button
        class="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        @click="$emit('close')"
      >
        Cancel
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
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
