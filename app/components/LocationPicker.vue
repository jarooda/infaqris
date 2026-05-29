<template>
  <div class="flex flex-col gap-2">
    <!-- Map wrapper: relative so search overlay can float, no overflow-hidden here -->
    <div class="relative w-full" style="height: 280px">
      <div ref="mapEl" class="w-full h-full rounded-lg overflow-hidden" />

      <!-- Layer switcher (top-right) — compact to stay light on the small map -->
      <div
        class="absolute top-2 right-2 z-1000 bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden flex flex-col"
      >
        <button
          v-for="layer in MAP_STYLE_OPTIONS"
          :key="layer.key"
          type="button"
          :title="layer.label"
          :class="[
            'flex items-center justify-center p-1.5 transition-colors',
            style === layer.key
              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700',
          ]"
          @click="changeStyle(layer.key)"
        >
          <Icon :name="layer.icon" class="w-4 h-4" />
        </button>
      </div>

      <!-- Search (top-left) -->
      <div ref="searchWrapperEl" class="absolute top-2 left-2 z-1000 flex flex-col gap-1.5">
        <div
          class="bg-white dark:bg-gray-800 shadow-md rounded-full flex items-center overflow-hidden transition-all duration-200"
          :style="searchOpen ? 'width:200px' : ''"
        >
          <button
            type="button"
            class="shrink-0 p-1.5 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center justify-center"
            :title="searchOpen ? 'Search' : 'Search location'"
            @click="searchOpen ? doSearch() : openSearch()"
          >
            <Icon
              :name="searching ? 'material-symbols:progress-activity' : 'material-symbols:search'"
              class="w-4 h-4"
              :class="{ 'animate-spin': searching }"
            />
          </button>
          <input
            v-if="searchOpen"
            ref="searchInputEl"
            v-model="searchQuery"
            type="text"
            placeholder="Search place..."
            class="flex-1 min-w-0 text-xs bg-transparent text-gray-800 dark:text-gray-200 placeholder-gray-400 outline-none py-1.5 pr-2"
            @keydown.enter="doSearch"
            @keydown.escape="closeSearch"
          />
        </div>

        <!-- Results dropdown -->
        <div
          v-if="searchResults.length"
          class="bg-white dark:bg-gray-800 shadow-lg rounded-xl overflow-hidden"
          style="width: 200px"
        >
          <button
            v-for="r in searchResults"
            :key="r.place_id"
            type="button"
            class="w-full text-left px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0"
            @click="flyToResult(r)"
          >
            <span class="line-clamp-2 leading-relaxed">{{ r.display_name }}</span>
          </button>
        </div>

        <!-- No results -->
        <div
          v-else-if="searchDone && !searching"
          class="bg-white dark:bg-gray-800 shadow-md rounded-xl px-3 py-2 text-xs text-gray-500 dark:text-gray-400"
          style="width: 200px"
        >
          No results found
        </div>
      </div>
    </div>

    <div class="flex flex-col gap-2 items-center justify-between text-sm">
      <span v-if="modelValue" class="text-gray-600 dark:text-gray-400">
        {{ modelValue.lat.toFixed(6) }}, {{ modelValue.lng.toFixed(6) }}
      </span>
      <span v-else class="text-gray-400 dark:text-gray-500">Click on the map to set location</span>

      <!-- Duplicate proximity warning -->
      <div
        v-if="nearby"
        class="w-full flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-2"
      >
        <Icon name="material-symbols:warning-outline" class="w-4 h-4 shrink-0 mt-0.5" />
        <span>
          Sudah ada QRIS terdekat: <strong>{{ nearby.location.name }}</strong> (~{{
            nearby.distance
          }}m). Pastikan ini bukan duplikat. /
          <em>A QRIS already exists nearby — make sure this isn't a duplicate.</em>
        </span>
      </div>
      <button
        v-if="geolocationAvailable"
        type="button"
        :disabled="locating"
        class="flex items-center gap-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        @click="useMyLocation"
      >
        <Icon
          :name="locating ? 'material-symbols:progress-activity' : 'material-symbols:my-location'"
          class="text-base"
          :class="{ 'animate-spin': locating }"
        />
        {{ locating ? 'Locating…' : 'Use my location' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { h, render as vRender } from 'vue'
import type { Map, Marker, DivIcon, TileLayer } from 'leaflet'
import type { QrisLocation } from '~/types'
import type { MapStyle } from '~/composables/useMapStyle'

const LOCATION_ON_PATH =
  'M13.413 11.413Q14 10.825 14 10t-.587-1.412T12 8t-1.412.588T10 10t.588 1.413T12 12t1.413-.587M12 22q-4.025-3.425-6.012-6.362T4 10.2q0-3.75 2.413-5.975T12 2t5.588 2.225T20 10.2q0 2.5-1.987 5.438T12 22'

// Warn when the picked spot is within this many metres of an existing QRIS
const PROXIMITY_METERS = 30

const props = defineProps<{
  modelValue: { lat: number; lng: number } | null
  initialCenter?: { lat: number; lng: number } | null
  // Existing locations shown as muted reference pins to help avoid duplicates
  locations?: QrisLocation[]
  // Location id to exclude from reference pins / proximity check (e.g. when editing)
  excludeId?: string
  // Hide the proximity warning (e.g. while submitting, when the optimistic insert
  // would otherwise make the just-picked spot look like a duplicate of itself)
  suppressWarning?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: { lat: number; lng: number }]
}>()

// ─── Map state ────────────────────────────────────────────────────────────────
const mapEl = ref<HTMLElement | null>(null)
let map: Map | null = null
let L: typeof import('leaflet') | null = null
let marker: Marker | null = null
let tileLayer: TileLayer | null = null

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
  const loc = { lat: +r.lat, lng: +r.lon }
  const [s, n, w, e] = r.boundingbox
  map.fitBounds([
    [+s, +w],
    [+n, +e],
  ])
  placeMarker(loc)
  emit('update:modelValue', loc)
  closeSearch()
}

