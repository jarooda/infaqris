<template>
  <div class="min-h-dvh bg-(--bg-app)">
    <!-- Header -->
    <div class="sticky top-0 z-10 bg-(--surface-card) border-b border-(--border-default) shadow-sm">
      <div class="max-w-350 mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <NuxtLink
            to="/"
            class="p-1.5 rounded-lg text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--surface-hover) transition-colors"
            title="Kembali ke peta"
          >
            <Icon name="material-symbols:arrow-back" class="w-5 h-5" />
          </NuxtLink>
          <div>
            <h1 class="text-base font-bold text-(--text-primary) leading-tight">
              Admin — Moderasi Lokasi
            </h1>
            <p class="text-xs text-(--text-tertiary)">{{ user?.email }}</p>
          </div>
        </div>
        <div class="flex items-center gap-1">
          <IconButton size="sm" :title="isDark ? 'Light mode' : 'Dark mode'" @click="toggleTheme">
            <Icon :name="isDark ? 'material-symbols:light-mode' : 'material-symbols:dark-mode'" />
          </IconButton>
          <IconButton size="sm" title="Refresh" :disabled="pending" @click="refresh">
            <Icon name="material-symbols:refresh" :class="{ 'animate-spin': pending }" />
          </IconButton>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="max-w-350 mx-auto px-4 pt-4 pb-3 flex flex-wrap gap-3 items-center">
      <Input
        v-model="search"
        type="text"
        placeholder="Cari nama, deskripsi, email, merchant..."
        class="flex-1 min-w-60"
      >
        <template #icon><Icon name="material-symbols:search" /></template>
      </Input>
      <Tabs v-model="statusFilter" :items="tabItems" variant="pill" />
    </div>

    <!-- Table -->
    <div class="max-w-350 mx-auto px-4 pb-12">
      <div v-if="error" class="py-16 text-center">
        <p class="text-sm text-(--danger-text)">
          Gagal memuat data. Pastikan Anda login sebagai admin.
        </p>
      </div>
      <div v-else-if="pending" class="py-16 text-center text-sm text-(--text-tertiary)">
        Memuat...
      </div>
      <EmptyState
        v-else-if="filtered.length === 0"
        title="Tidak ada entri yang cocok."
        description="Coba ubah kata kunci atau filter status."
      >
        <template #icon><Icon name="material-symbols:search-off" /></template>
      </EmptyState>

      <template v-else>
        <Table density="compact" sticky-header>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Nama</TableHeaderCell>
              <TableHeaderCell>Lokasi</TableHeaderCell>
              <TableHeaderCell>QRIS Info</TableHeaderCell>
              <TableHeaderCell>Kontributor</TableHeaderCell>
              <TableHeaderCell>Waktu</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Aksi</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow v-for="loc in paged" :key="loc.id">
              <!-- Nama -->
              <TableCell class="max-w-50">
                <div class="font-medium text-(--text-primary) truncate">{{ loc.name }}</div>
                <div class="text-xs text-(--text-tertiary) truncate mt-0.5">
                  {{ loc.description || '—' }}
                </div>
              </TableCell>

              <!-- Lokasi -->
              <TableCell class="whitespace-nowrap">
                <a
                  :href="`https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center gap-1 text-xs text-(--accent) hover:underline"
                >
                  <Icon name="material-symbols:location-on" class="w-3.5 h-3.5 shrink-0" />
                  {{ loc.latitude.toFixed(5) }}, {{ loc.longitude.toFixed(5) }}
                </a>
              </TableCell>

              <!-- QRIS Info -->
              <TableCell class="max-w-55">
                <template v-if="loc._qris">
                  <div class="font-medium text-(--text-primary) truncate text-xs">
                    {{ loc._qris.merchantName }}
                  </div>
                  <div class="text-xs text-(--text-tertiary) truncate mt-0.5">
                    {{ loc._qris.city
                    }}<template v-if="loc._qris.postalCode"> {{ loc._qris.postalCode }}</template>
                  </div>
                  <div class="text-xs text-(--text-tertiary) truncate">{{ loc._qris.bank }}</div>
                  <div
                    class="text-xs truncate mt-0.5"
                    :class="
                      loc._qris.mcc && !['8661', '8398'].includes(loc._qris.mcc)
                        ? 'text-(--warning-text)'
                        : 'text-(--text-tertiary)'
                    "
                  >
                    <template v-if="loc._qris.mcc">
                      {{ loc._qris.mcc
                      }}<template v-if="loc._qris.mccLabel"> · {{ loc._qris.mccLabel }}</template>
                    </template>
                    <template v-else>—</template>
                  </div>
                </template>
                <span v-else class="text-xs text-(--text-disabled)">—</span>
              </TableCell>

              <!-- Kontributor -->
              <TableCell class="max-w-40">
                <div class="text-xs text-(--text-secondary) truncate">{{ loc.creator || '—' }}</div>
                <div
                  v-if="loc.latest_editor && loc.latest_editor !== loc.creator"
                  class="text-xs text-(--text-tertiary) truncate mt-0.5"
                >
                  Ed: {{ loc.latest_editor }}
                </div>
              </TableCell>

              <!-- Waktu -->
              <TableCell class="whitespace-nowrap">
                <div class="text-xs text-(--text-secondary)">{{ formatDate(loc.created_at) }}</div>
                <div v-if="loc.modified_at" class="text-xs text-(--text-tertiary) mt-0.5">
                  Mod: {{ formatDate(loc.modified_at) }}
                </div>
              </TableCell>

              <!-- Status -->
              <TableCell>
                <Badge :color="statusColor(loc.status)" pill>{{ statusLabel(loc.status) }}</Badge>
              </TableCell>

              <!-- Aksi -->
              <TableCell>
                <div class="flex items-center gap-2">
                  <Button variant="secondary" size="sm" @click="openModal(loc)">Ubah status</Button>
                  <Button
                    v-if="loc.status === '0'"
                    variant="danger"
                    size="sm"
                    @click="openDeleteConfirm(loc)"
                  >
                    Hapus
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <Pagination
          v-model:page="page"
          class="mt-3"
          :page-count="pageCount"
          :total="filtered.length"
          :page-size="PAGE_SIZE"
          show-summary
        />
      </template>
    </div>

    <!-- Status modal -->
    <Dialog
      :open="!!modalLoc"
      size="sm"
      title="Ubah Status"
      :description="modalLoc?.name"
      @close="modalLoc = null"
    >
      <div v-if="modalLoc" class="space-y-2 pb-1">
        <button
          v-for="opt in modalOptions"
          :key="opt.value"
          class="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-colors"
          :class="
            modalLoc.status === opt.value
              ? opt.activeClass
              : 'border-(--border-default) hover:border-(--border-strong) bg-(--surface-card)'
          "
          :disabled="modalUpdating"
          @click="applyStatus(opt.value)"
        >
          <Icon :name="opt.icon" class="w-4 h-4 shrink-0" :class="opt.iconClass" />
          <div>
            <div class="text-sm font-semibold" :class="opt.labelClass">{{ opt.label }}</div>
            <div class="text-xs text-(--text-tertiary)">{{ opt.description }}</div>
          </div>
          <Icon
            v-if="modalLoc.status === opt.value"
            name="material-symbols:check-circle"
            class="w-4 h-4 ml-auto"
            :class="opt.iconClass"
          />
          <Icon
            v-if="modalUpdating && modalPending === opt.value"
            name="material-symbols:progress-activity"
            class="w-4 h-4 ml-auto animate-spin text-(--text-tertiary)"
          />
        </button>
      </div>
      <template #footer>
        <Button variant="ghost" @click="modalLoc = null">Batal</Button>
      </template>
    </Dialog>

    <!-- Delete confirm modal -->
    <Dialog
      :open="!!deleteLoc"
      size="sm"
      title="Hapus Permanen"
      :description="deleteLoc?.name"
      :show-close="false"
      @close="deleteLoc = null"
    >
      <p class="text-sm text-(--text-secondary) pb-1">
        Data akan dihapus permanen dari spreadsheet dan tidak dapat dikembalikan.
      </p>
      <template #footer>
        <Button variant="secondary" :disabled="deleteDeleting" @click="deleteLoc = null">
          Batal
        </Button>
        <Button variant="danger" :disabled="deleteDeleting" @click="confirmDelete">
          <Icon
            v-if="deleteDeleting"
            name="material-symbols:progress-activity"
            class="animate-spin"
          />
          <span v-else>Hapus</span>
        </Button>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { Dialog } from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Tabs } from '~/components/ui/tabs'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { IconButton } from '~/components/ui/icon-button'
