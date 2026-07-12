<template>
  <Dialog :open="true" title="Edit QRIS" @close="$emit('close')">
    <div class="space-y-4 pb-2">
      <Field label="Name" required html-for="edit-name">
        <Input id="edit-name" v-model="form.name" type="text" maxlength="100" disabled />
      </Field>

      <Field label="Description" html-for="edit-desc">
        <Textarea id="edit-desc" v-model="form.description" rows="3" maxlength="100" />
      </Field>

      <Field label="QRIS" required>
        <template v-if="!replacingQr">
          <div
            class="p-3 border rounded-xl"
            :class="
              qrisReplaced
                ? 'border-(--success) bg-(--success-subtle)'
                : 'border-(--border-default) bg-(--surface-sunken)'
            "
          >
            <p v-if="qrisReplaced" class="text-xs font-medium text-(--success-text) mb-2">
              New QRIS captured
            </p>
            <QrisInfo v-if="parsedQris" :info="parsedQris" :highlight="qrisReplaced" />
            <div v-else class="flex items-center gap-2 text-xs text-(--warning-text)">
              <Icon name="material-symbols:warning-outline" class="w-4 h-4 shrink-0" />
              <span
                >QRIS tidak valid — silakan ganti. / <em>Invalid QRIS, please replace.</em></span
              >
            </div>
          </div>
          <Button variant="ghost" size="sm" class="mt-1.5" @click="replacingQr = true">
            {{ qrisReplaced ? 'Replace again' : 'Replace QR code' }}
          </Button>
        </template>

        <template v-else>
          <ClientOnly>
            <QrScanner @scanned="onQrisScanned" />
          </ClientOnly>
          <Button variant="ghost" size="sm" class="mt-2" @click="replacingQr = false"
            >Cancel</Button
          >
        </template>
      </Field>

      <Field label="Location">
        <ClientOnly>
          <LocationPicker
            v-model="form.location"
            :locations="locations"
            :exclude-id="props.location.id"
          />
        </ClientOnly>
      </Field>

      <div ref="turnstileRef" class="flex justify-center" />
    </div>

    <template #footer>
      <Button variant="primary" full-width :disabled="!canSubmit || saving" @click="submit">
        {{ saving ? 'Saving...' : 'Save Changes' }}
      </Button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import type { QrisLocation } from '~/types'
import { parseQris } from '~/utils/parseQris'
import QrisInfo from '~/components/QrisInfo.vue'
import { Dialog } from '~/components/ui/dialog'
import { Field } from '~/components/ui/field'
import { Input } from '~/components/ui/input'
import { Textarea } from '~/components/ui/textarea'
import { Button } from '~/components/ui/button'

const props = defineProps<{ location: QrisLocation }>()
const emit = defineEmits<{
  close: []
  updated: []
}>()

const { updateLocation, locations } = useLocations()
const { show: showToast } = useToast()
const runtimeConfig = useRuntimeConfig()
const saving = ref(false)
const replacingQr = ref(false)
const qrisReplaced = ref(false)

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

onMounted(async () => {
  await nextTick()
  renderTurnstile()
})

onUnmounted(() => {
  if (turnstileWidgetId !== null) {
    ;(window as any).turnstile?.remove(turnstileWidgetId)
  }
})

function onQrisScanned(value: string) {
  form.qris = value
  qrisReplaced.value = true
  replacingQr.value = false
}

const form = reactive({
  name: props.location.name,
  description: props.location.description,
  qris: props.location.qris,
  location: {
    lat: props.location.latitude,
    lng: props.location.longitude,
  } as { lat: number; lng: number } | null,
})

const parsedQris = computed(() => parseQris(form.qris))
const canSubmit = computed(
  () =>
    !!form.name.trim() &&
    !!form.qris.trim() &&
    !!form.location &&
    (!siteKey || !!turnstileToken.value),
)

async function submit() {
  if (!form.location) return
  saving.value = true
  try {
    await updateLocation(
      props.location.id,
      {
        name: form.name.trim(),
        description: form.description.trim(),
        qris: form.qris.trim(),
        latitude: form.location.lat,
        longitude: form.location.lng,
      },
      turnstileToken.value || undefined,
    )
    showToast('Changes saved.', 'success')
    emit('updated')
    emit('close')
  } catch (e: any) {
    showToast(e?.data?.message ?? 'Failed to save. Please try again.', 'error')
    // Reset widget so the user can retry
    if (turnstileWidgetId !== null) {
      ;(window as any).turnstile?.reset(turnstileWidgetId)
      turnstileToken.value = ''
    }
  } finally {
    saving.value = false
  }
}
</script>
