<template>
  <Popover v-model:open="open" align="end" :arrow="false">
    <template #trigger>
      <span class="inline-flex items-center gap-0.5 cursor-pointer group" :title="user.email">
        <Avatar
          :name="user.email"
          :size="32"
          ring
          class="transition-transform group-hover:scale-105"
        />
        <Icon
          name="material-symbols:keyboard-arrow-down-rounded"
          class="text-(--text-tertiary) transition-transform"
          :class="{ 'rotate-180': open }"
        />
      </span>
    </template>

    <div class="w-full sm:w-60">
      <p class="text-sm font-medium text-(--text-primary) truncate mb-3">{{ user.email }}</p>

      <template v-if="pending">
        <Skeleton variant="rect" :height="52" :radius="12" />
      </template>
      <div v-else class="grid grid-cols-3 gap-1.5">
        <div
          v-for="stat in stats"
          :key="stat.label"
          class="rounded-lg bg-(--surface-sunken) px-1.5 py-2 text-center"
        >
          <p class="text-[10px] uppercase tracking-wide text-(--text-tertiary) truncate">
            {{ stat.label }}
          </p>
          <p class="text-sm font-semibold text-(--text-primary)">{{ stat.value }}</p>
        </div>
      </div>

      <NuxtLink v-if="isAdmin" to="/admin" class="block mt-3">
        <Button variant="secondary" size="sm" full-width>
          <template #icon><Icon name="material-symbols:admin-panel-settings" /></template>
          Admin panel
        </Button>
      </NuxtLink>

      <div class="my-3 pt-3 border-t border-(--border-subtle) space-y-1">
        <button
          v-if="canInstall"
          type="button"
          class="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-(--text-secondary) hover:bg-(--surface-sunken) transition-colors"
          @click="$emit('install')"
        >
          <Icon name="material-symbols:install-mobile" class="text-base" />
          Install InfaQRIS
        </button>
        <button
          type="button"
          class="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-(--text-secondary) hover:bg-(--surface-sunken) transition-colors"
          @click="$emit('toggle-theme')"
        >
          <Icon
            :name="isDark ? 'material-symbols:light-mode' : 'material-symbols:dark-mode'"
            class="text-base"
          />
          {{ isDark ? 'Light mode' : 'Dark mode' }}
        </button>
        <button
          type="button"
          class="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-(--danger-text) hover:bg-(--danger-subtle) transition-colors"
          @click="$emit('logout')"
        >
          <Icon name="material-symbols:logout" class="text-base" />
          Sign out
        </button>
      </div>
    </div>
  </Popover>
</template>

<script setup lang="ts">
import type { QrisLocation } from '~/types'
import { Popover } from '~/components/ui/popover'
import { Avatar } from '~/components/ui/avatar'
import { Skeleton } from '~/components/ui/skeleton'
import { Button } from '~/components/ui/button'

defineProps<{
  user: { email: string; isAdmin: boolean }
  isAdmin: boolean
  isDark: boolean
  canInstall: boolean
}>()
defineEmits<{ 'toggle-theme': []; install: []; logout: [] }>()

const open = ref(false)
const pending = ref(false)
const contributions = ref<QrisLocation[]>([])
const fetched = ref(false)

const counts = computed(() => ({
  accepted: contributions.value.filter((l) => l.status === '1').length,
  pending: contributions.value.filter((l) => l.status === '2').length,
  declined: contributions.value.filter((l) => l.status === '0').length,
}))

const stats = computed(() => [
  { label: 'Accepted', value: counts.value.accepted },
  { label: 'Pending', value: counts.value.pending },
  { label: 'Declined', value: counts.value.declined },
])

watch(open, async (v) => {
  if (!v || fetched.value) return
  pending.value = true
  try {
    contributions.value = await $fetch<QrisLocation[]>('/api/me/locations')
    fetched.value = true
  } catch {
    contributions.value = []
  } finally {
    pending.value = false
  }
})
</script>
