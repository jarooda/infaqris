<template>
  <div class="flex flex-col h-dvh overflow-hidden bg-(--bg-app)">
    <!-- Tab bar: mobile only -->
    <div class="md:hidden border-b border-(--border-default) bg-(--surface-card) shrink-0 p-2">
      <SegmentedControl v-model="activeTab" :options="tabOptions" full-width />
    </div>

    <!-- Desktop: resizable split between list and map -->
    <Resizable v-if="isDesktop" direction="horizontal" class="flex-1 min-h-0" @resize="onResize">
      <ResizablePanel :default-size="28" :min-size="22">
        <MapSidebar
          v-model:selected-id="selectedId"
          :user-center="userCenter"
          @login="showLogin = true"
        />
      </ResizablePanel>
      <ResizablePanel :min-size="30">
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
      </ResizablePanel>
    </Resizable>

    <!-- Mobile: tabbed single panel -->
    <template v-else>
      <MapSidebar
        v-show="activeTab === 'list'"
        v-model:selected-id="selectedId"
        :user-center="userCenter"
        class="flex-1 min-h-0"
        @login="showLogin = true"
      />
      <div v-show="activeTab === 'map'" class="flex-1 relative">
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
    </template>

    <!-- FAB -->
    <button
      class="fab fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center z-1001"
      title="Add QRIS"
      @click="user ? (showAdd = true) : (showLogin = true)"
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
import { SegmentedControl } from '~/components/ui/segmented-control'
import { Resizable, ResizablePanel } from '~/components/ui/resizable'

const route = useRoute()
const router = useRouter()
const runtimeConfig = useRuntimeConfig()

const { locations, refresh: refreshLocations } = useLocations()
const { user, fetchUser, login } = useAuth()
const { init: initTheme } = useTheme()
const { setSort, hasSaved: hasSavedSort } = useSortPreference()

const selectedId = ref<string | null>(null)
const showAdd = ref(false)
const editTarget = ref<QrisLocation | null>(null)
const userCenter = ref<{ lat: number; lng: number } | null>(null)
const mapCenter = ref<{ lat: number; lng: number } | null>(null)
const activeTab = ref<'list' | 'map'>('list')
const showLogin = ref(false)
const mapViewRef = ref<{ invalidateSize: () => void } | null>(null)
const isDesktop = ref(false)

const tabOptions = [
  { value: 'list', label: 'List' },
  { value: 'map', label: 'Map' },
]

const { origin } = useRequestURL()

// Fetch the shared location server-side (if the URL carries ?id=) so link
// previews (WhatsApp/Telegram/FB/X crawlers, which don't run JS) get
// per-location meta instead of the generic site meta.
const { data: sharedLocation } = await useAsyncData(
  'shared-location',
  () => {
    const id = route.query.id as string | undefined
    return id
      ? $fetch<QrisLocation>(`/api/locations/${id}`).catch(() => null)
      : Promise.resolve(null)
  },
  { watch: [() => route.query.id] },
)

const defaultTitle = 'InfaQRIS — Scan. Give. Berkah.'
const defaultDescription =
  'Peta crowdsource lokasi QRIS masjid dan mushola di Indonesia. Temukan, tambah, dan verifikasi titik QRIS terdekat.'

useSeoMeta({
  title: () =>
    sharedLocation.value
      ? `${sharedLocation.value.name} — Bagikan Lokasi Zakat/Infaq | InfaQRIS`
      : defaultTitle,
  description: () =>
    sharedLocation.value
      ? `Scan QRIS di ${sharedLocation.value.name} untuk zakat & infaq. Lihat lokasi & detail QRIS-nya di InfaQRIS.`
      : defaultDescription,
  ogUrl: () => (sharedLocation.value ? `${origin}/?id=${sharedLocation.value.id}` : origin),
  ogTitle: () => (sharedLocation.value ? sharedLocation.value.name : defaultTitle),
  ogDescription: () =>
    sharedLocation.value
      ? `Scan QRIS di ${sharedLocation.value.name} untuk zakat & infaq.`
      : 'Peta crowdsource lokasi QRIS masjid dan mushola di Indonesia.',
  ogImage: () =>
    sharedLocation.value
      ? `${origin}/api/og/${sharedLocation.value.id}.png`
      : `${origin}/infaqris.png`,
  ogImageWidth: 800,
  ogImageHeight: 800,
  ogType: 'website',
  twitterCard: () => (sharedLocation.value ? 'summary_large_image' : 'summary'),
  twitterTitle: () => (sharedLocation.value ? sharedLocation.value.name : defaultTitle),
  twitterDescription: () =>
    sharedLocation.value
      ? `Scan QRIS di ${sharedLocation.value.name} untuk zakat & infaq.`
      : 'Peta crowdsource lokasi QRIS masjid dan mushola di Indonesia.',
  twitterImage: () =>
    sharedLocation.value
      ? `${origin}/api/og/${sharedLocation.value.id}.png`
      : `${origin}/infaqris.png`,
})

// Invalidate map size when switching to the map tab (Leaflet needs a visible container)
watch(activeTab, async (tab) => {
  if (tab === 'map') {
    await nextTick()
    mapViewRef.value?.invalidateSize()
  }
})

// Re-render map tiles after the divider is dragged (container width changed)
async function onResize() {
  await nextTick()
  mapViewRef.value?.invalidateSize()
}

// Sync selectedId ↔ ?id= query param
watch(selectedId, (id) => {
  router.replace({ query: id ? { id } : {} })
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

watch(user, (u) => {
  if (u) {
    showLogin.value = false
    refreshLocations()
  }
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

// Desktop = md breakpoint (768px). Toggled after mount to avoid hydration mismatch.
let mq: MediaQueryList | null = null
function onMqChange(e: MediaQueryListEvent) {
  isDesktop.value = e.matches
}

onMounted(async () => {
  initTheme()
  mq = window.matchMedia('(min-width: 768px)')
  isDesktop.value = mq.matches
  mq.addEventListener('change', onMqChange)

  await fetchUser()
  initGsi()

  const id = route.query.id as string | undefined
  if (id) selectedId.value = id

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        userCenter.value = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        // First time granting location access (no sort saved yet): default to nearest-first.
        if (!hasSavedSort()) setSort('distance')
      },
      () => {},
    )
  }
})

onUnmounted(() => {
  mq?.removeEventListener('change', onMqChange)
})
</script>

<style scoped>
/* Leaflet's map panes/markers/popups render above the resize handle's default
   z-index, hiding its hover grip and swallowing drag pointer-events. Lift the
   handle above the map layers so the divider stays visible and draggable. */
:deep(.jl-resizable__handle) {
  z-index: 1000;
}

.fab {
  background: var(--accent);
  color: var(--text-on-brand);
  box-shadow: var(--shadow-lg);
  transition: var(--transition-control);
}
.fab:hover {
  background: var(--accent-hover);
}
.fab:active {
  background: var(--accent-active);
}
</style>
