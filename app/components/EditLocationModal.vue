<template>
  <Dialog :open="true" title="Edit QRIS" @close="$emit('close')">
    <div class="space-y-4 pb-2">
      <Field label="Name" required html-for="edit-name">
        <Input id="edit-name" v-model="form.name" type="text" maxlength="100" />
      </Field>

      <Field label="Description" html-for="edit-desc">
        <Textarea id="edit-desc" v-model="form.description" rows="3" maxlength="500" />
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
            <template v-if="parsedQris">
              <!-- Primary 4 fields -->
              <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <div>
                  <span class="text-(--text-tertiary)">Merchant</span>
                  <p
                    class="font-medium truncate"
                    :class="qrisReplaced ? 'text-(--success-text)' : 'text-(--text-secondary)'"
                    :title="parsedQris.merchantName"
                  >
                    {{ parsedQris.merchantName || '—' }}
                  </p>
                </div>
                <div>
                  <span class="text-(--text-tertiary)">Kota / City</span>
                  <p
                    class="font-medium truncate"
                    :class="qrisReplaced ? 'text-(--success-text)' : 'text-(--text-secondary)'"
                    :title="parsedQris.city"
                  >
                    {{ parsedQris.city || '—' }}
                  </p>
                </div>
                <div>
                  <span class="text-(--text-tertiary)">Bank</span>
                  <p
                    class="font-medium truncate"
                    :class="qrisReplaced ? 'text-(--success-text)' : 'text-(--text-secondary)'"
                    :title="parsedQris.bank"
                  >
                    {{ parsedQris.bank || '—' }}
                  </p>
                </div>
                <div>
                  <span class="text-(--text-tertiary)">MCC</span>
                  <p
                    class="font-medium truncate"
                    :class="qrisReplaced ? 'text-(--success-text)' : 'text-(--text-secondary)'"
                  >
                    {{
                      parsedQris.mcc
                        ? `${parsedQris.mcc}${parsedQris.mccLabel ? ` · ${parsedQris.mccLabel}` : ''}`
                        : '—'
                    }}
                  </p>
                </div>
              </div>

              <!-- Collapsible extra fields -->
              <div
                v-if="
                  parsedQris.merchantId ||
                  parsedQris.type ||
                  parsedQris.postalCode ||
                  parsedQris.amount
                "
                class="text-xs mt-2"
              >
                <button
                  class="flex items-center gap-1 text-(--text-tertiary) hover:text-(--text-primary) transition-colors"
                  @click="showMoreQris = !showMoreQris"
                >
                  <Icon
                    :name="
                      showMoreQris ? 'material-symbols:expand-less' : 'material-symbols:expand-more'
                    "
                    class="w-3.5 h-3.5"
                  />
                  {{ showMoreQris ? 'Sembunyikan' : 'Lihat detail lain' }}
                </button>
                <div v-if="showMoreQris" class="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-2">
                  <div v-if="parsedQris.merchantId" class="col-span-2">
                    <span class="text-(--text-tertiary)">Merchant ID</span>
                    <p
                      class="font-mono truncate"
                      :class="qrisReplaced ? 'text-(--success-text)' : 'text-(--text-secondary)'"
                      :title="parsedQris.merchantId"
                    >
                      {{ parsedQris.merchantId }}
                    </p>
                  </div>
                  <div v-if="parsedQris.type">
                    <span class="text-(--text-tertiary)">Tipe QRIS</span>
                    <p
                      class="font-medium"
                      :class="qrisReplaced ? 'text-(--success-text)' : 'text-(--text-secondary)'"
                    >
                      {{ parsedQris.type === 'static' ? 'Statis' : 'Dinamis' }}
                    </p>
                  </div>
                  <div v-if="parsedQris.postalCode">
                    <span class="text-(--text-tertiary)">Kode Pos</span>
                    <p
                      class="font-medium"
                      :class="qrisReplaced ? 'text-(--success-text)' : 'text-(--text-secondary)'"
                    >
                      {{ parsedQris.postalCode }}
                    </p>
                  </div>
                  <div v-if="parsedQris.amount" class="col-span-2">
                    <span class="text-(--text-tertiary)">Nominal</span>
                    <p
                      class="font-medium"
                      :class="qrisReplaced ? 'text-(--success-text)' : 'text-(--text-secondary)'"
                    >
                      Rp {{ Number(parsedQris.amount).toLocaleString('id-ID') }}
                    </p>
                  </div>
                </div>
              </div>
            </template>
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
const saving = ref(false)
const replacingQr = ref(false)
const qrisReplaced = ref(false)
const showMoreQris = ref(false)

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
const canSubmit = computed(() => !!form.name.trim() && !!form.qris.trim() && !!form.location)

async function submit() {
  if (!form.location) return
  saving.value = true
  try {
    await updateLocation(props.location.id, {
      name: form.name.trim(),
      description: form.description.trim(),
      qris: form.qris.trim(),
      latitude: form.location.lat,
      longitude: form.location.lng,
    })
    showToast('Changes saved.', 'success')
    emit('updated')
    emit('close')
  } finally {
    saving.value = false
  }
}
</script>
