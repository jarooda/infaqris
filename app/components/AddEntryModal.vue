<template>
  <Dialog
    :open="true"
    title="Add QRIS"
    :description="`Step ${step} of 3 — ${stepLabel}`"
    @close="$emit('close')"
  >
    <!-- Step indicators -->
    <div class="flex gap-1 mb-4">
      <div
        v-for="n in 3"
        :key="n"
        class="h-1 flex-1 rounded-full transition-colors"
        :class="n <= step ? 'bg-(--accent)' : 'bg-(--surface-muted)'"
      />
    </div>

    <!-- Step 1: QR Scan -->
    <ClientOnly v-if="step === 1">
      <QrScanner ref="qrScannerRef" @scanned="onScanned" />
      <div
        v-if="form.qris"
        class="mt-3 p-3 bg-(--success-subtle) border border-(--success) rounded-xl"
      >
        <p class="text-xs font-medium text-(--success-text) mb-1">QRIS string captured</p>
        <p class="text-xs text-(--success-text) font-mono break-all line-clamp-3">
          {{ form.qris }}
        </p>
      </div>
    </ClientOnly>

    <!-- Step 2: Name + Description -->
    <div v-if="step === 2" class="space-y-4">
      <!-- Parsed QRIS info -->
      <div v-if="parsedQris">
        <p class="text-xs font-medium text-(--text-secondary) mb-1.5">QRIS Info</p>
        <div class="p-3 bg-(--surface-sunken) border border-(--border-default) rounded-xl">
          <QrisInfo :info="parsedQris" />
        </div>
      </div>

      <!-- MCC mismatch: registered under a non-religious category -->
      <Alert v-if="hasMccMismatch" tone="warning">
        <template #icon><Icon name="material-symbols:warning-outline" /></template>
        <strong>Perhatian:</strong> QRIS ini terdaftar sebagai
        <strong>{{ parsedQris?.mccLabel || 'kategori non-keagamaan' }}</strong
        >, bukan sebagai masjid atau organisasi keagamaan.
        <em class="block mt-0.5 text-(--text-tertiary)">
          This QRIS is registered under
          <strong>{{ parsedQris?.mccLabel || 'a non-religious category' }}</strong
          >, not as a mosque or religious organization.
        </em>
        <NuxtLink
          to="/faq#mcc"
          class="inline-flex items-center gap-0.5 mt-1 text-(--accent) hover:underline"
        >
          <Icon name="material-symbols:info-outline" class="w-3 h-3" />
          Apa itu MCC?
        </NuxtLink>
      </Alert>

      <Field label="Name" required html-for="add-name">
        <Input id="add-name" v-model="form.name" type="text" maxlength="100" disabled />
      </Field>
      <Field label="Description" html-for="add-desc">
        <Textarea
          id="add-desc"
          v-model="form.description"
          rows="3"
          maxlength="100"
          placeholder="Optional description..."
        />
      </Field>
    </div>

    <!-- Step 3: Location -->
    <ClientOnly v-if="step === 3">
      <LocationPicker
        v-model="form.location"
        :initial-center="props.initialCenter"
        :locations="locations"
        :suppress-warning="submitting"
      />
      <div ref="turnstileRef" class="flex justify-center mt-3" />
    </ClientOnly>

    <p v-if="submitError" class="text-sm text-(--danger-text) text-center mt-4">
      {{ submitError }}
    </p>

    <template #footer>
      <Button v-if="step > 1" variant="secondary" @click="step--">Back</Button>
      <Button v-if="step < 3" variant="primary" :disabled="!canProceed" @click="step++"
        >Next</Button
      >
      <Button
        v-if="step === 3"
        variant="primary"
        :disabled="!canSubmit || submitting"
        @click="submit"
      >
        {{ submitting ? 'Saving...' : 'Save' }}
      </Button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { parseQris, isMccMismatch } from '~/utils/parseQris'
