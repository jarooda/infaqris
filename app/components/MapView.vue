<template>
  <div class="relative w-full h-full">
    <div ref="mapEl" class="w-full h-full" />

    <!-- Search (top-left) -->
    <div ref="searchWrapperEl" class="absolute top-4 left-4 z-1000 flex flex-col gap-1.5">
      <div
        class="bg-(--surface-overlay) shadow-md rounded-full flex items-center overflow-hidden transition-all duration-200"
        :style="searchOpen ? 'width:220px' : ''"
      >
        <button
          class="map-ctrl-btn shrink-0 p-2 rounded-full flex items-center justify-center"
          :title="searchOpen ? 'Search' : 'Search location'"
          @click="searchOpen ? doSearch() : openSearch()"
        >
          <Icon
            :name="searching ? 'material-symbols:progress-activity' : 'material-symbols:search'"
            class="w-5 h-5"
            :class="{ 'animate-spin': searching }"
          />
        </button>
        <input
          v-if="searchOpen"
          ref="searchInputEl"
          v-model="searchQuery"
          type="text"
          placeholder="Search place..."
          class="flex-1 min-w-0 text-sm bg-transparent text-(--text-primary) placeholder:text-(--text-tertiary) outline-none py-2 pr-3"
          @keydown.enter="doSearch"
          @keydown.escape="closeSearch"
        />
      </div>

      <!-- Results dropdown -->
      <div
        v-if="searchResults.length"
        class="bg-(--surface-overlay) shadow-lg rounded-xl overflow-hidden"
        style="width: 220px"
      >
        <button
          v-for="r in searchResults"
          :key="r.place_id"
          class="w-full text-left px-3 py-2 text-xs text-(--text-secondary) hover:bg-(--surface-hover) transition-colors border-b border-(--border-subtle) last:border-0"
          @click="flyToResult(r)"
        >
          <span class="line-clamp-2 leading-relaxed">{{ r.display_name }}</span>
        </button>
      </div>

      <!-- No results -->
      <div
        v-else-if="searchDone && !searching"
        class="bg-(--surface-overlay) shadow-md rounded-xl px-3 py-2 text-xs text-(--text-secondary)"
        style="width: 220px"
      >
        No results found
      </div>
    </div>

    <!-- Right-side controls -->
    <div class="absolute top-4 right-4 z-1000 flex flex-col gap-2">
      <!-- Back to my location -->
      <button
        v-if="initialCenter"
        class="map-ctrl-btn map-ctrl-btn--accent bg-(--surface-overlay) shadow-md rounded-full flex justify-center items-center p-2"
        title="Back to my location"
        @click="flyHome"
      >
        <Icon name="material-symbols:my-location" class="text-xl h-5 w-5" />
      </button>

      <!-- Layer switcher -->
      <div class="bg-(--surface-overlay) shadow-md rounded-xl overflow-hidden flex flex-col">
        <button
          v-for="layer in MAP_STYLE_OPTIONS"
          :key="layer.key"
          :title="layer.label"
          class="map-ctrl-btn flex items-center justify-center p-2 transition-colors"
          :class="{ 'map-ctrl-btn--active': style === layer.key }"
          @click="changeStyle(layer.key)"
        >
          <Icon :name="layer.icon" class="w-5 h-5" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { h, render as vRender } from 'vue'
import type { Map as LeafletMap, Marker, DivIcon, MarkerClusterGroup, TileLayer } from 'leaflet'
import type { QrisLocation } from '~/types'
import type { MapStyle } from '~/composables/useMapStyle'

const LOCATION_ON_PATH =
  'M13.413 11.413Q14 10.825 14 10t-.587-1.412T12 8t-1.412.588T10 10t.588 1.413T12 12t1.413-.587M12 22q-4.025-3.425-6.012-6.362T4 10.2q0-3.75 2.413-5.975T12 2t5.588 2.225T20 10.2q0 2.5-1.987 5.438T12 22'

