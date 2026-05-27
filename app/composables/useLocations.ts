import type { QrisLocation, LocationInput } from '~/types'
import {
  type LocalLocation,
  dbGetAllLocations,
  dbPutLocation,
  dbPutAllLocations,
  dbDeleteLocation,
  dbEnqueueOp,
} from '~/utils/db'

// Module-level shared state — all composable calls share the same refs
const locations = ref<LocalLocation[]>([])
const pending = ref(true)
let _loaded = false

async function loadFromCache() {
  if (!import.meta.client) return
  const cached = await dbGetAllLocations()
  const visible = cached.filter((l) => !l._deleted)
  if (visible.length) {
    locations.value = visible
  }
}

async function fetchFromServer() {
  try {
    const fresh = await $fetch<QrisLocation[]>('/api/locations')
    await dbPutAllLocations(fresh)
    // Merge: keep local pending/deleted entries, replace everything else
    const pendingIds = new Set(
      locations.value.filter((l) => l._pending || l._deleted).map((l) => l.id),
    )
    const merged = [
      ...fresh.filter((l) => !pendingIds.has(l.id)),
      ...locations.value.filter((l) => pendingIds.has(l.id)),
    ]
    locations.value = merged
  } catch {
    // Offline — keep cached data as-is
  }
}

async function initLocations() {
  if (!import.meta.client || _loaded) return
  _loaded = true
  pending.value = true
  await loadFromCache()
  await fetchFromServer()
  pending.value = false
}

export const useLocations = () => {
  if (import.meta.client && !_loaded) {
    initLocations()
  }

  async function addLocation(data: LocationInput): Promise<LocalLocation> {
    const { isOnline } = useNetworkStatus()
    const tempId = 'local_' + crypto.randomUUID()
    const now = new Date().toISOString()

    const optimistic: LocalLocation = {
      id: tempId,
      ...data,
      created_at: now,
      modified_at: '',
      creator: '',
      latest_editor: '',
      status: '1',
      _pending: true,
    }

    // Apply optimistically
    await dbPutLocation(optimistic)
    locations.value = [...locations.value, optimistic]

    const opId = await dbEnqueueOp({
      type: 'create',
      payload: data,
      targetId: tempId,
      tempId,
      createdAt: Date.now(),
    })

    if (isOnline.value) {
      try {
        const result = await $fetch<QrisLocation>('/api/locations', {
          method: 'POST',
          body: data,
        })
        // Replace temp entry with real server entry
        await dbDeleteLocation(tempId)
        await dbPutLocation(result as LocalLocation)
        locations.value = locations.value.map((l) =>
          l.id === tempId ? (result as LocalLocation) : l,
        )
        const { dbDequeueOp } = await import('~/utils/db')
        await dbDequeueOp(opId)
        return result as LocalLocation
      } catch {
        // Will sync later
      }
    }

    return optimistic
  }

  async function updateLocation(id: string, data: LocationInput): Promise<LocalLocation> {
    const { isOnline } = useNetworkStatus()

    // Apply optimistically
    const existing = locations.value.find((l) => l.id === id)
    const optimistic: LocalLocation = {
      ...(existing ?? ({} as LocalLocation)),
      ...data,
      id,
      _pending: true,
    }
    await dbPutLocation(optimistic)
    locations.value = locations.value.map((l) => (l.id === id ? optimistic : l))

    const opId = await dbEnqueueOp({
      type: 'update',
      payload: data,
      targetId: id,
      createdAt: Date.now(),
    })

    if (isOnline.value) {
      try {
        const result = await $fetch<QrisLocation>(`/api/locations/${id}`, {
          method: 'PUT',
          body: data,
        })
        const updated = { ...(result as LocalLocation), _pending: false }
        await dbPutLocation(updated)
        locations.value = locations.value.map((l) => (l.id === id ? updated : l))
        const { dbDequeueOp } = await import('~/utils/db')
        await dbDequeueOp(opId)
        return updated
      } catch {
        // Will sync later
      }
    }

    return optimistic
  }

  async function deleteLocation(id: string): Promise<void> {
    const { isOnline } = useNetworkStatus()

    // Apply optimistically — hide from UI immediately
    const existing = locations.value.find((l) => l.id === id)
    if (existing) {
      await dbPutLocation({ ...existing, _deleted: true })
    }
    locations.value = locations.value.filter((l) => l.id !== id)

    const opId = await dbEnqueueOp({
      type: 'delete',
      targetId: id,
      createdAt: Date.now(),
    })

    if (isOnline.value) {
      try {
        await $fetch(`/api/locations/${id}`, { method: 'DELETE' })
        await dbDeleteLocation(id)
        const { dbDequeueOp } = await import('~/utils/db')
        await dbDequeueOp(opId)
      } catch {
        // Will sync later
      }
    }
  }

  async function refresh() {
    await fetchFromServer()
  }

  return { locations, pending, addLocation, updateLocation, deleteLocation, refresh }
}
