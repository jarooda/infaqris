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

      <!-- QR Code (hidden for pending entries, and gated behind a trust prompt on MCC mismatch) -->
      <div v-if="showQr" class="flex flex-col items-center py-4 bg-(--surface-sunken) rounded-xl">
        <canvas ref="qrCanvas" class="rounded-lg" />
      </div>
      <!-- MCC mismatch: warn, then gate the QR behind a trust prompt -->
      <template v-else-if="!isPending && hasMccMismatch">
        <Alert tone="warning">
          <template #icon><Icon name="material-symbols:warning-outline" /></template>
          <strong>Perhatian:</strong> QRIS ini terdaftar sebagai
          <strong>{{ qrisInfo?.mccLabel || 'kategori non-keagamaan' }}</strong
          >, bukan sebagai masjid atau organisasi keagamaan.
          <em class="block mt-0.5 text-(--text-tertiary)">
            This QRIS is registered under
            <strong>{{ qrisInfo?.mccLabel || 'a non-religious category' }}</strong
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
        <div
          class="flex flex-col items-center gap-3 py-6 px-4 bg-(--surface-sunken) rounded-xl text-center"
        >
          <Icon
            name="material-symbols:visibility-off-outline"
            class="text-2xl text-(--text-tertiary)"
          />
          <p class="text-xs text-(--text-secondary)">
            Kode QR disembunyikan. Tampilkan hanya jika Anda memercayai tujuan donasi ini.
            <em class="block mt-0.5 text-(--text-tertiary)">
              QR code hidden. Reveal it only if you trust this donation recipient.
            </em>
          </p>
          <Button variant="secondary" size="sm" @click="qrRevealed = true">
            Tetap tampilkan QR / <em>Show QR anyway</em>
          </Button>
        </div>
      </template>

      <!-- QRIS Info (always shown when qris data is present) -->
      <div class="space-y-2">
        <QrisInfo v-if="qrisInfo" :info="qrisInfo" />
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
import { parseQris, isMccMismatch } from '~/utils/parseQris'
import QrisInfo from '~/components/QrisInfo.vue'
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

const isPending = computed(() => props.location.status === '2')
const qrisInfo = computed(() => parseQris(props.location.qris))
const canConfirmDelete = computed(() => deleteConfirmText.value === 'DELETE QRIS')

// MCC mismatch: registered under a non-religious category. When this warning shows,
// the QR is hidden behind a trust prompt so the user must consciously choose to reveal it.
const hasMccMismatch = computed(() => isMccMismatch(qrisInfo.value?.mcc))
const qrRevealed = ref(false)
const showQr = computed(() => !isPending.value && (!hasMccMismatch.value || qrRevealed.value))

function cancelDelete() {
  confirmingDelete.value = false
  deleteConfirmText.value = ''
  deleteError.value = ''
}

async function renderQr() {
  await nextTick()
  if (qrCanvas.value && props.location.qris) {
    await QRCode.toCanvas(qrCanvas.value, props.location.qris, {
      width: 240,
      margin: 2,
      errorCorrectionLevel: 'M',
    })
  }
}

// Draw the QR whenever it becomes visible — on initial open (no mismatch) or when revealed.
watch(
  showQr,
  (visible) => {
    if (visible) renderQr()
  },
  { immediate: true },
)

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
