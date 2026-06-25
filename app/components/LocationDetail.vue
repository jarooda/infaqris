<template>
  <Dialog :open="true" size="sm" :show-close="false" @close="$emit('close')">
    <div class="py-5 space-y-3">
      <!-- Header -->
      <div class="flex items-start justify-between">
        <div class="flex-1 min-w-0">
          <h2 class="text-xl font-bold text-(--text-primary) truncate">{{ location.name }}</h2>
          <p v-if="location.description" class="text-sm text-(--text-secondary) mt-1">
            {{ location.description }}
          </p>
          <a
            :href="`https://www.google.com/maps?q=${location.latitude},${location.longitude}`"
            target="_blank"
            rel="noopener noreferrer"
            class="text-xs text-(--text-tertiary) mt-1 hover:text-(--accent) transition-colors inline-flex items-center gap-1"
          >
            <Icon name="material-symbols:location-on-outline" class="w-3 h-3 shrink-0" />
            {{ location.latitude.toFixed(6) }}, {{ location.longitude.toFixed(6) }}
          </a>
        </div>
        <IconButton size="sm" class="ml-3" aria-label="Close" @click="$emit('close')">
          <Icon name="material-symbols:close" />
        </IconButton>
      </div>

      <!-- Pending approval banner -->
      <Alert v-if="isPending" tone="warning">
        <template #icon><Icon name="material-symbols:schedule" /></template>
        Menunggu persetujuan admin.
        <em class="text-(--text-tertiary)"> / Pending admin approval.</em>
      </Alert>

      <!-- QR Code (hidden for pending entries) -->
      <div
        v-if="!isPending"
        class="flex flex-col items-center py-4 bg-(--surface-sunken) rounded-xl"
      >
        <canvas ref="qrCanvas" class="rounded-lg" />
      </div>

      <!-- QRIS Info (always shown when qris data is present) -->
      <div class="space-y-2">
        <template v-if="qrisInfo">
          <!-- Primary 4 fields -->
          <div class="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
            <div>
              <span class="text-(--text-tertiary)">Merchant</span>
              <p
                class="text-(--text-secondary) font-medium truncate"
                :title="qrisInfo.merchantName"
              >
                {{ qrisInfo.merchantName || '—' }}
              </p>
            </div>
            <div>
              <span class="text-(--text-tertiary)">Kota / City</span>
              <p class="text-(--text-secondary) font-medium truncate" :title="qrisInfo.city">
                {{ qrisInfo.city || '—' }}
              </p>
            </div>
            <div>
              <span class="text-(--text-tertiary)">Bank</span>
              <p class="text-(--text-secondary) font-medium truncate" :title="qrisInfo.bank">
                {{ qrisInfo.bank || '—' }}
              </p>
            </div>
            <div>
              <span class="text-(--text-tertiary)">MCC</span>
              <p class="text-(--text-secondary) font-medium truncate">
                {{
                  qrisInfo.mcc
                    ? `${qrisInfo.mcc}${qrisInfo.mccLabel ? ` · ${qrisInfo.mccLabel}` : ''}`
                    : '—'
                }}
              </p>
            </div>
          </div>

          <!-- MCC mismatch warning -->
          <Alert v-if="qrisInfo.mcc && !['8661', '8398'].includes(qrisInfo.mcc)" tone="warning">
            <template #icon><Icon name="material-symbols:warning-outline" /></template>
            QRIS ini terdaftar sebagai
            <strong>{{ qrisInfo.mccLabel || 'kategori non-keagamaan' }}</strong
            >, bukan sebagai masjid atau organisasi keagamaan. Pastikan tujuan donasi sesuai sebelum
            membayar.
            <em class="block mt-0.5 text-(--text-tertiary)">
              This QRIS is registered under
              <strong>{{ qrisInfo.mccLabel || 'a non-religious category' }}</strong
              >, not as a mosque or religious organization. Verify the donation recipient before
              paying.
            </em>
            <NuxtLink
              to="/faq#mcc"
              class="inline-flex items-center gap-0.5 mt-1 text-(--accent) hover:underline"
            >
              <Icon name="material-symbols:info-outline" class="w-3 h-3" />
              Apa itu MCC?
            </NuxtLink>
          </Alert>

          <!-- Collapsible extra fields -->
          <div
            v-if="qrisInfo.merchantId || qrisInfo.type || qrisInfo.postalCode || qrisInfo.amount"
            class="text-xs"
          >
            <button
              class="flex items-center gap-1 text-(--text-tertiary) hover:text-(--text-primary) transition-colors mt-1"
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
                <span class="text-(--text-tertiary)">Merchant ID</span>
                <p class="text-(--text-secondary) font-mono truncate" :title="qrisInfo.merchantId">
                  {{ qrisInfo.merchantId }}
                </p>
              </div>
              <div v-if="qrisInfo.type">
                <span class="text-(--text-tertiary)">Tipe QRIS</span>
                <p class="text-(--text-secondary) font-medium">
                  {{ qrisInfo.type === 'static' ? 'Statis' : 'Dinamis' }}
                </p>
              </div>
              <div v-if="qrisInfo.postalCode">
                <span class="text-(--text-tertiary)">Kode Pos</span>
                <p class="text-(--text-secondary) font-medium">
                  {{ qrisInfo.postalCode }}
                </p>
              </div>
              <div v-if="qrisInfo.amount" class="col-span-2">
                <span class="text-(--text-tertiary)">Nominal</span>
                <p class="text-(--text-secondary) font-medium">
                  Rp {{ Number(qrisInfo.amount).toLocaleString('id-ID') }}
                </p>
              </div>
            </div>
          </div>
        </template>
        <Alert v-else tone="warning">
          <template #icon><Icon name="material-symbols:warning-outline" /></template>
          QRIS tidak valid — silakan edit atau laporkan. /
          <em>Invalid QRIS, please edit or report.</em>
        </Alert>

        <!-- Edit & Delete: only for admins -->
        <div v-if="isAdmin" class="flex gap-2 pt-1">
          <Button variant="secondary" full-width @click="$emit('edit', location)">Edit</Button>
          <Button variant="danger" full-width @click="confirmingDelete = true">Delete</Button>
        </div>
      </div>

      <!-- Report link -->
      <div class="flex justify-center">
        <NuxtLink
          to="/faq#report"
          class="text-xs text-(--text-tertiary) hover:text-(--danger) transition-colors"
        >
          Laporkan data tidak akurat / <em>Report inaccurate data</em>
        </NuxtLink>
      </div>

      <!-- Attribution -->
      <div
        v-if="location.created_at"
        class="border-t border-(--border-subtle) pt-3 flex items-center justify-between gap-4"
      >
        <div
          class="flex items-center gap-1.5 text-xs text-(--text-tertiary) cursor-default"
          :title="location.creator"
        >
          <Icon name="material-symbols:person-add" class="text-sm shrink-0" />
          <span>{{ formatDate(location.created_at) }}</span>
        </div>
        <div
          v-if="location.modified_at"
          class="flex items-center gap-1.5 text-xs text-(--text-tertiary) cursor-default"
          :title="location.latest_editor"
        >
          <Icon name="material-symbols:edit" class="text-sm shrink-0" />
          <span>{{ formatDate(location.modified_at) }}</span>
        </div>
      </div>
    </div>
  </Dialog>

  <!-- Delete confirmation dialog -->
  <Dialog
    :open="confirmingDelete"
    size="sm"
    title="Hapus lokasi ini?"
    :show-close="false"
    @close="cancelDelete"
  >
    <p class="text-sm text-(--text-secondary) mb-4">
      Tindakan ini tidak dapat dibatalkan. Ketik
      <span class="font-mono font-semibold text-(--danger)">DELETE QRIS</span>
      untuk mengonfirmasi.
    </p>
    <Input
      v-model="deleteConfirmText"
      type="text"
      placeholder="DELETE QRIS"
      class="font-mono"
      :invalid="!!deleteConfirmText && !canConfirmDelete"
    />
    <p v-if="deleteError" class="text-xs text-(--danger-text) mt-3 text-center">
      {{ deleteError }}
    </p>
    <template #footer>
      <Button variant="secondary" @click="cancelDelete">Cancel</Button>
      <Button variant="danger" :disabled="!canConfirmDelete || deleting" @click="handleDelete">
        {{ deleting ? 'Deleting...' : 'Confirm' }}
      </Button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import QRCode from 'qrcode'
import type { QrisLocation } from '~/types'
import { parseQris } from '~/utils/parseQris'
import { Dialog } from '~/components/ui/dialog'
import { Alert } from '~/components/ui/alert'
import { Button } from '~/components/ui/button'
import { IconButton } from '~/components/ui/icon-button'
import { Input } from '~/components/ui/input'

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
