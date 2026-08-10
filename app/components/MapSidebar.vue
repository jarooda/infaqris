<template>
  <div class="flex flex-col h-full bg-(--surface-card) overflow-hidden">
    <!-- Offline banner -->
    <Banner v-if="!isOnline" tone="warning">
      <template #icon><Icon name="material-symbols:wifi-off" /></template>
      You're offline — changes will sync when reconnected
    </Banner>

    <div class="p-4 border-b border-(--border-subtle)">
      <!-- Title + controls row -->
      <div class="flex items-start justify-between gap-2 mb-3">
        <div class="flex items-center gap-2 min-w-0">
          <img
            src="/android-chrome-192x192.png"
            alt="InfaQRIS"
            class="w-8 h-8 rounded-lg shrink-0"
          />
          <div class="min-w-0">
            <h1 class="text-base font-bold text-(--text-primary) leading-tight">InfaQRIS</h1>
            <p class="text-xs text-(--text-tertiary) italic">Scan. Give. Berkah.</p>
          </div>
        </div>
        <div class="flex items-center gap-1 shrink-0">
          <!-- Pending sync indicator -->
          <Badge
            v-if="pendingCount > 0 || syncing"
            color="warning"
            :title="syncing ? 'Syncing...' : `${pendingCount} change(s) pending sync`"
          >
            <template #icon>
              <Icon
                :name="syncing ? 'material-symbols:sync' : 'material-symbols:cloud-off'"
                :class="{ 'animate-spin': syncing }"
              />
            </template>
            <span v-if="!syncing && pendingCount > 0">{{ pendingCount }}</span>
          </Badge>
          <!-- Signed in: theme, install, and sign out live inside the avatar popover -->
          <template v-if="user">
            <UserMenuPopover
              :user="user"
              :is-admin="isAdmin"
              :is-dark="isDark"
              :can-install="canInstall"
              @toggle-theme="toggleTheme"
              @install="installPwa"
              @logout="confirmLogoutOpen = true"
            />
          </template>
          <!-- Not signed in: no popover to house them, so keep them in the header -->
          <template v-else>
            <IconButton v-if="canInstall" size="sm" title="Install InfaQRIS" @click="installPwa">
              <Icon name="material-symbols:install-mobile" />
            </IconButton>
            <IconButton
              size="sm"
              :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
              @click="toggleTheme"
            >
              <Icon :name="isDark ? 'material-symbols:light-mode' : 'material-symbols:dark-mode'" />
            </IconButton>
            <IconButton
              size="sm"
              :disabled="!isOnline"
              :title="isOnline ? 'Sign in with Google' : 'Sign in unavailable offline'"
              @click="isOnline && emit('login')"
            >
              <Icon name="material-symbols:login" />
            </IconButton>
          </template>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <Input
          v-model="search"
          type="text"
          placeholder="Search by name or description..."
          class="flex-1"
        >
          <template #icon><Icon name="material-symbols:search" /></template>
        </Input>
        <DropdownMenu align="end">
          <template #trigger>
            <IconButton
              :variant="effectiveSort !== 'default' ? 'secondary' : 'ghost'"
              :title="`Sort: ${sortLabel}`"
            >
              <Icon name="material-symbols:sort" />
            </IconButton>
          </template>
          <template v-for="opt in sortOptions" :key="opt.value">
            <DropdownMenuItem
              v-if="opt.value !== 'distance' || userCenter"
              @select="sortOptionClicked(opt)"
            >
              <template #icon><Icon :name="opt.icon" /></template>
              {{ opt.label }}
              <Icon
                v-if="effectiveSort === opt.value"
                name="material-symbols:check"
                class="ml-auto"
              />
            </DropdownMenuItem>
          </template>
        </DropdownMenu>
      </div>
    </div>

    <div class="flex-1 min-h-0 overflow-y-auto p-3 space-y-2">
      <template v-if="pending">
        <Skeleton v-for="n in 5" :key="n" variant="rect" :height="80" :radius="16" />
      </template>

      <template v-else-if="filtered.length">
        <LocationCard
          v-for="loc in filtered"
          :key="loc.id"
          :location="loc"
          :selected="selectedId === loc.id"
          :user-center="userCenter"
          @click="select(loc)"
        />
      </template>

      <EmptyState v-else title="No locations found" description="Try adjusting your search.">
        <template #icon><Icon name="material-symbols:map" /></template>
      </EmptyState>
    </div>

    <div
      class="px-4 py-2 border-t border-(--border-subtle) text-xs text-(--text-tertiary) flex items-center justify-between gap-2"
    >
      <span>{{ filtered.length }} of {{ locations?.length ?? 0 }} locations</span>
      <div class="flex items-center gap-2 shrink-0">
        <NuxtLink to="/faq" class="hover:text-(--accent) transition-colors">FAQ</NuxtLink>
        <span>·</span>
        <span
          >© {{ year }}
          <a
            href="https://jaluwibowo.id"
            target="_blank"
            rel="noopener noreferrer"
            class="hover:text-(--accent) transition-colors"
            >Jalu Wibowo Aji</a
          ></span
        >
      </div>
    </div>

    <Dialog
      :open="confirmLogoutOpen"
      title="Sign out?"
      description="You'll need to sign in again to add or edit locations."
      size="sm"
      @close="confirmLogoutOpen = false"
    >
      <template #footer>
        <Button variant="ghost" size="sm" @click="confirmLogoutOpen = false">Cancel</Button>
        <Button variant="danger" size="sm" @click="handleLogout">Sign out</Button>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import type { QrisLocation } from '~/types'
