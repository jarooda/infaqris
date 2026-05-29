<template>
  <div class="fixed inset-0 z-2000 flex items-center justify-center p-4 bg-black/50">
    <div
      class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh]"
    >
      <!-- Header -->
      <div
        class="flex items-center justify-between p-5 pb-4 border-b border-gray-200 dark:border-gray-700"
      >
        <div>
          <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Add QRIS</h2>
          <p class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            Step {{ step }} of 3 — {{ stepLabel }}
          </p>
        </div>
        <button
          class="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          @click="$emit('close')"
        >
          <Icon name="material-symbols:close" class="w-5 h-5" />
        </button>
      </div>

      <!-- Step indicators -->
      <div class="flex gap-1 px-5 pt-4">
        <div
          v-for="n in 3"
          :key="n"
          :class="[
            'h-1 flex-1 rounded-full transition-colors',
            n <= step ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-600',
          ]"
        />
      </div>

      <!-- Body -->
      <div class="flex-1 overflow-y-auto p-5 pt-4">
        <!-- Step 1: QR Scan -->
        <ClientOnly v-if="step === 1">
          <QrScanner @scanned="onScanned" />
          <div v-if="form.qris" class="mt-3 p-3 bg-green-50 border border-green-200 rounded-xl">
            <p class="text-xs font-medium text-green-700 mb-1">QRIS string captured</p>
            <p class="text-xs text-green-600 font-mono break-all line-clamp-3">{{ form.qris }}</p>
          </div>
        </ClientOnly>

        <!-- Step 2: Name + Description -->
        <div v-if="step === 2" class="space-y-4">
          <!-- Parsed QRIS info -->
          <div v-if="parsedQris">
            <p class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">QRIS Info</p>
            <div
              class="p-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl"
            >
              <div class="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                <div>
                  <span class="text-gray-400 dark:text-gray-500">Merchant</span>
                  <p
                    class="text-gray-700 dark:text-gray-300 font-medium truncate"
                    :title="parsedQris.merchantName"
                  >
                    {{ parsedQris.merchantName || '—' }}
                  </p>
                </div>
                <div>
                  <span class="text-gray-400 dark:text-gray-500">Bank</span>
                  <p
                    class="text-gray-700 dark:text-gray-300 font-medium truncate"
                    :title="parsedQris.bank"
                  >
                    {{ parsedQris.bank || '—' }}
                  </p>
                </div>
                <div>
                  <span class="text-gray-400 dark:text-gray-500">Merchant ID</span>
                  <p
                    class="text-gray-700 dark:text-gray-300 font-mono truncate"
                    :title="parsedQris.merchantId"
                  >
                    {{ parsedQris.merchantId || '—' }}
                  </p>
                </div>
                <div>
                  <span class="text-gray-400 dark:text-gray-500">Kota / City</span>
                  <p
                    class="text-gray-700 dark:text-gray-300 font-medium truncate"
                    :title="parsedQris.city"
                  >
                    {{ parsedQris.city || '—' }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >Name <span class="text-red-500">*</span></label
            >
            <input
              v-model="form.name"
              type="text"
              placeholder="e.g. Masjid Al Mabrur"
              class="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >Description</label
            >
            <textarea
              v-model="form.description"
              rows="3"
              placeholder="Optional description..."
              class="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <!-- Step 3: Location -->
        <ClientOnly v-if="step === 3">
          <LocationPicker
            v-model="form.location"
            :initial-center="props.initialCenter"
            :locations="locations"
            :suppress-warning="submitting"
          />
        </ClientOnly>
      </div>

      <!-- Footer -->
      <div class="flex flex-col gap-2 p-5 border-t border-gray-200 dark:border-gray-700 mt-2">
        <p v-if="submitError" class="text-sm text-red-500 text-center">{{ submitError }}</p>
        <div class="flex gap-2">
          <button
            v-if="step > 1"
            type="button"
            class="flex-1 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            @click="step--"
          >
            Back
          </button>
          <button
            v-if="step < 3"
            type="button"
            :disabled="!canProceed"
            :class="[
              'flex-1 py-2.5 text-sm font-medium rounded-xl transition-colors',
              canProceed
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed',
            ]"
            @click="step++"
          >
            Next
          </button>
          <button
            v-if="step === 3"
            type="button"
            :disabled="!canSubmit || submitting"
            :class="[
              'flex-1 py-2.5 text-sm font-medium rounded-xl transition-colors',
              canSubmit && !submitting
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed',
            ]"
            @click="submit"
          >
            {{ submitting ? 'Saving...' : 'Save' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { parseQris } from '~/utils/parseQris'

const props = defineProps<{
  initialCenter?: { lat: number; lng: number } | null
}>()

const emit = defineEmits<{
  close: []
  added: []
}>()

const { addLocation, locations } = useLocations()
const { show: showToast } = useToast()

const step = ref(1)
const submitting = ref(false)
const submitError = ref('')
const form = reactive({
  qris: '',
  name: '',
  description: '',
  location: null as { lat: number; lng: number } | null,
})

const parsedQris = computed(() => parseQris(form.qris))

const stepLabel = computed(() => ['Scan QR code', 'Add details', 'Pick location'][step.value - 1])

const canProceed = computed(() => {
  if (step.value === 1) return !!form.qris
  if (step.value === 2) return !!form.name.trim()
  return false
})

const canSubmit = computed(() => !!form.location)

function onScanned(value: string) {
  const info = parseQris(value)
  // Reject anything that isn't a valid QRIS — don't advance to step 2
  if (!info) {
    showToast('QR code bukan QRIS yang valid. / Not a valid QRIS code.', 'error')
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
    await addLocation({
      name: form.name.trim(),
      description: form.description.trim(),
      latitude: form.location.lat,
      longitude: form.location.lng,
      qris: form.qris,
    })
    showToast('QRIS location saved!', 'success')
    emit('added')
    emit('close')
  } catch (e: any) {
    submitError.value = e?.data?.message ?? e?.message ?? 'Failed to save. Please try again.'
    showToast(submitError.value, 'error')
  } finally {
    submitting.value = false
  }
}
</script>
