<template>
  <div class="flex flex-col md:flex-row h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
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
      class="flex-col border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shrink-0 w-full md:w-96"
    >
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
              title="Sign in with Google"
              class="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-blue-900/20 transition-colors flex justify-center items-center"
              @click="gsiPrompt"
            >
              <Icon name="material-symbols:login" class="text-xl w-5 h-5" />
            </button>
          </div>
        </div>

        <input
          v-model="search"
          type="text"
          placeholder="Search by name or description..."
          class="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div class="flex-1 overflow-y-auto p-3 space-y-2">
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
          :is-dark="isDark"
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

const search = ref('')
const selectedId = ref<string | null>(null)
const showAdd = ref(false)
const editTarget = ref<QrisLocation | null>(null)
const userCenter = ref<{ lat: number; lng: number } | null>(null)
const mapCenter = ref<{ lat: number; lng: number } | null>(null)
const activeTab = ref<'list' | 'map'>('list')
const mapViewRef = ref<{ invalidateSize: () => void } | null>(null)
const year = new Date().getFullYear()

const { origin } = useRequestURL()

useSeoMeta({
  title: 'InfaQRIS — Scan. Give. Berkah.',
  description:
    'Peta crowdsource lokasi QRIS masjid dan mushola di Indonesia. Temukan, tambah, dan verifikasi titik QRIS terdekat.',
  ogTitle: 'InfaQRIS — Scan. Give. Berkah.',
  ogDescription: 'Peta crowdsource lokasi QRIS masjid dan mushola di Indonesia.',
  ogImage: `${origin}/android-chrome-512x512.png`,
  ogType: 'website',
  twitterCard: 'summary',
  twitterTitle: 'InfaQRIS — Scan. Give. Berkah.',
  twitterDescription: 'Peta crowdsource lokasi QRIS masjid dan mushola di Indonesia.',
  twitterImage: `${origin}/android-chrome-512x512.png`,
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
  if (!q) return locations.value ?? []
  return (locations.value ?? []).filter(
    (loc) => loc.name.toLowerCase().includes(q) || loc.description.toLowerCase().includes(q),
  )
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

function gsiPrompt() {
  ;(window as any).google?.accounts?.id?.prompt()
}

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
