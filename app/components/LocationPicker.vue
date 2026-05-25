<template>
  <div class="flex flex-col gap-2">
    <div ref="mapEl" class="w-full rounded-lg overflow-hidden" style="height: 280px" />
    <div class="flex items-center justify-between text-sm">
      <span v-if="modelValue" class="text-gray-600 dark:text-gray-400">
        {{ modelValue.lat.toFixed(6) }}, {{ modelValue.lng.toFixed(6) }}
      </span>
      <span v-else class="text-gray-400 dark:text-gray-500">Click on the map to set location</span>
      <button
        type="button"
        class="flex items-center gap-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
        @click="useMyLocation"
      >
        <Icon name="material-symbols:my-location" class="text-base" />
        Use my location
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { h, render as vRender } from 'vue'
import type { Map, Marker, DivIcon } from 'leaflet'

const LOCATION_ON_PATH =
  'M13.413 11.413Q14 10.825 14 10t-.587-1.412T12 8t-1.412.588T10 10t.588 1.413T12 12t1.413-.587M12 22q-4.025-3.425-6.012-6.362T4 10.2q0-3.75 2.413-5.975T12 2t5.588 2.225T20 10.2q0 2.5-1.987 5.438T12 22'

const props = defineProps<{
  modelValue: { lat: number; lng: number } | null
  initialCenter?: { lat: number; lng: number } | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: { lat: number; lng: number }]
}>()

const mapEl = ref<HTMLElement | null>(null)
let map: Map | null = null
let L: typeof import('leaflet') | null = null
let marker: Marker | null = null

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

onMounted(async () => {
  L = await import('leaflet')

  const fallback = props.initialCenter ?? { lat: -2.5, lng: 118 }
  const center: [number, number] = props.modelValue
    ? [props.modelValue.lat, props.modelValue.lng]
    : [fallback.lat, fallback.lng]
  const zoom = props.modelValue ? 14 : props.initialCenter ? 13 : 5

  map = L.map(mapEl.value!).setView(center, zoom)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  }).addTo(map)

  if (props.modelValue) placeMarker(props.modelValue)

  map.on('click', (e) => {
    const pos = { lat: e.latlng.lat, lng: e.latlng.lng }
    placeMarker(pos)
    emit('update:modelValue', pos)
  })
})

function placeMarker(pos: { lat: number; lng: number }) {
  if (!map || !L) return
  if (marker) marker.setLatLng([pos.lat, pos.lng])
  else marker = L.marker([pos.lat, pos.lng], { icon: pinIcon() }).addTo(map)
}

function useMyLocation() {
  if (!navigator.geolocation) return
  navigator.geolocation.getCurrentPosition((pos) => {
    const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
    placeMarker(loc)
    map?.flyTo([loc.lat, loc.lng], 16)
    emit('update:modelValue', loc)
  })
}

onUnmounted(() => map?.remove())
</script>
