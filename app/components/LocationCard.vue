<template>
  <Card
    :id="`card-${location.id}`"
    interactive
    role="button"
    tabindex="0"
    :aria-pressed="selected"
    :class="['location-card', { 'location-card--selected': selected }]"
    @click="$emit('click')"
    @keydown.enter.prevent="$emit('click')"
    @keydown.space.prevent="$emit('click')"
  >
    <div class="location-card__inner">
      <div class="flex items-center gap-1.5 min-w-0">
        <p class="font-medium text-(--text-primary) truncate">{{ location.name }}</p>
        <!-- Offline sync pending -->
        <Icon
          v-if="location._pending"
          name="material-symbols:schedule"
          class="text-xs text-(--warning) shrink-0"
          title="Pending sync"
        />
        <!-- Moderation pending -->
        <Badge
          v-if="location.status === '2'"
          color="warning"
          pill
          class="shrink-0"
          title="Menunggu persetujuan admin / Pending admin approval"
        >
          pending
        </Badge>
      </div>
      <p
        v-if="location.description"
        class="text-sm italic text-(--text-secondary) mt-0.5 line-clamp-2"
      >
        &ldquo;{{ location.description }}&rdquo;
      </p>
      <p class="text-xs text-(--text-tertiary) mt-1">
        <span v-if="city">{{ city }}</span>
        <span v-else>{{ location.latitude.toFixed(5) }}, {{ location.longitude.toFixed(5) }}</span>
        <span v-if="distanceLabel"> · {{ distanceLabel }}</span>
      </p>
    </div>
  </Card>
</template>

<script setup lang="ts">
import type { LocalLocation } from '~/utils/db'
import { Card } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { parseQris } from '~/utils/parseQris'

const props = defineProps<{
  location: LocalLocation
  selected?: boolean
  userCenter?: { lat: number; lng: number } | null
}>()

defineEmits<{ click: [] }>()

const city = computed(() => parseQris(props.location.qris)?.city || null)

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

<style scoped>
.location-card {
  text-align: left;
}
.location-card__inner {
  padding: var(--space-3);
}
.location-card--selected {
  border-color: var(--accent);
  background: var(--accent-subtle);
}
</style>