// ─── Props / Emits ────────────────────────────────────────────────────────────
const props = defineProps<{
  locations: QrisLocation[]
  selectedId?: string | null
  initialCenter?: { lat: number; lng: number } | null
}>()

const emit = defineEmits<{
  markerClick: [location: QrisLocation]
  centerChange: [center: { lat: number; lng: number }]
}>()

// ─── Map state ────────────────────────────────────────────────────────────────
const mapEl = ref<HTMLElement | null>(null)
let map: LeafletMap | null = null
let L: typeof import('leaflet') | null = null
let clusterGroup: MarkerClusterGroup | null = null
let tileLayer: TileLayer | null = null
const markers = new Map<string, Marker>()

// ─── Map style ────────────────────────────────────────────────────────────────
const { style, setStyle, init: initMapStyle } = useMapStyle()

function changeStyle(s: MapStyle) {
  setStyle(s)
  setTileLayer()
}

// ─── Search state ─────────────────────────────────────────────────────────────
interface NominatimResult {
  place_id: number
  display_name: string
  lat: string
  lon: string
  boundingbox: [string, string, string, string]
}

const searchWrapperEl = ref<HTMLElement | null>(null)
const searchInputEl = ref<HTMLInputElement | null>(null)
const searchOpen = ref(false)
const searchQuery = ref('')
const searchResults = ref<NominatimResult[]>([])
const searching = ref(false)
const searchDone = ref(false)

function openSearch() {
  searchOpen.value = true
  nextTick(() => searchInputEl.value?.focus())
}

function closeSearch() {
  searchOpen.value = false
  searchQuery.value = ''
  searchResults.value = []
  searchDone.value = false
}