import { EmptyState } from '~/components/ui/empty-state'
import { Pagination } from '~/components/ui/pagination'
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
} from '~/components/ui/table'

definePageMeta({ middleware: 'admin' })

const { user } = useAuth()
const { isDark, toggle: toggleTheme, init: initTheme } = useTheme()

interface AdminLocation {
  id: string
  name: string
  description: string
  latitude: number
  longitude: number
  qris: string
  created_at: string
  modified_at: string
  creator: string
  latest_editor: string
  status: string
  _qris?: ReturnType<typeof parseQris>
}

const { data, pending, error, refresh } = await useFetch<AdminLocation[]>('/api/admin/locations', {
  transform: (rows) => rows.map((r) => ({ ...r, _qris: parseQris(r.qris) })),
})

const search = ref('')
const statusFilter = ref<string>('all')

const statusOptions = [
  { value: 'all', label: 'Semua' },
  { value: '2', label: 'Pending' },
  { value: '1', label: 'Aktif' },
  { value: '0', label: 'Ditolak' },
]

const counts = computed(() => {
  const all = data.value ?? []
  return {
    all: all.length,
    '0': all.filter((l) => l.status === '0').length,
    '1': all.filter((l) => l.status === '1').length,
    '2': all.filter((l) => l.status === '2').length,
  } as Record<string, number>
})

