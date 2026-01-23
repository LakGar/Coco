import { renderHook, act } from '@testing-library/react'
import { useDataStore, Task, Routine, Note, Mood } from '@/store/use-data-store'

// Mock fetch
global.fetch = jest.fn()

describe('useDataStore', () => {
  const teamId = 'test-team-id'

  beforeEach(() => {
    // Reset store state
    const { result } = renderHook(() => useDataStore())
    act(() => {
      result.current.invalidateAll(teamId)
    })
    jest.clearAllMocks()
  })

  describe('fetchTasks', () => {
    test('fetches and caches tasks', async () => {
      const { result } = renderHook(() => useDataStore())
      const mockTasks: Task[] = [
        {
          id: 'task-1',
          name: 'Test Task',
          priority: 'HIGH',
          status: 'TODO',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: {
            id: 'user-1',
            name: 'Test User',
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            imageUrl: null,
          },
        },
      ]

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ tasks: mockTasks }),
      })

      let tasks: Task[] = []
      await act(async () => {
        tasks = await result.current.fetchTasks(teamId)
      })

      expect(tasks).toEqual(mockTasks)
      expect(result.current.tasks[teamId]).toEqual(mockTasks)
    })

    test('returns cached tasks if within TTL', async () => {
      const { result } = renderHook(() => useDataStore())
      const mockTasks: Task[] = [
        {
          id: 'task-1',
          name: 'Test Task',
          priority: 'HIGH',
          status: 'TODO',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: {
            id: 'user-1',
            name: 'Test User',
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            imageUrl: null,
          },
        },
      ]

      // First fetch
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ tasks: mockTasks }),
      })

      await act(async () => {
        await result.current.fetchTasks(teamId)
      })

      // Second fetch should use cache
      const tasks = await act(async () => {
        return await result.current.fetchTasks(teamId)
      })

      expect(tasks).toEqual(mockTasks)
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    test('forces refresh when force=true', async () => {
      const { result } = renderHook(() => useDataStore())
      const mockTasks: Task[] = [
        {
          id: 'task-1',
          name: 'Test Task',
          priority: 'HIGH',
          status: 'TODO',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: {
            id: 'user-1',
            name: 'Test User',
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            imageUrl: null,
          },
        },
      ]

      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ tasks: mockTasks }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ tasks: mockTasks }),
        })

      await act(async () => {
        await result.current.fetchTasks(teamId)
        await result.current.fetchTasks(teamId, true) // Force refresh
      })

      expect(global.fetch).toHaveBeenCalledTimes(2)
    })
  })

  describe('addTask', () => {
    test('adds task to store', () => {
      const { result } = renderHook(() => useDataStore())
      const newTask: Task = {
        id: 'task-new',
        name: 'New Task',
        priority: 'MEDIUM',
        status: 'TODO',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: {
          id: 'user-1',
          name: 'Test User',
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          imageUrl: null,
        },
      }

      act(() => {
        result.current.addTask(teamId, newTask)
      })

      expect(result.current.tasks[teamId]).toContainEqual(newTask)
      expect(result.current.tasks[teamId][0]).toEqual(newTask) // Should be at the beginning
    })
  })

  describe('updateTask', () => {
    test('updates existing task', () => {
      const { result } = renderHook(() => useDataStore())
      const task: Task = {
        id: 'task-1',
        name: 'Original Task',
        priority: 'LOW',
        status: 'TODO',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: {
          id: 'user-1',
          name: 'Test User',
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          imageUrl: null,
        },
      }

      act(() => {
        result.current.addTask(teamId, task)
        result.current.updateTask(teamId, 'task-1', { name: 'Updated Task', status: 'DONE' })
      })

      const updatedTask = result.current.tasks[teamId].find(t => t.id === 'task-1')
      expect(updatedTask?.name).toBe('Updated Task')
      expect(updatedTask?.status).toBe('DONE')
    })
  })

  describe('removeTask', () => {
    test('removes task from store', () => {
      const { result } = renderHook(() => useDataStore())
      const task: Task = {
        id: 'task-1',
        name: 'Test Task',
        priority: 'HIGH',
        status: 'TODO',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: {
          id: 'user-1',
          name: 'Test User',
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          imageUrl: null,
        },
      }

      act(() => {
        result.current.addTask(teamId, task)
        result.current.removeTask(teamId, 'task-1')
      })

      expect(result.current.tasks[teamId]).not.toContainEqual(task)
    })
  })

  describe('invalidateTasks', () => {
    test('invalidates task cache', async () => {
      const { result } = renderHook(() => useDataStore())
      const mockTasks: Task[] = [
        {
          id: 'task-1',
          name: 'Test Task',
          priority: 'HIGH',
          status: 'TODO',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: {
            id: 'user-1',
            name: 'Test User',
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            imageUrl: null,
          },
        },
      ]

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ tasks: mockTasks }),
      })

      await act(async () => {
        await result.current.fetchTasks(teamId)
        result.current.invalidateTasks(teamId)
        await result.current.fetchTasks(teamId)
      })

      expect(global.fetch).toHaveBeenCalledTimes(2)
    })
  })

  describe('fetchRoutines', () => {
    test('fetches and caches routines', async () => {
      const { result } = renderHook(() => useDataStore())
      const mockRoutines: Routine[] = [
        {
          id: 'routine-1',
          name: 'Test Routine',
          checklistItems: ['Item 1'],
          recurrenceDaysOfWeek: [0, 1],
          startDate: new Date().toISOString(),
          isActive: true,
          createdAt: new Date().toISOString(),
        },
      ]

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ routines: mockRoutines }),
      })

      let routines: Routine[] = []
      await act(async () => {
        routines = await result.current.fetchRoutines(teamId)
      })

      expect(routines).toEqual(mockRoutines)
      expect(result.current.routines[teamId]).toEqual(mockRoutines)
    })
  })

  describe('addRoutine', () => {
    test('adds routine to store', () => {
      const { result } = renderHook(() => useDataStore())
      const newRoutine: Routine = {
        id: 'routine-new',
        name: 'New Routine',
        checklistItems: ['Item 1'],
        recurrenceDaysOfWeek: [0],
        startDate: new Date().toISOString(),
        isActive: true,
        createdAt: new Date().toISOString(),
      }

      act(() => {
        result.current.addRoutine(teamId, newRoutine)
      })

      expect(result.current.routines[teamId]).toContainEqual(newRoutine)
    })
  })

  describe('error handling', () => {
    test('handles fetch errors gracefully', async () => {
      const { result } = renderHook(() => useDataStore())
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      await act(async () => {
        await result.current.fetchTasks(teamId)
      })

      expect(consoleSpy).toHaveBeenCalled()
      expect(result.current.errors[`tasks-${teamId}`]).toBeTruthy()
      consoleSpy.mockRestore()
    })

    test('returns cached data on error if available', async () => {
      const { result } = renderHook(() => useDataStore())
      const mockTasks: Task[] = [
        {
          id: 'task-1',
          name: 'Cached Task',
          priority: 'HIGH',
          status: 'TODO',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: {
            id: 'user-1',
            name: 'Test User',
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            imageUrl: null,
          },
        },
      ]

      // First fetch succeeds
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ tasks: mockTasks }),
      })

      await act(async () => {
        await result.current.fetchTasks(teamId)
      })

      // Second fetch fails
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      const tasks = await act(async () => {
        return await result.current.fetchTasks(teamId)
      })

      expect(tasks).toEqual(mockTasks) // Should return cached data
    })
  })
})
