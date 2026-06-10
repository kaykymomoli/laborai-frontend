import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useStore = create(persist(
  (set) => ({
    authToken: null,
    currentSessionId: null,
    currentAgentType: null,
    theme: 'dark',
    setAuthToken: (token) => set({ authToken: token }),
    setCurrentSessionId: (id) => set({ currentSessionId: id }),
    setCurrentAgentType: (type) => set({ currentAgentType: type }),
    toggleTheme: () => set(state => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
    logout: () => set({ authToken: null, currentSessionId: null, currentAgentType: null }),
  }),
  { name: 'laborai-store' }
))

export default useStore