import type { SortBy } from '~/composables/useSortPreference'
import { IconButton } from '~/components/ui/icon-button'
import { Badge } from '~/components/ui/badge'
import { Input } from '~/components/ui/input'
import { Banner } from '~/components/ui/banner'
import { Skeleton } from '~/components/ui/skeleton'
import { EmptyState } from '~/components/ui/empty-state'
import { DropdownMenu, DropdownMenuItem } from '~/components/ui/dropdown-menu'
import { Dialog } from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'

const props = defineProps<{ userCenter: { lat: number; lng: number } | null }>()
const selectedId = defineModel<string | null>('selectedId')
const emit = defineEmits<{ login: [] }>()

const { locations, pending } = useLocations()
const { user, isAdmin, logout } = useAuth()
const { isDark, toggle: toggleTheme } = useTheme()
const { canInstall, install: installPwa } = useInstallPwa()
const { isOnline } = useNetworkStatus()
const { pendingCount, syncing } = useSync()
const { sortBy, setSort, init: initSort } = useSortPreference()

const search = ref('')
const year = new Date().getFullYear()

const sortOptions: { value: SortBy; label: string; icon: string }[] = [
  { value: 'default', label: 'Default', icon: 'material-symbols:format-list-numbered' },
  { value: 'alpha', label: 'Alphabetical', icon: 'material-symbols:sort-by-alpha' },
  { value: 'distance', label: 'Nearest first', icon: 'material-symbols:near-me' },
]

function sortOptionClicked(opt: (typeof sortOptions)[number]) {
  setSort(opt.value)
}

// 'distance' needs the user's location — if it's unavailable, fall back to
// 'default' for display/sorting while keeping the saved preference intact so it
// re-activates automatically once geolocation arrives.
const effectiveSort = computed<SortBy>(() =>
  sortBy.value === 'distance' && !props.userCenter ? 'default' : sortBy.value,
)

const sortLabel = computed(
  () => sortOptions.find((o) => o.value === effectiveSort.value)?.label ?? 'Default',
)

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  let list = locations.value ?? []
  if (q) {
    list = list.filter(
      (loc) => loc.name.toLowerCase().includes(q) || loc.description.toLowerCase().includes(q),
    )
  }
  if (effectiveSort.value === 'alpha') {
    list = [...list].sort((a, b) => a.name.localeCompare(b.name))
  } else if (effectiveSort.value === 'distance' && props.userCenter) {
    const { lat, lng } = props.userCenter
    list = [...list].sort(
      (a, b) =>
        haversineKm(lat, lng, a.latitude, a.longitude) -
        haversineKm(lat, lng, b.latitude, b.longitude),
    )
  }
  return list
})

function select(loc: QrisLocation) {
  selectedId.value = loc.id
}

const confirmLogoutOpen = ref(false)

async function handleLogout() {
  confirmLogoutOpen.value = false
  await logout()
}

// Scroll selected card into view when selection changes
watch(selectedId, async (id) => {
  if (!id) return
  await nextTick()
  document.getElementById(`card-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
})

onMounted(() => initSort())
</script>
