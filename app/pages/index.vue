<template>
  <div class="flex flex-col md:flex-row h-dvh overflow-hidden bg-gray-50 dark:bg-gray-900">
    <!-- Tab bar: mobile only -->
    <div
      class="flex md:hidden border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shrink-0"
    >
      <button
        :class="
          activeTab === 'list'
            ? 'border-b-2 border-blue-600 text-blue-600 font-medium'
            : 'text-gray-500 dark:text-gray-400'
        "
        class="flex-1 py-3 text-sm flex items-center justify-center gap-1.5"
        @click="activeTab = 'list'"
      >
        <Icon name="material-symbols:format-list-bulleted" class="text-lg" />
        List
      </button>
      <button
        :class="
          activeTab === 'map'
            ? 'border-b-2 border-blue-600 text-blue-600 font-medium'
            : 'text-gray-500 dark:text-gray-400'
        "
        class="flex-1 py-3 text-sm flex items-center justify-center gap-1.5"
        @click="activeTab = 'map'"
      >
        <Icon name="material-symbols:map" class="text-lg" />
        Map
      </button>
    </div>

    <!-- Left panel -->
    <div
      :class="activeTab === 'list' ? 'flex' : 'hidden md:flex'"
      class="flex-col border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-1 min-h-0 md:flex-none md:shrink-0 w-full md:w-96 overflow-hidden"
    >
      <!-- Offline banner -->
      <div
        v-if="!isOnline"
        class="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-400 text-xs"
      >
        <Icon name="material-symbols:wifi-off" class="shrink-0 text-base" />
        <span>You're offline — changes will sync when reconnected</span>
      </div>

      <div class="p-4 border-b border-gray-100 dark:border-gray-700">
        <!-- Title + controls row -->
        <div class="flex items-start justify-between gap-2 mb-3">
          <div class="flex items-center gap-2 min-w-0">
            <img
              src="/android-chrome-192x192.png"
              alt="InfaQRIS"
              class="w-8 h-8 rounded-lg shrink-0"
            />
            <div class="min-w-0">
              <h1 class="text-base font-bold text-gray-900 dark:text-gray-100 leading-tight">
                InfaQRIS
              </h1>
              <p class="text-xs text-gray-400 dark:text-gray-500 italic">Scan. Give. Berkah.</p>
            </div>
          </div>
          <div class="flex items-center gap-1 shrink-0">
            <!-- Pending sync indicator -->
            <div
              v-if="pendingCount > 0 || syncing"
              class="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400"
              :title="syncing ? 'Syncing...' : `${pendingCount} change(s) pending sync`"
            >
              <Icon
                :name="syncing ? 'material-symbols:sync' : 'material-symbols:cloud-off'"
                class="text-sm w-3.5 h-3.5"
                :class="{ 'animate-spin': syncing }"
              />
              <span v-if="!syncing && pendingCount > 0" class="text-xs font-medium">{{
                pendingCount
              }}</span>
            </div>
            <!-- Install PWA -->
            <button
              v-if="canInstall"
              title="Install InfaQRIS"
              class="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-blue-900/20 transition-colors flex justify-center items-center"
              @click="installPwa"
            >
              <Icon name="material-symbols:install-mobile" class="text-xl w-5 h-5" />
            </button>
            <!-- Theme toggle -->
            <button
              :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
              class="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 transition-colors flex justify-center items-center"
              @click="toggleTheme"
            >
              <Icon
                :name="isDark ? 'material-symbols:light-mode' : 'material-symbols:dark-mode'"
                class="text-xl w-5 h-5"
              />
            </button>
            <!-- Signed in -->
            <template v-if="user">
              <div
                class="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 select-none"
                :style="{ backgroundColor: avatarColor(user.email) }"
                :title="user.email"
              >
                {{ user.email[0]?.toUpperCase() }}
              </div>
              <button
                title="Sign out"
                class="p-1.5 rounded-lg text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex justify-center items-center"
                @click="handleLogout"
              >
                <Icon name="material-symbols:logout" class="text-xl h-5 w-5" />
              </button>
            </template>
            <!-- Not signed in -->
            <button
              v-else
              :disabled="!isOnline"
              :title="isOnline ? 'Sign in with Google' : 'Sign in unavailable offline'"
              class="p-1.5 rounded-lg transition-colors flex justify-center items-center"
              :class="
                isOnline
                  ? 'text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-blue-900/20'
                  : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
              "
              @click="isOnline && (showLogin = true)"
            >
              <Icon name="material-symbols:login" class="text-xl w-5 h-5" />
            </button>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <input
            v-model="search"
            type="text"
            placeholder="Search by name or description..."
            class="flex-1 border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div v-if="userCenter" class="relative" data-sort-menu>
            <button
              :title="`Sort: ${sortLabel}`"
              class="p-2 rounded-xl border transition-colors flex items-center justify-center"
              :class="
                sortBy === 'distance'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              "
              @click="showSortMenu = !showSortMenu"
            >
              <Icon name="material-symbols:sort" class="text-lg w-5 h-5" />
            </button>
            <div
              v-if="showSortMenu"
              class="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 overflow-hidden"
            >
              <button
                v-for="opt in sortOptions"
                :key="opt.value"
                class="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left transition-colors"
                :class="
                  sortBy === opt.value
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                "
                @click="sortOptionClicked(opt)"
              >
                <Icon :name="opt.icon" class="text-base w-4 h-4 shrink-0" />
                {{ opt.label }}
                <Icon
                  v-if="sortBy === opt.value"
                  name="material-symbols:check"
                  class="ml-auto text-base w-4 h-4"
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="flex-1 min-h-0 overflow-y-auto p-3 space-y-2">
        <template v-if="pending">
          <div
            v-for="n in 5"
            :key="n"
            class="h-20 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse"
          />
        </template>

        <template v-else-if="filtered.length">
          <LocationCard
            v-for="loc in filtered"
            :key="loc.id"
            :location="loc"
            :selected="selectedId === loc.id"
            :user-center="userCenter"
            @click="selectLocation(loc)"
          />
        </template>

        <div
          v-else
          class="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500"
        >
          <Icon name="material-symbols:map" class="text-4xl mb-2" />
          <p class="text-sm">No locations found</p>
        </div>
      </div>

      <div
        class="px-4 py-2 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between gap-2"
      >
        <span>{{ filtered.length }} of {{ locations?.length ?? 0 }} locations</span>
        <div class="flex items-center gap-2 shrink-0">
          <NuxtLink to="/faq" class="hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
            >FAQ</NuxtLink
          >
          <span>·</span>
          <span
            >© {{ year }}
            <a
              href="https://jaluwibowo.id"
              target="_blank"
              rel="noopener noreferrer"
              class="hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
              >Jalu Wibowo Aji</a
            ></span
          >
        </div>
      </div>
    </div>

    <!-- Right panel — Map -->
    <div :class="activeTab === 'map' ? 'flex' : 'hidden md:flex'" class="flex-1 relative">
      <ClientOnly>
        <MapView
          ref="mapViewRef"
          :locations="locations ?? []"
          :selected-id="selectedId"
          :initial-center="userCenter"
          @marker-click="selectLocation"
          @center-change="mapCenter = $event"
        />
      </ClientOnly>
    </div>

    <!-- FAB — only shown when authenticated -->
    <button
      v-if="user"
      class="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-colors z-1001"
      title="Add QRIS"
      @click="showAdd = true"
    >
      <Icon name="material-symbols:add" class="text-3xl" />
    </button>

    <!-- Detail modal -->
    <ClientOnly>
      <LocationDetail
        v-if="selected"
        :location="selected"
        @close="selectedId = null"
        @edit="openEdit"
        @deleted="selectedId = null"
      />
    </ClientOnly>

    <!-- Edit modal -->
    <EditLocationModal
      v-if="editTarget"
      :location="editTarget"
      @close="editTarget = null"
      @updated="editTarget = null"
    />

    <!-- Add modal -->
    <AddEntryModal
      v-if="showAdd"
      :initial-center="mapCenter ?? userCenter"
      @close="showAdd = false"
      @added="showAdd = false"
    />

    <!-- Login modal -->
    <LoginModal v-if="showLogin" @close="showLogin = false" />
  </div>
