<template>
  <div class="min-h-dvh bg-gray-100 dark:bg-gray-900">
    <!-- Header -->
    <div
      class="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm"
    >
      <div class="max-w-[1400px] mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <NuxtLink
            to="/"
            class="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 transition-colors"
            title="Kembali ke peta"
          >
            <Icon name="material-symbols:arrow-back" class="w-5 h-5" />
          </NuxtLink>
          <div>
            <h1 class="text-base font-bold text-gray-900 dark:text-gray-200 leading-tight">
              Admin — Moderasi Lokasi
            </h1>
            <p class="text-xs text-gray-500 dark:text-gray-400">{{ user?.email }}</p>
          </div>
        </div>
        <div class="flex items-center gap-1">
          <button
            class="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 transition-colors"
            :title="isDark ? 'Light mode' : 'Dark mode'"
            @click="toggleTheme"
          >
            <Icon
              :name="isDark ? 'material-symbols:light-mode' : 'material-symbols:dark-mode'"
              class="w-5 h-5"
            />
          </button>
          <button
            class="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 transition-colors"
            title="Refresh"
            :disabled="pending"
            @click="refresh"
          >
            <Icon
              name="material-symbols:refresh"
              class="w-5 h-5"
              :class="{ 'animate-spin': pending }"
            />
          </button>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="max-w-[1400px] mx-auto px-4 pt-4 pb-3 flex flex-wrap gap-3 items-center">
      <input
        v-model="search"
        type="text"
        placeholder="Cari nama, deskripsi, email, merchant..."
        class="flex-1 min-w-60 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
      />
      <div class="flex gap-1.5">
        <button
          v-for="opt in statusOptions"
          :key="opt.value"
          class="px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors"
          :class="
            statusFilter !== opt.value
              ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              : opt.value === '2'
                ? 'bg-yellow-500 border-yellow-500 text-white'
                : opt.value === '1'
                  ? 'bg-green-600 border-green-600 text-white'
                  : opt.value === '0'
                    ? 'bg-red-600 border-red-600 text-white'
                    : 'bg-blue-600 border-blue-600 text-white'
          "
          @click="statusFilter = opt.value"
        >
          {{ opt.label }}
          <span class="ml-1 font-normal opacity-70">{{ counts[opt.value] }}</span>
        </button>
      </div>
    </div>

    <!-- Table -->
    <div class="max-w-[1400px] mx-auto px-4 pb-12">
      <div v-if="error" class="py-16 text-center">
        <p class="text-sm text-red-500 dark:text-red-400">
          Gagal memuat data. Pastikan Anda login sebagai admin.
        </p>
      </div>
      <div v-else-if="pending" class="py-16 text-center text-sm text-gray-400 dark:text-gray-500">
        Memuat...
      </div>
      <div
        v-else-if="filtered.length === 0"
        class="py-16 text-center text-sm text-gray-400 dark:text-gray-500"
      >
        Tidak ada entri yang cocok.
      </div>

      <div
        v-else
        class="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800"
      >
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
                <th
                  class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wide"
                >
                  Nama
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wide"
                >
                  Lokasi
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wide"
                >
                  QRIS Info
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wide"
                >
                  Kontributor
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wide whitespace-nowrap"
                >
                  Waktu
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wide"
                >
                  Status
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wide"
                >
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              <tr
                v-for="loc in filtered"
                :key="loc.id"
                class="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <!-- Nama -->
                <td class="px-4 py-3 max-w-[200px]">
                  <div class="font-medium text-gray-900 dark:text-gray-200 truncate">
                    {{ loc.name }}
                  </div>
                  <div class="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">
                    {{ loc.description || '—' }}
                  </div>
                </td>

                <!-- Lokasi -->
                <td class="px-4 py-3 whitespace-nowrap">
                  <a
                    :href="`https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <Icon name="material-symbols:location-on" class="w-3.5 h-3.5 shrink-0" />
                    {{ loc.latitude.toFixed(5) }}, {{ loc.longitude.toFixed(5) }}
                  </a>
                </td>

                <!-- QRIS Info -->
                <td class="px-4 py-3 max-w-[200px]">
                  <template v-if="loc._qris">
                    <div class="font-medium text-gray-900 dark:text-gray-200 truncate text-xs">
                      {{ loc._qris.merchantName }}
                    </div>
                    <div class="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">
                      {{ loc._qris.bank }}
                    </div>
                    <div class="text-xs text-gray-400 dark:text-gray-500 truncate">
                      {{ loc._qris.city }} · {{ loc._qris.merchantId }}
                    </div>
                  </template>
                  <span v-else class="text-xs text-gray-300 dark:text-gray-600">—</span>
                </td>

                <!-- Kontributor -->
                <td class="px-4 py-3 max-w-[160px]">
                  <div class="text-xs text-gray-700 dark:text-gray-400 truncate">
                    {{ loc.creator || '—' }}
                  </div>
                  <div
                    v-if="loc.latest_editor && loc.latest_editor !== loc.creator"
                    class="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5"
                  >
                    Ed: {{ loc.latest_editor }}
                  </div>
                </td>

                <!-- Waktu -->
                <td class="px-4 py-3 whitespace-nowrap">
                  <div class="text-xs text-gray-700 dark:text-gray-400">
                    {{ formatDate(loc.created_at) }}
                  </div>
                  <div
                    v-if="loc.modified_at"
                    class="text-xs text-gray-400 dark:text-gray-500 mt-0.5"
                  >
                    Mod: {{ formatDate(loc.modified_at) }}
                  </div>
                </td>

                <!-- Status -->
                <td class="px-4 py-3">
                  <span :class="statusBadge(loc.status)">{{ statusLabel(loc.status) }}</span>
                </td>

                <!-- Aksi -->
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2">
                    <button
                      class="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                      @click="openModal(loc)"
                    >
                      Ubah status
                    </button>
                    <button
                      v-if="loc.status === '0'"
                      class="px-3 py-1.5 text-xs font-medium rounded-lg border border-red-200 dark:border-red-800 bg-white dark:bg-gray-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 transition-colors"
                      @click="openDeleteConfirm(loc)"
                    >
                      Hapus
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <p
        v-if="filtered.length > 0"
        class="text-xs text-gray-400 dark:text-gray-500 mt-3 text-right"
      >
        {{ filtered.length }} entri ditampilkan
      </p>
    </div>

    <!-- Status modal -->
    <Transition name="fade">
      <div
        v-if="modalLoc"
        class="fixed inset-0 z-2000 flex items-center justify-center bg-black/60"
        @click.self="modalLoc = null"
      >
        <div
          class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 space-y-4"
        >
          <div>
            <h2 class="text-base font-semibold text-gray-900 dark:text-gray-100">Ubah Status</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">
              {{ modalLoc.name }}
            </p>
          </div>

          <div class="space-y-2">
            <button
              v-for="opt in modalOptions"
              :key="opt.value"
              class="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-colors"
              :class="
                modalLoc.status === opt.value
                  ? opt.activeClass
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-700'
              "
              :disabled="modalUpdating"
              @click="applyStatus(opt.value)"
            >
              <Icon :name="opt.icon" class="w-4 h-4 shrink-0" :class="opt.iconClass" />
              <div>
                <div class="text-sm font-semibold" :class="opt.labelClass">{{ opt.label }}</div>
                <div class="text-xs text-gray-400 dark:text-gray-500">{{ opt.description }}</div>
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
                class="w-4 h-4 ml-auto animate-spin text-gray-400"
              />
            </button>
          </div>

          <button
            class="w-full text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors py-1"
            @click="modalLoc = null"
          >
            Batal
          </button>
        </div>
      </div>
    </Transition>

    <!-- Delete confirm modal -->
    <Transition name="fade">
      <div
        v-if="deleteLoc"
        class="fixed inset-0 z-2000 flex items-center justify-center bg-black/60"
        @click.self="deleteLoc = null"
      >
        <div
          class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 space-y-4"
        >
          <div>
            <h2 class="text-base font-semibold text-gray-900 dark:text-gray-100">Hapus Permanen</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">
              {{ deleteLoc.name }}
            </p>
          </div>
          <p class="text-sm text-gray-600 dark:text-gray-300">
            Data akan dihapus permanen dari spreadsheet dan tidak dapat dikembalikan.
          </p>
          <div class="flex gap-3">
            <button
              class="flex-1 px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              :disabled="deleteDeleting"
              @click="deleteLoc = null"
            >
              Batal
            </button>
            <button
              class="flex-1 px-4 py-2 text-sm font-medium rounded-xl bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50"
              :disabled="deleteDeleting"
              @click="confirmDelete"
            >
              <Icon
                v-if="deleteDeleting"
                name="material-symbols:progress-activity"
                class="w-4 h-4 animate-spin"
              />
              <span v-else>Hapus</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
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
  }
})

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
    iconClass: 'text-green-600 dark:text-green-400',
    labelClass: 'text-green-700 dark:text-green-400',
    activeClass: 'border-green-400 dark:border-green-600 bg-green-50 dark:bg-green-950',
  },
  {
    value: '2',
    label: 'Pending',
    description: 'Kembalikan ke antrian moderasi',
    icon: 'material-symbols:schedule-outline',
    iconClass: 'text-yellow-600 dark:text-yellow-400',
    labelClass: 'text-yellow-700 dark:text-yellow-400',
    activeClass: 'border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-yellow-950',
  },
  {
    value: '0',
    label: 'Tolak',
    description: 'Sembunyikan dari peta',
    icon: 'material-symbols:cancel-outline',
    iconClass: 'text-red-600 dark:text-red-400',
    labelClass: 'text-red-700 dark:text-red-400',
    activeClass: 'border-red-400 dark:border-red-600 bg-red-50 dark:bg-red-950',
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

function statusBadge(status: string) {
  const base = 'inline-block px-2 py-0.5 text-xs font-semibold rounded-full'
  if (status === '1')
    return `${base} bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300`
  if (status === '2')
    return `${base} bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300`
  return `${base} bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300`
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

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