function onDocumentClick(e: MouseEvent) {
  if (searchWrapperEl.value && !searchWrapperEl.value.contains(e.target as Node)) {
    searchResults.value = []
    searchDone.value = false
    if (searchOpen.value && !searchQuery.value) closeSearch()
  }
}

// ─── Geolocation ──────────────────────────────────────────────────────────────
const geolocationAvailable = ref(false)
const locating = ref(false)

async function checkGeolocation() {
  if (!('geolocation' in navigator)) return
  try {
    const status = await navigator.permissions.query({ name: 'geolocation' })
    geolocationAvailable.value = status.state !== 'denied'
    // React to permission changes (e.g. user revokes in browser settings)
    status.addEventListener('change', () => {
      geolocationAvailable.value = status.state !== 'denied'
    })
  } catch {
    // Permissions API not supported — assume available and let the prompt decide
    geolocationAvailable.value = true
  }
}

function useMyLocation() {
  if (!navigator.geolocation || !map) return
  locating.value = true
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      locating.value = false
      const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
      map!.setView([loc.lat, loc.lng], 16)
      placeMarker(loc)
      emit('update:modelValue', loc)
    },
    (err) => {
      locating.value = false
      if (err.code === err.PERMISSION_DENIED) geolocationAvailable.value = false
    },
    { enableHighAccuracy: true, timeout: 10_000 },
  )
}

// ─── Map helpers ──────────────────────────────────────────────────────────────
function pinIcon(color = '#2563eb', size = 32): DivIcon {
  const el = document.createElement('div')
  vRender(
    h(
      'svg',
      { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', width: size, height: size },
      [h('path', { fill: color, d: LOCATION_ON_PATH })],
    ),
    el,
  )
  const html = el.innerHTML
  vRender(null, el)
  return L!.divIcon({
    html,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
  })
}

// ─── Reference markers (existing locations) ─────────────────────────────────────
let refMarkers: Marker[] = []

function syncRefMarkers() {
  if (!map || !L) return
  for (const m of refMarkers) m.remove()
  refMarkers = []
  for (const loc of props.locations ?? []) {
    if (loc.id === props.excludeId) continue
    const m = L.marker([loc.latitude, loc.longitude], {
      icon: pinIcon('#94a3b8', 24), // muted grey, smaller — clearly not the user's pin
      interactive: false, // don't intercept map clicks used to place the pin
      keyboard: false,
      zIndexOffset: -1000,
    })
    m.setOpacity(0.65)
    m.addTo(map)
    refMarkers.push(m)
  }
}

// ─── Proximity check ────────────────────────────────────────────────────────────
function distanceMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(x))
}

const nearby = computed(() => {
  if (props.suppressWarning || !props.modelValue) return null
  let closest: QrisLocation | null = null
  let min = Infinity
  for (const loc of props.locations ?? []) {
    if (loc.id === props.excludeId) continue
    const d = distanceMeters(props.modelValue, { lat: loc.latitude, lng: loc.longitude })
    if (d < min) {
      min = d
      closest = loc
    }
  }
  if (closest && min <= PROXIMITY_METERS) return { location: closest, distance: Math.round(min) }
  return null
})

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

function placeMarker(pos: { lat: number; lng: number }) {
  if (!map || !L) return
  if (marker) marker.setLatLng([pos.lat, pos.lng])
  else marker = L.marker([pos.lat, pos.lng], { icon: pinIcon() }).addTo(map)
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────
onMounted(async () => {
  initMapStyle()

  L = await import('leaflet')

  const fallback = props.initialCenter ?? { lat: -2.5, lng: 118 }
  const center: [number, number] = props.modelValue
    ? [props.modelValue.lat, props.modelValue.lng]
    : [fallback.lat, fallback.lng]
  const zoom = props.modelValue ? 14 : props.initialCenter ? 13 : 5

  map = L.map(mapEl.value!, { zoomControl: false }).setView(center, zoom)

  setTileLayer()
  syncRefMarkers()

  if (props.modelValue) placeMarker(props.modelValue)

  map.on('click', (e) => {
    const pos = { lat: e.latlng.lat, lng: e.latlng.lng }
    placeMarker(pos)
    emit('update:modelValue', pos)
  })

  document.addEventListener('click', onDocumentClick)
  checkGeolocation()
})

onUnmounted(() => {
  map?.remove()
  document.removeEventListener('click', onDocumentClick)
})

// Keep tile layer in sync with global map style changes
watch(style, () => setTileLayer())

// Re-render reference pins when the locations list changes
watch(() => props.locations, syncRefMarkers, { deep: true })
</script>
