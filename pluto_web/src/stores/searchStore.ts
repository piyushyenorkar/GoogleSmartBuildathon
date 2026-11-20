import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface SearchState {
  isSearchVisible: boolean
  searchContext: 'explore' | 'community' | 'users' | 'projects' | null
  query: string
  selectedCategory: string | null
  isFreeOnly: boolean
  isPaidOnly: boolean
  isSeatedOnly: boolean
  state: string | null
  city: string | null
  
  recentSearches: any[]
  
  // Actions
  setSearchVisible: (visible: boolean, context?: 'explore' | 'community' | 'users' | 'projects') => void
  setQuery: (query: string) => void
  setCategory: (category: string | null) => void
  toggleFreeOnly: () => void
  togglePaidOnly: () => void
  toggleSeatedOnly: () => void
  setLocation: (state: string | null, city: string | null) => void
  resetFilters: () => void
  addRecentSearch: (event: any) => void
  removeRecentSearch: (eventId: string) => void
}

export const useSearchStore = create<SearchState>()(
  persist(
    (set) => ({
      isSearchVisible: false,
      searchContext: null,
      query: '',
      selectedCategory: null,
      isFreeOnly: false,
      isPaidOnly: false,
      isSeatedOnly: false,
      state: null,
      city: null,
      recentSearches: [],

      setSearchVisible: (visible, context) => set((state) => ({
        isSearchVisible: visible,
        searchContext: context !== undefined ? context : state.searchContext
      })),

      setQuery: (query) => set({ query }),

      setCategory: (category) => set({ selectedCategory: category }),

      toggleFreeOnly: () => set((state) => ({
        isFreeOnly: !state.isFreeOnly,
        isPaidOnly: !state.isFreeOnly ? false : state.isPaidOnly // Mutual exclusion
      })),

      togglePaidOnly: () => set((state) => ({
        isPaidOnly: !state.isPaidOnly,
        isFreeOnly: !state.isPaidOnly ? false : state.isFreeOnly // Mutual exclusion
      })),

      toggleSeatedOnly: () => set((state) => ({ isSeatedOnly: !state.isSeatedOnly })),

      setLocation: (stateFilter, cityFilter) => set({ state: stateFilter, city: cityFilter }),

      resetFilters: () => set({
        query: '',
        selectedCategory: null,
        isFreeOnly: false,
        isPaidOnly: false,
        isSeatedOnly: false,
        state: null,
        city: null
      }),

      addRecentSearch: (event) => set((state) => {
        // Check if it already exists, if so remove it so it can be moved to the top
        const filtered = state.recentSearches.filter(e => e.id !== event.id)
        return { recentSearches: [event, ...filtered].slice(0, 10) } // Keep max 10
      }),

      removeRecentSearch: (eventId) => set((state) => ({
        recentSearches: state.recentSearches.filter(e => e.id !== eventId)
      }))
    }),
    {
      name: 'search-storage',
      storage: createJSONStorage(() => localStorage),
      // Only persist recentSearches
      partialize: (state) => ({ recentSearches: state.recentSearches }),
    }
  )
)
