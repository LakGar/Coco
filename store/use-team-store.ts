'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Team {
  id: string
  name: string
  patientId?: string | null
  patientName?: string | null
  memberCount?: number
}

interface TeamStore {
  activeTeam: Team | null
  teams: Team[]
  setActiveTeam: (team: Team | null) => void
  setTeams: (teams: Team[]) => void
  loadTeams: () => Promise<void>
}

export const useTeamStore = create<TeamStore>()(
  persist(
    (set, get) => ({
      activeTeam: null,
      teams: [],
      
      setActiveTeam: (team) => {
        set({ activeTeam: team })
      },
      
      setTeams: (teams) => {
        set({ teams })
        // If no active team is set, set the first team as active
        if (teams.length > 0 && !get().activeTeam) {
          set({ activeTeam: teams[0] })
        }
        // If active team is not in the new teams list, set first team as active
        else if (teams.length > 0 && get().activeTeam) {
          const activeTeamExists = teams.some(t => t.id === get().activeTeam?.id)
          if (!activeTeamExists) {
            set({ activeTeam: teams[0] })
          }
        }
      },
      
      loadTeams: async () => {
        try {
          const response = await fetch('/api/teams')
          if (!response.ok) {
            throw new Error('Failed to load teams')
          }
          const data = await response.json()
          get().setTeams(data.teams || [])
        } catch (error) {
          console.error('Error loading teams:', error)
        }
      },
    }),
    {
      name: 'team-storage',
      partialize: (state) => ({ activeTeam: state.activeTeam }), // Only persist activeTeam
    }
  )
)

