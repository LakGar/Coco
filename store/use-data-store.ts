'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Type definitions
export interface TeamMember {
  id: string
  name: string
  email: string
  imageUrl?: string | null
  role: string
  isAdmin: boolean
  accessLevel: string
}

export interface TeamData {
  team: { id: string; name: string; patientId?: string | null }
  members: TeamMember[]
  currentUser: { id: string; isAdmin: boolean; accessLevel: string }
  patient?: TeamMember | null
}

export interface Task {
  id: string
  name: string
  description?: string | null
  patientName?: string | null
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  status: "TODO" | "DONE" | "CANCELLED" | "DUE"
  type?: "MEDICATION" | "APPOINTMENTS" | "SOCIAL" | "HEALTH_PERSONAL" | null
  dueDate?: string | null
  createdAt: string
  updatedAt: string
  createdBy: {
    id: string
    name: string | null
    firstName: string | null
    lastName: string | null
    email: string
    imageUrl: string | null
  }
  assignedTo?: {
    id: string
    name: string | null
    firstName: string | null
    lastName: string | null
    email: string
    imageUrl: string | null
  } | null
}

export interface Routine {
  id: string
  name: string
  description?: string | null
  checklistItems: string[]
  recurrenceDaysOfWeek: number[]
  startDate: string
  endDate?: string | null
  isActive: boolean
  createdAt: string
  instances?: Array<{
    id: string
    entryDate: string
    completedItems?: string[]
    skippedItems?: string[]
    notes?: string | null
    filledOutAt?: string
  }>
  _count?: {
    instances: number
  }
}

export interface Note {
  id: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
  createdBy: {
    id: string
    name: string | null
    firstName: string | null
    lastName: string | null
    email: string
    imageUrl: string | null
  }
  lastEditedBy?: {
    id: string
    name: string | null
    firstName: string | null
    lastName: string | null
    email: string
    imageUrl: string | null
  } | null
  editors: Array<{
    id: string
    user: {
      id: string
      name: string | null
      firstName: string | null
      lastName: string | null
      email: string
      imageUrl: string | null
    }
  }>
  viewers: Array<{
    id: string
    user: {
      id: string
      name: string | null
      firstName: string | null
      lastName: string | null
      email: string
      imageUrl: string | null
    }
  }>
  canEdit: boolean
  canDelete: boolean
  userRole: "creator" | "editor" | "viewer"
}

export interface Mood {
  id: string
  rating: "CALM" | "CONTENT" | "NEUTRAL" | "RELAXED" | "SAD" | "WITHDRAWN" | "TIRED" | "ANXIOUS" | "IRRITABLE" | "RESTLESS" | "CONFUSED"
  notes?: string | null
  observedAt: string
  loggedBy: {
    id: string
    name: string | null
    firstName: string | null
    lastName: string | null
    imageUrl: string | null
  }
}

interface DataStore {
  // Team data (most frequently used)
  teamData: Record<string, TeamData> // keyed by teamId
  teamDataTimestamp: Record<string, number>
  teamDataCacheTTL: number // 5 minutes
  
  // Tasks
  tasks: Record<string, Task[]> // keyed by teamId
  tasksTimestamp: Record<string, number>
  tasksCacheTTL: number // 2 minutes
  
  // Routines
  routines: Record<string, Routine[]> // keyed by teamId
  routinesTimestamp: Record<string, number>
  routinesCacheTTL: number // 2 minutes
  
  // Notes
  notes: Record<string, Note[]> // keyed by teamId
  notesTimestamp: Record<string, number>
  notesCacheTTL: number // 2 minutes
  
  // Moods
  moods: Record<string, Mood[]> // keyed by teamId
  moodsTimestamp: Record<string, number>
  moodsCacheTTL: number // 1 minute
  
  // Loading states
  loading: Record<string, boolean> // keyed by resource type + teamId
  
  // Error states
  errors: Record<string, string | null> // keyed by resource type + teamId
  
  // Actions - Fetch with caching
  fetchTeamData: (teamId: string, force?: boolean) => Promise<TeamData | null>
  fetchTasks: (teamId: string, force?: boolean) => Promise<Task[]>
  fetchRoutines: (teamId: string, force?: boolean) => Promise<Routine[]>
  fetchNotes: (teamId: string, force?: boolean) => Promise<Note[]>
  fetchMoods: (teamId: string, force?: boolean) => Promise<Mood[]>
  
  // Mutations (optimistic updates)
  addTask: (teamId: string, task: Task) => void
  updateTask: (teamId: string, taskId: string, updates: Partial<Task>) => void
  removeTask: (teamId: string, taskId: string) => void
  
  addRoutine: (teamId: string, routine: Routine) => void
  updateRoutine: (teamId: string, routineId: string, updates: Partial<Routine>) => void
  removeRoutine: (teamId: string, routineId: string) => void
  
