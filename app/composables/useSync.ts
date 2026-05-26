import type { QrisLocation } from '~/types'
import type { LocalLocation } from '~/utils/db'
import { dbGetPendingOps, dbDequeueOp, dbPutLocation, dbDeleteLocation } from '~/utils/db'

const syncing = ref(false)
const pendingCount = ref(0)

async function refreshPendingCount() {
  const ops = await dbGetPendingOps()
  pendingCount.value = ops.length
}

async function syncQueue() {
  if (syncing.value) return
  syncing.value = true

  try {
    const ops = await dbGetPendingOps()
    pendingCount.value = ops.length

    for (const op of ops) {
      try {
        if (op.type === 'create' && op.payload && op.tempId) {
          const result = await $fetch<QrisLocation>('/api/locations', {
            method: 'POST',
            body: op.payload,
          })
          // Replace temp entry with real server entry
          await dbDeleteLocation(op.tempId)
          await dbPutLocation(result as LocalLocation)
          // Patch reactive state
          const { useLocations } = await import('~/composables/useLocations')
          const { locations } = useLocations()
          locations.value = locations.value.map((l) =>
            l.id === op.tempId ? (result as LocalLocation) : l,
          )
          await dbDequeueOp(op.id!)
        } else if (op.type === 'update' && op.payload) {
          if (op.targetId.startsWith('local_')) {
            // The create for this entry hasn't synced yet — skip, will be handled with create
            continue
          }
          const result = await $fetch<QrisLocation>(`/api/locations/${op.targetId}`, {
            method: 'PUT',
            body: op.payload,
          })
          const updated: LocalLocation = { ...(result as LocalLocation), _pending: false }
          await dbPutLocation(updated)
          const { useLocations } = await import('~/composables/useLocations')
          const { locations } = useLocations()
          locations.value = locations.value.map((l) => (l.id === op.targetId ? updated : l))
          await dbDequeueOp(op.id!)
        } else if (op.type === 'delete') {
          if (op.targetId.startsWith('local_')) {
            // Never reached the server — just remove from IDB
            await dbDeleteLocation(op.targetId)
            await dbDequeueOp(op.id!)
            continue
          }
          await $fetch(`/api/locations/${op.targetId}`, { method: 'DELETE' })
          await dbDeleteLocation(op.targetId)
          await dbDequeueOp(op.id!)
        }
      } catch (e: any) {
        const status = e?.response?.status ?? e?.status
        // 4xx errors are permanent failures — dequeue to avoid infinite retry
        if (status && status >= 400 && status < 500) {
          await dbDequeueOp(op.id!)
          const { useToast } = await import('~/composables/useToast')
          const { show } = useToast()
          show(`Sync failed: ${e?.data?.message ?? 'server rejected the request'}`, 'error')
        }
        // 5xx / network errors — keep in queue, stop processing for now
        break
      }
    }
  } finally {
    await refreshPendingCount()
    syncing.value = false
  }
}

export const useSync = () => {
  if (import.meta.client) {
    refreshPendingCount()
  }

  function startSync() {
    if (!import.meta.client) return
    window.addEventListener('online', () => syncQueue())
    // Also sync on startup in case there are leftover ops from a previous session
    if (navigator.onLine) syncQueue()
  }

  return { syncing, pendingCount, syncQueue, startSync }
}
