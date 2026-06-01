<template>
  <div class="fixed inset-0 z-2000 flex items-center justify-center p-4 bg-black/50">
    <div
      class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh]"
    >
      <!-- Header -->
      <div
        class="flex items-center justify-between p-5 pb-4 border-b border-gray-200 dark:border-gray-700"
      >
        <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Edit QRIS</h2>
        <button
          class="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          @click="$emit('close')"
        >
          <Icon name="material-symbols:close" class="w-5 h-5" />
        </button>
      </div>

      <!-- Body -->
      <div class="flex-1 overflow-y-auto p-5 space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Name <span class="text-red-500">*</span>
          </label>
          <input
            v-model="form.name"
            type="text"
            maxlength="100"
            class="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >Description</label
          >
          <textarea
            v-model="form.description"
            rows="3"
            maxlength="500"
            class="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            QRIS <span class="text-red-500">*</span>
          </label>

          <template v-if="!replacingQr">
            <div
              :class="[
                'p-3 border rounded-xl',
                qrisReplaced
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'
                  : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600',
              ]"
            >
              <p
                v-if="qrisReplaced"
                class="text-xs font-medium text-green-700 dark:text-green-400 mb-2"
              >
                New QRIS captured
              </p>
              <template v-if="parsedQris">
                <!-- Primary 4 fields -->
                <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <div>
                    <span class="text-gray-400 dark:text-gray-500">Merchant</span>
                    <p
                      class="font-medium truncate"
                      :class="
                        qrisReplaced
                          ? 'text-green-700 dark:text-green-300'
                          : 'text-gray-700 dark:text-gray-300'
                      "
                      :title="parsedQris.merchantName"
                    >
                      {{ parsedQris.merchantName || '—' }}
                    </p>
                  </div>
                  <div>
                    <span class="text-gray-400 dark:text-gray-500">Kota / City</span>
                    <p
                      class="font-medium truncate"
                      :class="
                        qrisReplaced
                          ? 'text-green-700 dark:text-green-300'
                          : 'text-gray-700 dark:text-gray-300'
                      "
                      :title="parsedQris.city"
                    >
                      {{ parsedQris.city || '—' }}
                    </p>
                  </div>
                  <div>
                    <span class="text-gray-400 dark:text-gray-500">Bank</span>
                    <p
                      class="font-medium truncate"
                      :class="
                        qrisReplaced
                          ? 'text-green-700 dark:text-green-300'
                          : 'text-gray-700 dark:text-gray-300'
                      "
                      :title="parsedQris.bank"
                    >
                      {{ parsedQris.bank || '—' }}
                    </p>
                  </div>
                  <div>
                    <span class="text-gray-400 dark:text-gray-500">MCC</span>
                    <p
                      class="font-medium truncate"
                      :class="
                        qrisReplaced
                          ? 'text-green-700 dark:text-green-300'
                          : 'text-gray-700 dark:text-gray-300'
                      "
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
                    class="flex items-center gap-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    @click="showMoreQris = !showMoreQris"
                  >
                    <Icon
                      :name="
                        showMoreQris
                          ? 'material-symbols:expand-less'
                          : 'material-symbols:expand-more'
                      "
                      class="w-3.5 h-3.5"
                    />
                    {{ showMoreQris ? 'Sembunyikan' : 'Lihat detail lain' }}
                  </button>
                  <div v-if="showMoreQris" class="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-2">
                    <div v-if="parsedQris.merchantId" class="col-span-2">
                      <span class="text-gray-400 dark:text-gray-500">Merchant ID</span>
                      <p
                        class="font-mono truncate"
                        :class="
                          qrisReplaced
                            ? 'text-green-700 dark:text-green-300'
                            : 'text-gray-700 dark:text-gray-300'
                        "
                        :title="parsedQris.merchantId"
                      >
                        {{ parsedQris.merchantId }}
                      </p>
                    </div>
                    <div v-if="parsedQris.type">
                      <span class="text-gray-400 dark:text-gray-500">Tipe QRIS</span>
                      <p
                        class="font-medium"
                        :class="
                          qrisReplaced
                            ? 'text-green-700 dark:text-green-300'
                            : 'text-gray-700 dark:text-gray-300'
                        "
                      >
                        {{ parsedQris.type === 'static' ? 'Statis' : 'Dinamis' }}
                      </p>
                    </div>
                    <div v-if="parsedQris.postalCode">
                      <span class="text-gray-400 dark:text-gray-500">Kode Pos</span>
                      <p
                        class="font-medium"
                        :class="
                          qrisReplaced
                            ? 'text-green-700 dark:text-green-300'
                            : 'text-gray-700 dark:text-gray-300'
                        "
                      >
                        {{ parsedQris.postalCode }}
                      </p>
                    </div>
                    <div v-if="parsedQris.amount" class="col-span-2">
                      <span class="text-gray-400 dark:text-gray-500">Nominal</span>
                      <p
                        class="font-medium"
                        :class="
                          qrisReplaced
                            ? 'text-green-700 dark:text-green-300'
                            : 'text-gray-700 dark:text-gray-300'
                        "
                      >
                        Rp {{ Number(parsedQris.amount).toLocaleString('id-ID') }}
                      </p>
                    </div>
                  </div>
                </div>
              </template>
              <template v-else>
                <div class="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                  <Icon name="material-symbols:warning-outline" class="w-4 h-4 shrink-0" />
                  <span
                    >QRIS tidak valid — silakan ganti. /
                    <em>Invalid QRIS, please replace.</em></span
                  >
                </div>
              </template>
            </div>
            <button
              type="button"
              class="mt-1.5 text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline"
              @click="replacingQr = true"
            >
              {{ qrisReplaced ? 'Replace again' : 'Replace QR code' }}
            </button>
          </template>

          <template v-else>
            <ClientOnly>
              <QrScanner @scanned="onQrisScanned" />
            </ClientOnly>
            <button
              type="button"
              class="mt-2 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              @click="replacingQr = false"
            >
              Cancel
            </button>
          </template>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >Location</label
          >
          <ClientOnly>
            <LocationPicker
              v-model="form.location"
              :locations="locations"
              :exclude-id="props.location.id"
            />
          </ClientOnly>
        </div>
      </div>

      <!-- Footer -->
      <div class="p-5 border-t border-gray-200 dark:border-gray-700">
        <button
          :disabled="!canSubmit || saving"
          :class="[
            'w-full py-2.5 text-sm font-medium rounded-xl transition-colors',
            canSubmit && !saving
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed',
          ]"
          @click="submit"
        >
          {{ saving ? 'Saving...' : 'Save Changes' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { QrisLocation } from '~/types'
import { parseQris } from '~/utils/parseQris'

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
