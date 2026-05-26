import { openDB } from 'idb'
import type { IDBPDatabase } from 'idb'
import type { QrisLocation, LocationInput } from '~/types'

export type LocalLocation = QrisLocation & {
  _pending?: boolean
  _deleted?: boolean
}

export type QueueOpType = 'create' | 'update' | 'delete'

export interface QueueEntry {
  id?: number
  type: QueueOpType
  payload?: LocationInput
  targetId: string
  tempId?: string
  createdAt: number
}

interface InfaqrisDB {
  locations: {
    key: string
    value: LocalLocation
  }
  queue: {
    key: number
    value: QueueEntry
  }
}

let _db: IDBPDatabase<InfaqrisDB> | null = null

async function getDb(): Promise<IDBPDatabase<InfaqrisDB>> {
  if (_db) return _db
  _db = await openDB<InfaqrisDB>('infaqris-db', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('locations')) {
        db.createObjectStore('locations', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('queue')) {
        db.createObjectStore('queue', { keyPath: 'id', autoIncrement: true })
      }
    },
  })
  return _db
}

export async function dbGetAllLocations(): Promise<LocalLocation[]> {
  const db = await getDb()
  return db.getAll('locations')
}

export async function dbPutLocation(loc: LocalLocation): Promise<void> {
  const db = await getDb()
  await db.put('locations', loc)
}

export async function dbPutAllLocations(locs: QrisLocation[]): Promise<void> {
  const db = await getDb()
  const tx = db.transaction('locations', 'readwrite')
  await Promise.all(locs.map((l) => tx.store.put(l as LocalLocation)))
  await tx.done
}

export async function dbDeleteLocation(id: string): Promise<void> {
  const db = await getDb()
  await db.delete('locations', id)
}

export async function dbEnqueueOp(op: Omit<QueueEntry, 'id'>): Promise<number> {
  const db = await getDb()
  return db.add('queue', op as QueueEntry) as Promise<number>
}

export async function dbDequeueOp(id: number): Promise<void> {
  const db = await getDb()
  await db.delete('queue', id)
}

export async function dbGetPendingOps(): Promise<QueueEntry[]> {
  const db = await getDb()
  const all = await db.getAll('queue')
  return all.sort((a, b) => a.createdAt - b.createdAt)
}
