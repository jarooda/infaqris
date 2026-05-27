<template>
  <button
    :id="`card-${location.id}`"
    :class="[
      'w-full text-left p-3 rounded-lg border transition-colors',
      selected
        ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/30'
        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600 dark:hover:bg-gray-700',
    ]"
    @click="$emit('click')"
  >
    <div class="flex items-center gap-1.5 min-w-0">
      <p class="font-medium text-gray-900 dark:text-gray-100 truncate">{{ location.name }}</p>
      <!-- Offline sync pending -->
      <Icon
        v-if="location._pending"
        name="material-symbols:schedule"
        class="text-xs text-amber-500 dark:text-amber-400 shrink-0"
        title="Pending sync"
      />
      <!-- Moderation pending -->
      <span
        v-if="location.status === '2'"
        class="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 shrink-0 leading-tight"
        title="Menunggu persetujuan admin / Pending admin approval"
      >
        pending
      </span>
    </div>
    <p
      v-if="location.description"
      class="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2"
    >
      {{ location.description }}
    </p>
    <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
      {{ location.latitude.toFixed(5) }}, {{ location.longitude.toFixed(5) }}
      <span v-if="distanceLabel" class="text-gray-400 dark:text-gray-500">
        · {{ distanceLabel }}</span
      >
    </p>
  </button>
</template>

<script setup lang="ts">
import type { LocalLocation } from '~/utils/db'

const props = defineProps<{
  location: LocalLocation
  selected?: boolean
  userCenter?: { lat: number; lng: number } | null
}>()

defineEmits<{ click: [] }>()

const distanceLabel = computed(() => {
  if (!props.userCenter) return null
  const { lat, lng } = props.userCenter
  const R = 6371
  const dLat = ((props.location.latitude - lat) * Math.PI) / 180
  const dLng = ((props.location.longitude - lng) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat * Math.PI) / 180) *
      Math.cos((props.location.latitude * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  const km = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return km < 1 ? `${Math.round(km * 1000)} m away` : `${km.toFixed(1)} km away`
})
</script>
