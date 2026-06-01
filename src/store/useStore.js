import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useStore = create(persist(
  (set) => ({
    authToken: null,
    currentSessionId: null,
    currentAgentType: null,
    setAuthToken: (token) => set({ authToken: token }),
    setCurrentSessionId: (id) => set({ currentSessionId: id }),
    setCurrentAgentType: (type) => set({ currentAgentType: type }),
    logout: () => set({ authToken: null, currentSessionId: null, currentAgentType: null }),
  }),
  { name: 'laborai-store' }
))

export default useStore