<template>
  <div class="flex flex-col gap-2">
    <!-- Map wrapper: relative so search overlay can float, no overflow-hidden here -->
    <div class="relative w-full" style="height: 280px">
      <div ref="mapEl" class="w-full h-full rounded-lg overflow-hidden" />

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

const LOCATION_ON_PATH =
  'M13.413 11.413Q14 10.825 14 10t-.587-1.412T12 8t-1.412.588T10 10t.588 1.413T12 12t1.413-.587M12 22q-4.025-3.425-6.012-6.362T4 10.2q0-3.75 2.413-5.975T12 2t5.588 2.225T20 10.2q0 2.5-1.987 5.438T12 22'

const props = defineProps<{
  modelValue: { lat: number; lng: number } | null
  initialCenter?: { lat: number; lng: number } | null
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

const { style, init: initMapStyle } = useMapStyle()

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
function pinIcon(): DivIcon {
  const el = document.createElement('div')
  vRender(
    h('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', width: 32, height: 32 }, [
      h('path', { fill: '#2563eb', d: LOCATION_ON_PATH }),
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
  })
}

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
</script>