async function doSearch() {
  const q = searchQuery.value.trim()
  if (!q) return
  searching.value = true
  searchDone.value = false
  searchResults.value = []
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5`,
      { headers: { 'Accept-Language': 'id,en' } },
    )
    searchResults.value = await res.json()
  } catch {
    searchResults.value = []
  } finally {
    searching.value = false
    searchDone.value = true
  }
}

function flyToResult(r: NominatimResult) {
  if (!map) return
  const [s, n, w, e] = r.boundingbox
  map.fitBounds([
    [+s, +w],
    [+n, +e],
  ])
  closeSearch()
}

// Click outside search wrapper → close results
function onDocumentClick(e: MouseEvent) {
  if (searchWrapperEl.value && !searchWrapperEl.value.contains(e.target as Node)) {
    searchResults.value = []
    searchDone.value = false
    if (searchOpen.value && !searchQuery.value) closeSearch()
  }
}

// ─── Marker helpers ───────────────────────────────────────────────────────────
function pinIcon(color = '#157053'): DivIcon {
  const el = document.createElement('div')
  vRender(
    h('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', width: 32, height: 32 }, [
      h('path', { fill: color, d: LOCATION_ON_PATH }),
    ]),
    el,
  )
  const html = el.innerHTML
  vRender(null, el)
  return L!.divIcon({
    html,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    tooltipAnchor: [0, -32],
  })
}

// ─── Tile layer ───────────────────────────────────────────────────────────────
function setTileLayer() {
  if (!L || !map) return
  tileLayer?.remove()
  const cfg = MAP_TILE_CONFIGS[style.value]
  tileLayer = L.tileLayer(cfg.url, {
    attribution: cfg.attribution,
    maxZoom: cfg.maxZoom,
    ...(cfg.subdomains ? { subdomains: cfg.subdomains } : {}),
  }).addTo(map)
}

// ─── Marker color ─────────────────────────────────────────────────────────────
function markerColor(loc: QrisLocation, isSelected: boolean): string {
  if (isSelected) return '#dc2626' // red — selected
  if (loc.status === '2') return '#f59e0b' // amber — pending approval
  return '#157053' // emerald — active
}

// ─── Markers ──────────────────────────────────────────────────────────────────
function syncMarkers() {
  if (!map || !L || !clusterGroup) return

  const locById = new Map(props.locations.map((l) => [l.id, l]))

  for (const [id, marker] of markers) {
    if (!locById.has(id)) {
      clusterGroup.removeLayer(marker)
      markers.delete(id)
    }
  }

  for (const loc of props.locations) {
    const existing = markers.get(loc.id)
    if (existing) {
      const ll = existing.getLatLng()
      if (ll.lat !== loc.latitude || ll.lng !== loc.longitude)
        existing.setLatLng([loc.latitude, loc.longitude])
      existing.setTooltipContent(loc.name)
      existing.setIcon(pinIcon(markerColor(loc, loc.id === props.selectedId)))
    } else {
      const marker = L!
        .marker([loc.latitude, loc.longitude], {
          icon: pinIcon(markerColor(loc, loc.id === props.selectedId)),
        })
        .bindTooltip(loc.name)
      marker.on('click', () => emit('markerClick', loc))
      clusterGroup!.addLayer(marker)
      markers.set(loc.id, marker)
    }
  }
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────
onMounted(async () => {
  initMapStyle()

  const mod = await import('leaflet')
  L = ((mod as any).default ?? mod) as typeof import('leaflet')
  ;(window as any).L = L
  await import('leaflet.markercluster')

  const center = props.initialCenter ?? { lat: -2.5, lng: 118 }
  map = L.map(mapEl.value!, { zoomControl: false }).setView(
    [center.lat, center.lng],
    props.initialCenter ? 13 : 5,
  )
  L.control.zoom({ position: 'bottomleft' }).addTo(map)

  setTileLayer()

  clusterGroup = L.markerClusterGroup({ chunkedLoading: true })
  clusterGroup.addTo(map)

  map.on('moveend', () => {
    const c = map!.getCenter()
    emit('centerChange', { lat: c.lat, lng: c.lng })
  })

  syncMarkers()

  document.addEventListener('click', onDocumentClick)
})

onUnmounted(() => {
  map?.remove()
  document.removeEventListener('click', onDocumentClick)
})

// ─── Watchers ─────────────────────────────────────────────────────────────────
watch(() => props.locations, syncMarkers, { deep: true })

watch(
  () => props.selectedId,
  (id, prevId) => {
    if (prevId) {
      const prevLoc = props.locations.find((l) => l.id === prevId)
      markers.get(prevId)?.setIcon(pinIcon(prevLoc ? markerColor(prevLoc, false) : '#157053'))
    }
    if (!id || !map) return
    markers.get(id)?.setIcon(pinIcon('#dc2626'))
    const loc = props.locations.find((l) => l.id === id)
    if (loc) map.flyTo([loc.latitude, loc.longitude], 16)
  },
)

watch(
  () => props.initialCenter,
  (center) => {
    if (center && map) map.flyTo([center.lat, center.lng], 13)
  },
)

// React to style changes from other components (e.g. LocationPicker)
watch(style, () => setTileLayer())

// ─── Expose ───────────────────────────────────────────────────────────────────
function flyHome() {
  if (map && props.initialCenter) map.flyTo([props.initialCenter.lat, props.initialCenter.lng], 15)
}

defineExpose({ invalidateSize: () => map?.invalidateSize() })
</script>

<style>
@import 'leaflet.markercluster/dist/MarkerCluster.css';
@import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
</style>

<style scoped>
.map-ctrl-btn {
  color: var(--text-secondary);
  transition: var(--transition-control);
}
.map-ctrl-btn:hover {
  background: var(--surface-hover);
  color: var(--text-primary);
}
.map-ctrl-btn--active {
  background: var(--accent-subtle);
  color: var(--text-brand);
}
.map-ctrl-btn--accent {
  color: var(--accent);
}
.map-ctrl-btn--accent:hover {
  background: var(--accent-subtle);
  color: var(--accent-hover);
}
</style>
