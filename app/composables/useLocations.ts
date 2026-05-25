import type { QrisLocation, LocationInput } from '~/types'

export const useLocations = () => {
  const {
    data: locations,
    pending,
    error,
    refresh,
  } = useAsyncData<QrisLocation[]>('locations', () => $fetch('/api/locations'), {
    default: () => [],
  })

  async function addLocation(data: LocationInput) {
    const result = await $fetch<QrisLocation>('/api/locations', {
      method: 'POST',
      body: data,
    })
    await refresh()
    return result
  }

  async function updateLocation(id: string, data: LocationInput) {
    const result = await $fetch<QrisLocation>(`/api/locations/${id}`, {
      method: 'PUT',
      body: data,
    })
    await refresh()
    return result
  }

  async function deleteLocation(id: string) {
    await $fetch(`/api/locations/${id}`, { method: 'DELETE' })
    await refresh()
  }

  return { locations, pending, error, refresh, addLocation, updateLocation, deleteLocation }
}