const tabItems = computed(() =>
  statusOptions.map((o) => ({ value: o.value, label: o.label, count: counts.value[o.value] })),
)

const filtered = computed(() => {
  let list = data.value ?? []
  if (statusFilter.value !== 'all') list = list.filter((l) => l.status === statusFilter.value)
  const q = search.value.trim().toLowerCase()
  if (q) {
    list = list.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q) ||
        l.creator.toLowerCase().includes(q) ||
        l._qris?.merchantName.toLowerCase().includes(q) ||
        l._qris?.merchantId.toLowerCase().includes(q),
    )
  }
  return list
})

// Pagination
const PAGE_SIZE = 25
const page = ref(1)
const pageCount = computed(() => Math.max(1, Math.ceil(filtered.value.length / PAGE_SIZE)))
const paged = computed(() =>
  filtered.value.slice((page.value - 1) * PAGE_SIZE, page.value * PAGE_SIZE),
)
// Reset to the first page whenever the result set changes
watch([search, statusFilter], () => {
  page.value = 1
})

// Modal
const modalLoc = ref<AdminLocation | null>(null)
const modalUpdating = ref(false)
const modalPending = ref<string | null>(null)

const modalOptions = [
  {
    value: '1',
    label: 'Setujui',
    description: 'Tampilkan di peta untuk semua pengguna',
    icon: 'material-symbols:check-circle-outline',
    iconClass: 'text-(--success)',
    labelClass: 'text-(--success-text)',
    activeClass: 'border-(--success) bg-(--success-subtle)',
  },
  {
    value: '2',
    label: 'Pending',
    description: 'Kembalikan ke antrian moderasi',
    icon: 'material-symbols:schedule-outline',
    iconClass: 'text-(--warning)',
    labelClass: 'text-(--warning-text)',
    activeClass: 'border-(--warning) bg-(--warning-subtle)',
  },
  {
    value: '0',
    label: 'Tolak',
    description: 'Sembunyikan dari peta',
    icon: 'material-symbols:cancel-outline',
    iconClass: 'text-(--danger)',
    labelClass: 'text-(--danger-text)',
    activeClass: 'border-(--danger) bg-(--danger-subtle)',
  },
]

function openModal(loc: AdminLocation) {
  modalLoc.value = loc
}

async function applyStatus(status: string) {
  if (!modalLoc.value || modalLoc.value.status === status) return
  modalUpdating.value = true
  modalPending.value = status
  try {
    await $fetch(`/api/admin/locations/${modalLoc.value.id}`, { method: 'PATCH', body: { status } })
    modalLoc.value.status = status
    modalLoc.value = null
  } catch {
    alert('Gagal mengubah status. Coba lagi.')
  } finally {
    modalUpdating.value = false
    modalPending.value = null
  }
}

// Delete confirm
const deleteLoc = ref<AdminLocation | null>(null)
const deleteDeleting = ref(false)

function openDeleteConfirm(loc: AdminLocation) {
  deleteLoc.value = loc
}

async function confirmDelete() {
  if (!deleteLoc.value) return
  deleteDeleting.value = true
  try {
    await $fetch(`/api/admin/locations/${deleteLoc.value.id}`, { method: 'DELETE' })
    if (data.value) {
      data.value = data.value.filter((l) => l.id !== deleteLoc.value!.id)
    }
    deleteLoc.value = null
  } catch {
    alert('Gagal menghapus data. Coba lagi.')
  } finally {
    deleteDeleting.value = false
  }
}

function statusLabel(status: string) {
  return (
    ({ '1': 'Aktif', '2': 'Pending', '0': 'Ditolak' } as Record<string, string>)[status] ?? status
  )
}

function statusColor(status: string): 'success' | 'warning' | 'danger' {
  if (status === '1') return 'success'
  if (status === '2') return 'warning'
  return 'danger'
}

function formatDate(iso: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

useSeoMeta({ title: 'Admin — InfaQRIS' })

onMounted(() => initTheme())
</script>
