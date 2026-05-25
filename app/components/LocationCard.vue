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
    <p class="font-medium text-gray-900 dark:text-gray-100 truncate">{{ location.name }}</p>
    <p
      v-if="location.description"
      class="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2"
    >
      {{ location.description }}
    </p>
    <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
      {{ location.latitude.toFixed(5) }}, {{ location.longitude.toFixed(5) }}
    </p>
  </button>
</template>

<script setup lang="ts">
import type { QrisLocation } from '~/types'

defineProps<{
  location: QrisLocation
  selected?: boolean
}>()

defineEmits<{ click: [] }>()
</script>