import QrisInfo from '~/components/QrisInfo.vue'
import { Dialog } from '~/components/ui/dialog'
import { Field } from '~/components/ui/field'
import { Input } from '~/components/ui/input'
import { Textarea } from '~/components/ui/textarea'
import { Button } from '~/components/ui/button'
import { Alert } from '~/components/ui/alert'

const props = defineProps<{
  initialCenter?: { lat: number; lng: number } | null
}>()

const emit = defineEmits<{
  close: []
  added: []
}>()

const { addLocation, locations } = useLocations()
const { show: showToast } = useToast()
const runtimeConfig = useRuntimeConfig()

const step = ref(1)
const submitting = ref(false)
const submitError = ref('')
const form = reactive({
  qris: '',
  name: '',
  description: '',
  location: null as { lat: number; lng: number } | null,
})

const qrScannerRef = ref<{ reset: () => void } | null>(null)
const turnstileRef = ref<HTMLElement | null>(null)
const turnstileToken = ref('')
let turnstileWidgetId: string | null = null

const siteKey = runtimeConfig.public.turnstileSiteKey as string

async function renderTurnstile() {
  if (!siteKey || !turnstileRef.value) return
  // Load script if not yet present
  if (!(window as any).turnstile) {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
      script.onload = () => resolve()
      script.onerror = () => reject()
      document.head.appendChild(script)
    })
  }
  // Remove previous widget if navigating back then forward
  if (turnstileWidgetId !== null) {
    ;(window as any).turnstile.remove(turnstileWidgetId)
    turnstileWidgetId = null
    turnstileToken.value = ''
  }
  turnstileWidgetId = (window as any).turnstile.render(turnstileRef.value, {
    sitekey: siteKey,
    callback: (token: string) => {
      turnstileToken.value = token
    },
    'expired-callback': () => {
      turnstileToken.value = ''
    },
  })
}

watch(step, async (s) => {
  if (s === 3) {
    await nextTick()
    renderTurnstile()
  }
})

onUnmounted(() => {
  if (turnstileWidgetId !== null) {
    ;(window as any).turnstile?.remove(turnstileWidgetId)
  }
})

const parsedQris = computed(() => parseQris(form.qris))
const hasMccMismatch = computed(() => isMccMismatch(parsedQris.value?.mcc))

const stepLabel = computed(() => ['Scan QR code', 'Add details', 'Pick location'][step.value - 1])

const canProceed = computed(() => {
  if (step.value === 1) return !!form.qris
  if (step.value === 2) return !!form.name.trim()
  return false
})

const canSubmit = computed(() => !!form.location && (!siteKey || !!turnstileToken.value))

function onScanned(value: string) {
  const info = parseQris(value)
  // Reject anything that isn't a valid QRIS — don't advance to step 2
  if (!info) {
    showToast('QR code bukan QRIS yang valid. / Not a valid QRIS code.', 'error')
    qrScannerRef.value?.reset()
    return
  }
  form.qris = value
  // Pre-fill name from merchant name if the field is still empty
  if (!form.name && info.merchantName) form.name = info.merchantName
  step.value = 2
}

async function submit() {
  if (!form.location) return
  submitting.value = true
  submitError.value = ''
  try {
    await addLocation(
      {
        name: form.name.trim(),
        description: form.description.trim(),
        latitude: form.location.lat,
        longitude: form.location.lng,
        qris: form.qris,
      },
      turnstileToken.value || undefined,
    )
    showToast('QRIS location saved!', 'success')
    emit('added')
    emit('close')
  } catch (e: any) {
    submitError.value = e?.data?.message ?? e?.message ?? 'Failed to save. Please try again.'
    showToast(submitError.value, 'error')
    // Reset widget so user can retry
    if (turnstileWidgetId !== null) {
      ;(window as any).turnstile?.reset(turnstileWidgetId)
      turnstileToken.value = ''
    }
  } finally {
    submitting.value = false
  }
}
</script>