  addNote: (teamId: string, note: Note) => void
  updateNote: (teamId: string, noteId: string, updates: Partial<Note>) => void
  removeNote: (teamId: string, noteId: string) => void
  
  addMood: (teamId: string, mood: Mood) => void
  
  // Cache invalidation
  invalidateTeamData: (teamId: string) => void
  invalidateTasks: (teamId: string) => void
  invalidateRoutines: (teamId: string) => void
  invalidateNotes: (teamId: string) => void
  invalidateMoods: (teamId: string) => void
  invalidateAll: (teamId: string) => void
  
  // Set loading/error states
  setLoading: (key: string, loading: boolean) => void
  setError: (key: string, error: string | null) => void
}

export const useDataStore = create<DataStore>()(
  persist(
    (set, get) => ({
      // Initial state
      teamData: {},
      teamDataTimestamp: {},
      teamDataCacheTTL: 5 * 60 * 1000, // 5 minutes
      
      tasks: {},
      tasksTimestamp: {},
      tasksCacheTTL: 2 * 60 * 1000, // 2 minutes
      
      routines: {},
      routinesTimestamp: {},
      routinesCacheTTL: 2 * 60 * 1000, // 2 minutes
      
      notes: {},
      notesTimestamp: {},
      notesCacheTTL: 2 * 60 * 1000, // 2 minutes
      
      moods: {},
      moodsTimestamp: {},
      moodsCacheTTL: 1 * 60 * 1000, // 1 minute
      
      loading: {},
      errors: {},
      
      // Fetch with caching
      fetchTeamData: async (teamId, force = false) => {
        const state = get()
        const key = `teamData-${teamId}`
        const cached = state.teamData[teamId]
        const timestamp = state.teamDataTimestamp[teamId] || 0
        const now = Date.now()
        
        // Check if we have valid cached data
        const hasValidCache = cached !== null && cached !== undefined && (now - timestamp) < state.teamDataCacheTTL
        
        if (!force && hasValidCache) {
          // Ensure loading is false when using cache
          if (state.loading[key]) {
            set({ loading: { ...state.loading, [key]: false } })
          }
          return cached
        }
        
        // Set loading state before fetching
        set({ loading: { ...state.loading, [key]: true }, errors: { ...state.errors, [key]: null } })
        
        try {
          // Add timeout to prevent hanging
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout
          
          const response = await fetch(`/api/teams/${teamId}/members`, {
            signal: controller.signal
          })
          
          clearTimeout(timeoutId)
          
          if (!response.ok) throw new Error('Failed to fetch team data')
          const data = await response.json()
          
          set({
            teamData: { ...state.teamData, [teamId]: data },
            teamDataTimestamp: { ...state.teamDataTimestamp, [teamId]: now },
            loading: { ...state.loading, [key]: false },
            errors: { ...state.errors, [key]: null },
          })
          
          return data
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to fetch team data'
          set({
            loading: { ...state.loading, [key]: false },
            errors: { ...state.errors, [key]: errorMessage },
          })
          console.error('Error fetching team data:', error)
          // Return cached data if available, even if stale
          return cached || null
        }
      },
      
      fetchTasks: async (teamId, force = false) => {
        const state = get()
        const key = `tasks-${teamId}`
        const cached = state.tasks[teamId]
        const timestamp = state.tasksTimestamp[teamId] || 0
        const now = Date.now()
        
        // Check if we have valid cached data
        const hasValidCache = cached !== undefined && Array.isArray(cached) && (now - timestamp) < state.tasksCacheTTL
        
        if (!force && hasValidCache) {
          // Ensure loading is false when using cache
          if (state.loading[key]) {
            set({ loading: { ...state.loading, [key]: false } })
          }
          return cached
        }
        
        // Set loading state before fetching
        set({ loading: { ...state.loading, [key]: true }, errors: { ...state.errors, [key]: null } })
        
        try {
          const response = await fetch(`/api/teams/${teamId}/tasks`)
          if (!response.ok) throw new Error('Failed to fetch tasks')
          const data = await response.json()
          const tasks = data.tasks || []
          
          set({
            tasks: { ...state.tasks, [teamId]: tasks },
            tasksTimestamp: { ...state.tasksTimestamp, [teamId]: now },
            loading: { ...state.loading, [key]: false },
            errors: { ...state.errors, [key]: null },
          })
          
          return tasks
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to fetch tasks'
          set({
            loading: { ...state.loading, [key]: false },
            errors: { ...state.errors, [key]: errorMessage },
          })
          console.error('Error fetching tasks:', error)
          return cached || []
        }
      },
      
      fetchRoutines: async (teamId, force = false) => {
        const state = get()
        const key = `routines-${teamId}`
        const cached = state.routines[teamId]
        const timestamp = state.routinesTimestamp[teamId] || 0
        const now = Date.now()
        
        // Check if we have valid cached data
        const hasValidCache = cached !== undefined && Array.isArray(cached) && (now - timestamp) < state.routinesCacheTTL
        
        if (!force && hasValidCache) {
          // Ensure loading is false when using cache
          if (state.loading[key]) {
            set({ loading: { ...state.loading, [key]: false } })
          }
          return cached
        }
        
        // Set loading state before fetching
        set({ loading: { ...state.loading, [key]: true }, errors: { ...state.errors, [key]: null } })
        
        try {
          const response = await fetch(`/api/teams/${teamId}/routines`)
          if (!response.ok) throw new Error('Failed to fetch routines')
          const data = await response.json()
          const routines = (data.routines || []).map((r: any) => ({
            ...r,
            recurrenceDaysOfWeek: Array.isArray(r.recurrenceDaysOfWeek)
              ? r.recurrenceDaysOfWeek
              : (r.recurrenceDaysOfWeek ? [r.recurrenceDaysOfWeek] : []),
          }))
          
          set({
            routines: { ...state.routines, [teamId]: routines },
            routinesTimestamp: { ...state.routinesTimestamp, [teamId]: now },
            loading: { ...state.loading, [key]: false },
            errors: { ...state.errors, [key]: null },
          })
          
          return routines
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to fetch routines'
          set({
            loading: { ...state.loading, [key]: false },
            errors: { ...state.errors, [key]: errorMessage },
          })
          console.error('Error fetching routines:', error)
          return cached || []
        }
      },
      
      fetchNotes: async (teamId, force = false) => {
        const state = get()
        const key = `notes-${teamId}`
        const cached = state.notes[teamId]
        const timestamp = state.notesTimestamp[teamId] || 0
        const now = Date.now()
        
        // Check if we have valid cached data
        const hasValidCache = cached !== undefined && Array.isArray(cached) && (now - timestamp) < state.notesCacheTTL
        
        if (!force && hasValidCache) {
          // Ensure loading is false when using cache
          if (state.loading[key]) {
            set({ loading: { ...state.loading, [key]: false } })
          }
          return cached
        }
        
        // Set loading state before fetching
        set({ loading: { ...state.loading, [key]: true }, errors: { ...state.errors, [key]: null } })
        
        try {
          // Add timeout to prevent hanging
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout
          
          const response = await fetch(`/api/teams/${teamId}/notes`, {
            signal: controller.signal
          })
          
          clearTimeout(timeoutId)
          
          if (!response.ok) throw new Error('Failed to fetch notes')
          const data = await response.json()
          const notes = data.notes || []
          
          set({
            notes: { ...state.notes, [teamId]: notes },
            notesTimestamp: { ...state.notesTimestamp, [teamId]: now },
            loading: { ...state.loading, [key]: false },
            errors: { ...state.errors, [key]: null },
          })
          
          return notes
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to fetch notes'
          set({
            loading: { ...state.loading, [key]: false },
            errors: { ...state.errors, [key]: errorMessage },
          })
          console.error('Error fetching notes:', error)
          // Return cached data if available, even if stale
          return cached || []
        }
      },
      
      fetchMoods: async (teamId, force = false) => {
        const state = get()
        const key = `moods-${teamId}`
        const cached = state.moods[teamId]
        const timestamp = state.moodsTimestamp[teamId] || 0
        const now = Date.now()
        
        // Check if we have valid cached data
        const hasValidCache = cached !== undefined && Array.isArray(cached) && (now - timestamp) < state.moodsCacheTTL
        
        if (!force && hasValidCache) {
          // Ensure loading is false when using cache
          if (state.loading[key]) {
            set({ loading: { ...state.loading, [key]: false } })
          }
          return cached
        }
        
        // Set loading state before fetching
        set({ loading: { ...state.loading, [key]: true }, errors: { ...state.errors, [key]: null } })
        
        try {
          const response = await fetch(`/api/teams/${teamId}/moods`)
          if (!response.ok) throw new Error('Failed to fetch moods')
          const moods = await response.json()
          
          set({
            moods: { ...state.moods, [teamId]: moods },
            moodsTimestamp: { ...state.moodsTimestamp, [teamId]: now },
            loading: { ...state.loading, [key]: false },
            errors: { ...state.errors, [key]: null },
          })
          
          return moods
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to fetch moods'
          set({
            loading: { ...state.loading, [key]: false },
            errors: { ...state.errors, [key]: errorMessage },
          })
          console.error('Error fetching moods:', error)
          return cached || []
        }
      },
      
      // Optimistic updates
      addTask: (teamId, task) => {
        const state = get()
        const currentTasks = state.tasks[teamId] || []
        set({
          tasks: { ...state.tasks, [teamId]: [task, ...currentTasks] },
        })
      },
      
      updateTask: (teamId, taskId, updates) => {
        const state = get()
        const currentTasks = state.tasks[teamId] || []
        set({
          tasks: {
            ...state.tasks,
            [teamId]: currentTasks.map(t => t.id === taskId ? { ...t, ...updates } : t),
          },
        })
      },
      
      removeTask: (teamId, taskId) => {
        const state = get()
        const currentTasks = state.tasks[teamId] || []
        set({
          tasks: {
            ...state.tasks,
            [teamId]: currentTasks.filter(t => t.id !== taskId),
          },
        })
      },
      
      addRoutine: (teamId, routine) => {
        const state = get()
        const currentRoutines = state.routines[teamId] || []
        set({
          routines: { ...state.routines, [teamId]: [routine, ...currentRoutines] },
        })
      },
      
      updateRoutine: (teamId, routineId, updates) => {
        const state = get()
        const currentRoutines = state.routines[teamId] || []
        set({
          routines: {
            ...state.routines,
            [teamId]: currentRoutines.map(r => r.id === routineId ? { ...r, ...updates } : r),
          },
        })
      },
      
      removeRoutine: (teamId, routineId) => {
        const state = get()
        const currentRoutines = state.routines[teamId] || []
        set({
          routines: {
            ...state.routines,
            [teamId]: currentRoutines.filter(r => r.id !== routineId),
          },
        })
      },
      
      addNote: (teamId, note) => {
        const state = get()
        const currentNotes = state.notes[teamId] || []
        set({
          notes: { ...state.notes, [teamId]: [note, ...currentNotes] },
        })
      },
      
      updateNote: (teamId, noteId, updates) => {
        const state = get()
        const currentNotes = state.notes[teamId] || []
        set({
          notes: {
            ...state.notes,
            [teamId]: currentNotes.map(n => n.id === noteId ? { ...n, ...updates } : n),
          },
        })
      },
      
      removeNote: (teamId, noteId) => {
        const state = get()
        const currentNotes = state.notes[teamId] || []
        set({
          notes: {
            ...state.notes,
            [teamId]: currentNotes.filter(n => n.id !== noteId),
          },
        })
      },
      
      addMood: (teamId, mood) => {
        const state = get()
        const currentMoods = state.moods[teamId] || []
        set({
          moods: { ...state.moods, [teamId]: [mood, ...currentMoods] },
        })
      },
      
      // Cache invalidation
      invalidateTeamData: (teamId) => {
        set({
          teamDataTimestamp: { ...get().teamDataTimestamp, [teamId]: 0 },
        })
      },
      
      invalidateTasks: (teamId) => {
        set({
          tasksTimestamp: { ...get().tasksTimestamp, [teamId]: 0 },
        })
      },
      
      invalidateRoutines: (teamId) => {
        set({
          routinesTimestamp: { ...get().routinesTimestamp, [teamId]: 0 },
        })
      },
      
      invalidateNotes: (teamId) => {
        set({
          notesTimestamp: { ...get().notesTimestamp, [teamId]: 0 },
        })
      },
      
      invalidateMoods: (teamId) => {
        set({
          moodsTimestamp: { ...get().moodsTimestamp, [teamId]: 0 },
        })
      },
      
      invalidateAll: (teamId) => {
        const state = get()
        set({
          teamDataTimestamp: { ...state.teamDataTimestamp, [teamId]: 0 },
          tasksTimestamp: { ...state.tasksTimestamp, [teamId]: 0 },
          routinesTimestamp: { ...state.routinesTimestamp, [teamId]: 0 },
          notesTimestamp: { ...state.notesTimestamp, [teamId]: 0 },
          moodsTimestamp: { ...state.moodsTimestamp, [teamId]: 0 },
        })
      },
      
      setLoading: (key, loading) => {
        set({
          loading: { ...get().loading, [key]: loading },
        })
      },
      
      setError: (key, error) => {
        set({
          errors: { ...get().errors, [key]: error },
        })
      },
    }),
    {
      name: 'data-storage',
      partialize: (state) => ({
        // Persist cache timestamps and data (for faster initial load)
        teamData: state.teamData,
        teamDataTimestamp: state.teamDataTimestamp,
        tasks: state.tasks,
        tasksTimestamp: state.tasksTimestamp,
        routines: state.routines,
        routinesTimestamp: state.routinesTimestamp,
        notes: state.notes,
        notesTimestamp: state.notesTimestamp,
        moods: state.moods,
        moodsTimestamp: state.moodsTimestamp,
      }),
      // Reset loading/errors on rehydrate
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Clear all loading states on rehydrate
          state.loading = {}
          state.errors = {}
        }
      },
    }
  )
)

