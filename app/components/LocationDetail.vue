<template>
  <div class="fixed inset-0 z-2000 flex items-center justify-center p-4 bg-black/50">
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
      <!-- Header -->
      <div class="flex items-start justify-between p-5 pb-3">
        <div class="flex-1 min-w-0">
          <h2 class="text-xl font-bold text-gray-900 dark:text-gray-100 truncate">
            {{ location.name }}
          </h2>
          <p v-if="location.description" class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {{ location.description }}
          </p>
          <a
            :href="`https://www.google.com/maps?q=${location.latitude},${location.longitude}`"
            target="_blank"
            rel="noopener noreferrer"
            class="text-xs text-gray-400 dark:text-gray-500 mt-1 hover:text-blue-500 dark:hover:text-blue-400 transition-colors inline-flex items-center gap-1"
          >
            <Icon name="material-symbols:location-on-outline" class="w-3 h-3 shrink-0" />
            {{ location.latitude.toFixed(6) }}, {{ location.longitude.toFixed(6) }}
          </a>
        </div>
        <button
          class="ml-3 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          @click="$emit('close')"
        >
          <Icon name="material-symbols:close" class="w-5 h-5" />
        </button>
      </div>

      <!-- Pending approval banner -->
      <div
        v-if="isPending"
        class="flex items-center gap-2 px-5 py-3 bg-amber-50 dark:bg-amber-900/20 border-y border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-400 text-sm"
      >
        <Icon name="material-symbols:schedule" class="w-4 h-4 shrink-0" />
        <span>
          Menunggu persetujuan admin.<br class="sm:hidden" />
          <em class="text-amber-600 dark:text-amber-500"> / Pending admin approval.</em>
        </span>
      </div>

      <!-- QR Code (hidden for pending entries) -->
      <div v-if="!isPending" class="flex flex-col items-center py-4 bg-gray-50 dark:bg-gray-900">
        <canvas ref="qrCanvas" class="rounded-lg" />
      </div>

      <!-- QRIS Info (always shown when qris data is present) -->
      <div class="p-4 pt-3 space-y-2">
        <template v-if="qrisInfo">
          <!-- Primary 4 fields -->
          <div class="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
            <div>
              <span class="text-gray-400 dark:text-gray-500">Merchant</span>
              <p
                class="text-gray-700 dark:text-gray-300 font-medium truncate"
                :title="qrisInfo.merchantName"
              >
                {{ qrisInfo.merchantName || '—' }}
              </p>
            </div>
            <div>
              <span class="text-gray-400 dark:text-gray-500">Kota / City</span>
              <p
                class="text-gray-700 dark:text-gray-300 font-medium truncate"
                :title="qrisInfo.city"
              >
                {{ qrisInfo.city || '—' }}
              </p>
            </div>
            <div>
              <span class="text-gray-400 dark:text-gray-500">Bank</span>
              <p
                class="text-gray-700 dark:text-gray-300 font-medium truncate"
                :title="qrisInfo.bank"
              >
                {{ qrisInfo.bank || '—' }}
              </p>
            </div>
            <div>
              <span class="text-gray-400 dark:text-gray-500">MCC</span>
              <p class="text-gray-700 dark:text-gray-300 font-medium truncate">
                {{
                  qrisInfo.mcc
                    ? `${qrisInfo.mcc}${qrisInfo.mccLabel ? ` · ${qrisInfo.mccLabel}` : ''}`
                    : '—'
                }}
              </p>
            </div>
          </div>

          <!-- MCC mismatch warning -->
          <div
            v-if="qrisInfo.mcc && !['8661', '8398'].includes(qrisInfo.mcc)"
            class="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-2"
          >
            <Icon name="material-symbols:warning-outline" class="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              QRIS ini terdaftar sebagai
              <strong>{{ qrisInfo.mccLabel || 'kategori non-keagamaan' }}</strong
              >, bukan sebagai masjid atau organisasi keagamaan. Pastikan tujuan donasi sesuai
              sebelum membayar.
              <em class="block mt-0.5 text-amber-600 dark:text-amber-500">
                This QRIS is registered under
                <strong>{{ qrisInfo.mccLabel || 'a non-religious category' }}</strong
                >, not as a mosque or religious organization. Verify the donation recipient before
                paying.
              </em>
              <NuxtLink
                to="/faq#mcc"
                class="inline-flex items-center gap-0.5 mt-1 text-blue-600 dark:text-blue-400 hover:underline"
              >
                <Icon name="material-symbols:info-outline" class="w-3 h-3" />
                Apa itu MCC?
              </NuxtLink>
            </span>
          </div>

          <!-- Collapsible extra fields -->
          <div
            v-if="qrisInfo.merchantId || qrisInfo.type || qrisInfo.postalCode || qrisInfo.amount"
            class="text-xs"
          >
            <button
              class="flex items-center gap-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors mt-1"
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
              <div v-if="qrisInfo.merchantId" class="col-span-2">
                <span class="text-gray-400 dark:text-gray-500">Merchant ID</span>
                <p
                  class="text-gray-700 dark:text-gray-300 font-mono truncate"
                  :title="qrisInfo.merchantId"
                >
                  {{ qrisInfo.merchantId }}
                </p>
              </div>
              <div v-if="qrisInfo.type">
                <span class="text-gray-400 dark:text-gray-500">Tipe QRIS</span>
                <p class="text-gray-700 dark:text-gray-300 font-medium">
                  {{ qrisInfo.type === 'static' ? 'Statis' : 'Dinamis' }}
                </p>
              </div>
              <div v-if="qrisInfo.postalCode">
                <span class="text-gray-400 dark:text-gray-500">Kode Pos</span>
                <p class="text-gray-700 dark:text-gray-300 font-medium">
                  {{ qrisInfo.postalCode }}
                </p>
              </div>
              <div v-if="qrisInfo.amount" class="col-span-2">
                <span class="text-gray-400 dark:text-gray-500">Nominal</span>
                <p class="text-gray-700 dark:text-gray-300 font-medium">
                  Rp {{ Number(qrisInfo.amount).toLocaleString('id-ID') }}
                </p>
              </div>
            </div>
          </div>
        </template>
        <div
          v-else
          class="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-2"
        >
          <Icon name="material-symbols:warning-outline" class="w-4 h-4 shrink-0" />
          <span
            >QRIS tidak valid — silakan edit atau laporkan. /
            <em>Invalid QRIS, please edit or report.</em></span
          >
        </div>
        <!-- Edit & Delete: only for admins -->
        <div v-if="isAdmin" class="flex gap-2 pt-1">
          <button
            class="flex-1 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-colors"
            @click="$emit('edit', location)"
          >
            Edit
          </button>
          <button
            class="flex-1 py-2 text-sm font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-colors"
            @click="confirmingDelete = true"
          >
            Delete
          </button>
        </div>
      </div>

      <!-- Report link -->
      <div class="px-4 pb-2 flex justify-center">
        <NuxtLink
          to="/faq#report"
          class="text-xs text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
        >
          Laporkan data tidak akurat / <em>Report inaccurate data</em>
        </NuxtLink>
      </div>

      <!-- Attribution -->
      <div
        v-if="location.created_at"
        class="px-4 pb-4 border-t border-gray-100 dark:border-gray-700 pt-3 flex items-center justify-between gap-4"
      >
        <div
          class="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 cursor-default"
          :title="location.creator"
        >
          <Icon name="material-symbols:person-add" class="text-sm shrink-0" />
          <span>{{ formatDate(location.created_at) }}</span>
        </div>
        <div
          v-if="location.modified_at"
          class="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 cursor-default"
          :title="location.latest_editor"
        >
          <Icon name="material-symbols:edit" class="text-sm shrink-0" />
          <span>{{ formatDate(location.modified_at) }}</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Delete confirmation popup -->
  <div
    v-if="confirmingDelete"
    class="fixed inset-0 z-2100 flex items-center justify-center p-4 bg-black/60"
  >
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6">
      <h3 class="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">
        Hapus lokasi ini?
      </h3>
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Tindakan ini tidak dapat dibatalkan. Ketik
        <span class="font-mono font-semibold text-red-600 dark:text-red-400">DELETE QRIS</span>
        untuk mengonfirmasi.
      </p>
      <input
        v-model="deleteConfirmText"
        type="text"
        placeholder="DELETE QRIS"
        class="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-mono placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
      />
      <div class="flex gap-2">
        <button
          class="flex-1 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors"
          @click="cancelDelete"
        >
          Cancel
        </button>
        <button
          :disabled="!canConfirmDelete || deleting"
          :class="[
            'flex-1 py-2 text-sm font-medium rounded-xl transition-colors',
            canConfirmDelete && !deleting
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed',
          ]"
          @click="handleDelete"
        >
          {{ deleting ? 'Deleting...' : 'Confirm' }}
        </button>
      </div>
      <p v-if="deleteError" class="text-xs text-red-500 mt-3 text-center">{{ deleteError }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import QRCode from 'qrcode'
import type { QrisLocation } from '~/types'
import { parseQris } from '~/utils/parseQris'

const props = defineProps<{ location: QrisLocation }>()
const emit = defineEmits<{
  close: []
  edit: [location: QrisLocation]
  deleted: []
}>()

const { isAdmin } = useAuth()
const { deleteLocation } = useLocations()
const { show: showToast } = useToast()
const qrCanvas = ref<HTMLCanvasElement | null>(null)
const confirmingDelete = ref(false)
const deleteConfirmText = ref('')
const deleting = ref(false)
const deleteError = ref('')
const showMoreQris = ref(false)

const isPending = computed(() => props.location.status === '2')
const qrisInfo = computed(() => parseQris(props.location.qris))
const canConfirmDelete = computed(() => deleteConfirmText.value === 'DELETE QRIS')

function cancelDelete() {
  confirmingDelete.value = false
  deleteConfirmText.value = ''
  deleteError.value = ''
}

onMounted(async () => {
  if (qrCanvas.value && props.location.qris) {
    await QRCode.toCanvas(qrCanvas.value, props.location.qris, {
      width: 240,
      margin: 2,
      errorCorrectionLevel: 'M',
    })
  }
})

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

async function handleDelete() {
  deleting.value = true
  deleteError.value = ''
  try {
    await deleteLocation(props.location.id)
    showToast('Location deleted.', 'success')
    emit('deleted')
    emit('close')
  } catch (e: any) {
    deleteError.value = e?.data?.message ?? 'Failed to delete. Please try again.'
  } finally {
    deleting.value = false
    deleteConfirmText.value = ''
  }
}
</script>
