<template>
  <div class="relative w-full h-full">
    <div ref="mapEl" class="w-full h-full" />
    <button
      v-if="initialCenter"
      class="absolute top-4 right-4 z-1000 bg-white dark:bg-gray-800 shadow-md rounded-full flex justify-center items-center p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
      title="Back to my location"
      @click="flyHome"
    >
      <Icon name="material-symbols:my-location" class="text-xl h-5 w-5" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { h, render as vRender } from 'vue'
import type { Map as LeafletMap, Marker, DivIcon, MarkerClusterGroup, TileLayer } from 'leaflet'
import type { QrisLocation } from '~/types'

const LOCATION_ON_PATH =
  'M13.413 11.413Q14 10.825 14 10t-.587-1.412T12 8t-1.412.588T10 10t.588 1.413T12 12t1.413-.587M12 22q-4.025-3.425-6.012-6.362T4 10.2q0-3.75 2.413-5.975T12 2t5.588 2.225T20 10.2q0 2.5-1.987 5.438T12 22'

const props = defineProps<{
  locations: QrisLocation[]
  selectedId?: string | null
  initialCenter?: { lat: number; lng: number } | null
  isDark?: boolean
}>()

const emit = defineEmits<{
  markerClick: [location: QrisLocation]
  centerChange: [center: { lat: number; lng: number }]
}>()

const mapEl = ref<HTMLElement | null>(null)
let map: LeafletMap | null = null
let L: typeof import('leaflet') | null = null
let clusterGroup: MarkerClusterGroup | null = null
let tileLayer: TileLayer | null = null
const markers = new Map<string, Marker>()

function pinIcon(color = '#2563eb'): DivIcon {
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

onMounted(async () => {
  const mod = await import('leaflet')
  // Use the default export (mutable CJS object) — the ESM namespace is frozen in production builds
  // and leaflet.markercluster needs to extend it with MarkerClusterGroup
  L = ((mod as any).default ?? mod) as typeof import('leaflet')
  ;(window as any).L = L
  await import('leaflet.markercluster')

  const center = props.initialCenter ?? { lat: -2.5, lng: 118 }
  map = L.map(mapEl.value!).setView([center.lat, center.lng], props.initialCenter ? 13 : 5)

  setTileLayer()

  clusterGroup = L.markerClusterGroup({ chunkedLoading: true })
  clusterGroup.addTo(map)

  map.on('moveend', () => {
    const c = map!.getCenter()
    emit('centerChange', { lat: c.lat, lng: c.lng })
  })

  syncMarkers()
})

function setTileLayer() {
  if (!L || !map) return
  tileLayer?.remove()
  tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
    subdomains: 'abc',
  }).addTo(map)
}

function syncMarkers() {
  if (!map || !L || !clusterGroup) return

  const locById = new Map(props.locations.map((l) => [l.id, l]))

  // Remove deleted
  for (const [id, marker] of markers) {
    if (!locById.has(id)) {
      clusterGroup.removeLayer(marker)
      markers.delete(id)
    }
  }

  // Add new / update existing
  for (const loc of props.locations) {
    const existing = markers.get(loc.id)
    if (existing) {
      const ll = existing.getLatLng()
      if (ll.lat !== loc.latitude || ll.lng !== loc.longitude)
        existing.setLatLng([loc.latitude, loc.longitude])
      existing.setTooltipContent(loc.name)
    } else {
      const isSelected = loc.id === props.selectedId
      const marker = L.marker([loc.latitude, loc.longitude], {
        icon: pinIcon(isSelected ? '#dc2626' : '#2563eb'),
      }).bindTooltip(loc.name)
      marker.on('click', () => emit('markerClick', loc))
      clusterGroup.addLayer(marker)
      markers.set(loc.id, marker)
    }
  }
}

watch(() => props.locations, syncMarkers, { deep: true })

watch(
  () => props.selectedId,
  (id, prevId) => {
    if (prevId) markers.get(prevId)?.setIcon(pinIcon())
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

watch(
  () => props.isDark,
  () => setTileLayer(),
)

function flyHome() {
  if (map && props.initialCenter) map.flyTo([props.initialCenter.lat, props.initialCenter.lng], 15)
}

defineExpose({ invalidateSize: () => map?.invalidateSize() })

onUnmounted(() => map?.remove())
</script>

<style>
@import 'leaflet.markercluster/dist/MarkerCluster.css';
@import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
</style>
