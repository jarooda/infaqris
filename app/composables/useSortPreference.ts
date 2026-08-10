export type SortBy = 'default' | 'alpha' | 'distance'

const KEY = 'sort_by'
const VALID: SortBy[] = ['default', 'alpha', 'distance']

export const useSortPreference = () => {
  const sortBy = useState<SortBy>(KEY, () => 'default')

  function setSort(s: SortBy) {
    sortBy.value = s
    if (import.meta.client) localStorage.setItem(KEY, s)
  }

  function init() {
    if (import.meta.client) {
      const saved = localStorage.getItem(KEY) as SortBy | null
      if (saved && VALID.includes(saved)) sortBy.value = saved
    }
  }

  /** True once the user has explicitly picked a sort (persisted to localStorage). */
  function hasSaved(): boolean {
    return import.meta.client && VALID.includes(localStorage.getItem(KEY) as SortBy)
  }

  return { sortBy, setSort, init, hasSaved }
}
