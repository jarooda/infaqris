export type MapStyle = 'osm' | 'satellite' | 'dark'

export interface TileConfig {
  url: string
  attribution: string
  maxZoom: number
  subdomains?: string
}

export const MAP_TILE_CONFIGS: Record<MapStyle, TileConfig> = {
  osm: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
    subdomains: 'abc',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution:
      'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    maxZoom: 19,
  },
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 19,
    subdomains: 'abcd',
  },
}

export const useMapStyle = () => {
  const style = useState<MapStyle>('map_style', () => 'osm')

  function setStyle(s: MapStyle) {
    style.value = s
    if (import.meta.client) {
      localStorage.setItem('map_style', s)
    }
  }

  function init() {
    if (import.meta.client) {
      const saved = localStorage.getItem('map_style') as MapStyle | null
      if (saved === 'osm' || saved === 'satellite' || saved === 'dark') {
        style.value = saved
      }
    }
  }

  return { style, setStyle, init }
}
