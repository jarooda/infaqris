export interface QrisLocation {
  id: string
  name: string
  description: string
  latitude: number
  longitude: number
  qris: string
  created_at: string
  modified_at: string
  creator: string
  latest_editor: string
  status: string
}

export type LocationInput = Pick<
  QrisLocation,
  'name' | 'description' | 'latitude' | 'longitude' | 'qris'
>