</template>

<script setup lang="ts">
import type { QrisLocation } from '~/types'

const route = useRoute()
const router = useRouter()
const runtimeConfig = useRuntimeConfig()

const { locations, pending } = useLocations()
const { user, fetchUser, login, logout } = useAuth()
const { isDark, toggle: toggleTheme, init: initTheme } = useTheme()
const { canInstall, install: installPwa } = useInstallPwa()
const { isOnline } = useNetworkStatus()
const { pendingCount, syncing } = useSync()

const search = ref('')
const selectedId = ref<string | null>(null)
const showAdd = ref(false)
const editTarget = ref<QrisLocation | null>(null)
const userCenter = ref<{ lat: number; lng: number } | null>(null)
const mapCenter = ref<{ lat: number; lng: number } | null>(null)
const activeTab = ref<'list' | 'map'>('list')
const showLogin = ref(false)
const mapViewRef = ref<{ invalidateSize: () => void } | null>(null)
const year = new Date().getFullYear()

type SortBy = 'default' | 'distance'
const sortBy = ref<SortBy>('default')
const showSortMenu = ref(false)

const sortOptions: { value: SortBy; label: string; icon: string }[] = [
  { value: 'default', label: 'Default', icon: 'material-symbols:format-list-numbered' },
  { value: 'distance', label: 'Nearest first', icon: 'material-symbols:near-me' },
]

