import { renderHook, act } from '@testing-library/react'
import { useTeamStore, Team } from '@/store/use-team-store'

// Mock fetch
global.fetch = jest.fn()

describe('useTeamStore', () => {
  beforeEach(() => {
    // Reset store state
    const { result } = renderHook(() => useTeamStore())
    act(() => {
      result.current.setActiveTeam(null)
      result.current.setTeams([])
    })
    jest.clearAllMocks()
  })

  describe('setActiveTeam', () => {
    test('sets active team', () => {
      const { result } = renderHook(() => useTeamStore())
      const team: Team = {
        id: 'team-1',
        name: 'Test Team',
      }

      act(() => {
        result.current.setActiveTeam(team)
      })

      expect(result.current.activeTeam).toEqual(team)
    })

    test('can set active team to null', () => {
      const { result } = renderHook(() => useTeamStore())
      const team: Team = {
        id: 'team-1',
        name: 'Test Team',
      }

      act(() => {
        result.current.setActiveTeam(team)
        result.current.setActiveTeam(null)
      })

      expect(result.current.activeTeam).toBeNull()
    })
  })

  describe('setTeams', () => {
    test('sets teams array', () => {
      const { result } = renderHook(() => useTeamStore())
      const teams: Team[] = [
        { id: 'team-1', name: 'Team 1' },
        { id: 'team-2', name: 'Team 2' },
      ]

      act(() => {
        result.current.setTeams(teams)
      })

      expect(result.current.teams).toEqual(teams)
    })

    test('automatically sets first team as active when no active team', () => {
      const { result } = renderHook(() => useTeamStore())
      const teams: Team[] = [
        { id: 'team-1', name: 'Team 1' },
        { id: 'team-2', name: 'Team 2' },
      ]

      act(() => {
        result.current.setTeams(teams)
      })

      expect(result.current.activeTeam).toEqual(teams[0])
    })

    test('keeps existing active team if it exists in new teams list', () => {
      const { result } = renderHook(() => useTeamStore())
      const initialTeams: Team[] = [
        { id: 'team-1', name: 'Team 1' },
        { id: 'team-2', name: 'Team 2' },
      ]
      const newTeams: Team[] = [
        { id: 'team-1', name: 'Team 1 Updated' },
        { id: 'team-3', name: 'Team 3' },
      ]

      act(() => {
        result.current.setTeams(initialTeams)
        result.current.setActiveTeam(initialTeams[0])
        result.current.setTeams(newTeams)
      })

      expect(result.current.activeTeam?.id).toBe('team-1')
    })

    test('sets first team as active if current active team not in new list', () => {
      const { result } = renderHook(() => useTeamStore())
      const initialTeams: Team[] = [
        { id: 'team-1', name: 'Team 1' },
        { id: 'team-2', name: 'Team 2' },
      ]
      const newTeams: Team[] = [
        { id: 'team-3', name: 'Team 3' },
        { id: 'team-4', name: 'Team 4' },
      ]

      act(() => {
        result.current.setTeams(initialTeams)
        result.current.setActiveTeam(initialTeams[0])
        result.current.setTeams(newTeams)
      })

      expect(result.current.activeTeam).toEqual(newTeams[0])
    })
  })

  describe('loadTeams', () => {
    test('loads teams from API successfully', async () => {
      const { result } = renderHook(() => useTeamStore())
      const mockTeams: Team[] = [
        { id: 'team-1', name: 'Team 1' },
        { id: 'team-2', name: 'Team 2' },
      ]

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ teams: mockTeams }),
      })

      await act(async () => {
        await result.current.loadTeams()
      })

      expect(result.current.teams).toEqual(mockTeams)
      expect(global.fetch).toHaveBeenCalledWith('/api/teams')
    })

    test('handles API error gracefully', async () => {
      const { result } = renderHook(() => useTeamStore())
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      await act(async () => {
        await result.current.loadTeams()
      })

      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    test('handles non-ok response', async () => {
      const { result } = renderHook(() => useTeamStore())
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      })

      await act(async () => {
        await result.current.loadTeams()
      })

      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })
})
