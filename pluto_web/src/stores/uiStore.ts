import { create } from 'zustand'

interface UIState {
  // Mobile dock
  dockMenuOpen: boolean
  setDockMenuOpen: (open: boolean) => void
  toggleDockMenu: () => void

  // Profile dropdown
  profileDropdownOpen: boolean
  setProfileDropdownOpen: (open: boolean) => void

  // Auth modal
  authModalOpen: boolean
  authModalMode: 'login' | 'signup'
  authModalSignupType?: 'student' | 'organizer'
  openAuthModal: (mode?: 'login' | 'signup', signupType?: 'student' | 'organizer') => void
  closeAuthModal: () => void

  // Sidebar
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  dockMenuOpen: false,
  setDockMenuOpen: (open) => set({ dockMenuOpen: open }),
  toggleDockMenu: () => set((s) => ({ dockMenuOpen: !s.dockMenuOpen })),

  profileDropdownOpen: false,
  setProfileDropdownOpen: (open) => set({ profileDropdownOpen: open }),

  authModalOpen: false,
  authModalMode: 'login',
  authModalSignupType: undefined,
  openAuthModal: (mode = 'login', signupType = undefined) =>
    set({ authModalOpen: true, authModalMode: mode, authModalSignupType: signupType }),
  closeAuthModal: () => set({ authModalOpen: false, authModalSignupType: undefined }),

  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}))