function sortOptionClicked(opt: (typeof sortOptions)[number]) {
  sortBy.value = opt.value
  showSortMenu.value = false
}

const sortLabel = computed(
  () => sortOptions.find((o) => o.value === sortBy.value)?.label ?? 'Default',
)

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const { origin } = useRequestURL()

useSeoMeta({
  title: 'InfaQRIS — Scan. Give. Berkah.',
  description:
    'Peta crowdsource lokasi QRIS masjid dan mushola di Indonesia. Temukan, tambah, dan verifikasi titik QRIS terdekat.',
  ogTitle: 'InfaQRIS — Scan. Give. Berkah.',
  ogDescription: 'Peta crowdsource lokasi QRIS masjid dan mushola di Indonesia.',
  ogImage: `${origin}/infaqris.png`,
  ogImageWidth: 800,
  ogImageHeight: 800,
  ogType: 'website',
  twitterCard: 'summary',
  twitterTitle: 'InfaQRIS — Scan. Give. Berkah.',
  twitterDescription: 'Peta crowdsource lokasi QRIS masjid dan mushola di Indonesia.',
  twitterImage: `${origin}/infaqris.png`,
})

// Invalidate map size when switching to map tab (Leaflet needs visible container)
watch(activeTab, async (tab) => {
  if (tab === 'map') {
    await nextTick()
    mapViewRef.value?.invalidateSize()
  }
})

// Sync selectedId ↔ ?id= query param
watch(selectedId, (id) => {
  router.replace({ query: id ? { id } : {} })
})

// Scroll selected card into view when selection changes
watch(selectedId, async (id) => {
  if (!id) return
  await nextTick()
  document.getElementById(`card-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
})

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  let list = locations.value ?? []
  if (q) {
    list = list.filter(
      (loc) => loc.name.toLowerCase().includes(q) || loc.description.toLowerCase().includes(q),
    )
  }
  if (sortBy.value === 'distance' && userCenter.value) {
    const { lat, lng } = userCenter.value
    list = [...list].sort(
      (a, b) =>
        haversineKm(lat, lng, a.latitude, a.longitude) -
        haversineKm(lat, lng, b.latitude, b.longitude),
    )
  }
  return list
})

const selected = computed(() =>
  selectedId.value
    ? ((locations.value ?? []).find((l) => l.id === selectedId.value) ?? null)
    : null,
)

function selectLocation(loc: QrisLocation) {
  selectedId.value = loc.id
}

function openEdit(loc: QrisLocation) {
  selectedId.value = null
  editTarget.value = loc
}

const AVATAR_COLORS = [
  '#ef4444',
  '#f97316',
  '#22c55e',
  '#14b8a6',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#10b981',
  '#6366f1',
  '#f59e0b',
  '#84cc16',
]

function avatarColor(email: string): string {
  let hash = 0
  for (const ch of email) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffffff
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]!
}

async function handleLogout() {
  await logout()
}

watch(user, (u) => {
  if (u) showLogin.value = false
})

async function initGsi() {
  const clientId = runtimeConfig.public.googleClientId as string
  if (!clientId) return

  // Poll until GSI script loads (max 5 s)
  for (let i = 0; i < 50; i++) {
    if ((window as any).google?.accounts?.id) break
    await new Promise((r) => setTimeout(r, 100))
  }

  const gsi = (window as any).google?.accounts?.id
  if (!gsi) return

  gsi.initialize({
    client_id: clientId,
    callback: async (resp: { credential: string }) => {
      try {
        await login(resp.credential)
      } catch {
        /* handled by useAuth */
      }
    },
  })

  if (!user.value) gsi.prompt()
}

onMounted(async () => {
  initTheme()
  await fetchUser()
  initGsi()
  document.addEventListener('click', (e) => {
    if (showSortMenu.value && !(e.target as Element)?.closest?.('[data-sort-menu]')) {
      showSortMenu.value = false
    }
  })

  const id = route.query.id as string | undefined
  if (id) selectedId.value = id

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        userCenter.value = { lat: pos.coords.latitude, lng: pos.coords.longitude }
      },
      () => {},
    )
  }
})
</script>
