<template>
  <div class="space-y-4">
    <!-- Camera -->
    <div id="qr-reader-container" class="w-full rounded-lg overflow-hidden bg-(--surface-sunken)" />
    <p v-if="scanError" class="text-sm text-(--text-secondary) italic">{{ scanError }}</p>

    <!-- Divider -->
    <div class="relative">
      <div class="absolute inset-0 flex items-center">
        <div class="w-full border-t border-(--border-default)" />
      </div>
      <div class="relative flex justify-center text-xs">
        <span class="px-2 bg-(--surface-overlay) text-(--text-tertiary)">or upload an image</span>
      </div>
    </div>

    <!-- Image upload -->
    <label
      :class="[
        'qr-dropzone flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-xl cursor-pointer transition-colors',
        decodeError ? 'qr-dropzone--error' : decodeSuccess ? 'qr-dropzone--success' : '',
      ]"
    >
      <Icon
        :name="decodeSuccess ? 'material-symbols:check-circle' : 'material-symbols:add-a-photo'"
        class="text-3xl mb-1"
        :class="decodeSuccess ? 'text-(--success)' : 'text-(--text-tertiary)'"
      />
      <span
        class="text-sm"
        :class="decodeSuccess ? 'text-(--success-text) font-medium' : 'text-(--text-secondary)'"
      >
        {{ decodeSuccess ? 'QR decoded — tap Next to continue' : 'Upload QR code image' }}
      </span>
      <span v-if="decodeError" class="text-xs text-(--danger-text) mt-1">{{ decodeError }}</span>
      <input type="file" accept="image/*" class="hidden" @change="onFileUpload" />
    </label>

    <!-- Hidden element required by html5-qrcode for file scanning -->
    <div id="qr-file-reader" class="hidden" />
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{ scanned: [value: string] }>()

const scanError = ref('')
const decodeError = ref('')
const decodeSuccess = ref(false)
let scanner: any = null

onMounted(async () => {
  try {
    const { Html5Qrcode } = await import('html5-qrcode')
    scanner = new Html5Qrcode('qr-reader-container')
    await scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (text: string) => emit('scanned', text),
      () => {},
    )
  } catch {
    scanError.value = 'Camera unavailable — upload an image instead.'
  }
})

onUnmounted(async () => {
  if (scanner?.isScanning) await scanner.stop().catch(() => {})
})

async function onFileUpload(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  decodeError.value = ''
  decodeSuccess.value = false

  try {
    const { Html5Qrcode } = await import('html5-qrcode')
    const fileScanner = new Html5Qrcode('qr-file-reader')
    const result = await fileScanner.scanFile(file, false)
    decodeSuccess.value = true
    emit('scanned', result)
  } catch {
    decodeError.value = 'No QR code found. Try a clearer or closer photo.'
  }
}

function reset() {
  decodeSuccess.value = false
  decodeError.value = ''
}

defineExpose({ reset })
</script>

<style scoped>
.qr-dropzone {
  border-color: var(--border-default);
  background: var(--surface-card);
}
.qr-dropzone:hover {
  border-color: var(--accent);
  background: var(--accent-subtle);
}
.qr-dropzone--error {
  border-color: var(--danger);
  background: var(--danger-subtle);
}
.qr-dropzone--error:hover {
  border-color: var(--danger);
  background: var(--danger-subtle);
}
.qr-dropzone--success {
  border-color: var(--success);
  background: var(--success-subtle);
}
.qr-dropzone--success:hover {
  border-color: var(--success);
  background: var(--success-subtle);
}
</style>
