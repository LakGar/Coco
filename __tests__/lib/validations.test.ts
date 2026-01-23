import {
  createTaskSchema,
  updateTaskSchema,
  createRoutineSchema,
  updateRoutineSchema,
  createRoutineInstanceSchema,
  updateRoutineInstanceSchema,
  createNoteSchema,
  updateNoteSchema,
  createMoodSchema,
  validateRequest,
  formatZodError,
  cuidSchema,
  emailSchema,
} from '@/lib/validations'
import { z } from 'zod'

// Mock Request object
const createMockRequest = (body: any): Request => {
  return {
    json: async () => body,
  } as Request
}

describe('Validation Schemas', () => {
  describe('Common Schemas', () => {
    test('cuidSchema validates valid CUID', () => {
      const validCuid = 'clx1234567890abcdefghij'
      expect(() => cuidSchema.parse(validCuid)).not.toThrow()
    })

    test('cuidSchema rejects invalid CUID', () => {
      const invalidCuid = 'not-a-cuid'
      expect(() => cuidSchema.parse(invalidCuid)).toThrow()
    })

    test('emailSchema validates valid email', () => {
      const validEmail = 'test@example.com'
      expect(() => emailSchema.parse(validEmail)).not.toThrow()
    })

    test('emailSchema rejects invalid email', () => {
      const invalidEmail = 'not-an-email'
      expect(() => emailSchema.parse(invalidEmail)).toThrow()
    })
  })

  describe('Task Validation', () => {
    test('createTaskSchema validates valid task', () => {
      const validTask = {
        name: 'Test Task',
        priority: 'HIGH',
        status: 'TODO',
        dueDate: '2024-01-01',
      }
      expect(() => createTaskSchema.parse(validTask)).not.toThrow()
    })

    test('createTaskSchema rejects empty name', () => {
      const invalidTask = {
        name: '',
        priority: 'HIGH',
        status: 'TODO',
      }
      expect(() => createTaskSchema.parse(invalidTask)).toThrow()
    })

    test('createTaskSchema rejects invalid priority', () => {
      const invalidTask = {
        name: 'Test Task',
        priority: 'INVALID',
        status: 'TODO',
      }
      expect(() => createTaskSchema.parse(invalidTask)).toThrow()
    })

    test('createTaskSchema rejects name longer than 200 characters', () => {
      const invalidTask = {
        name: 'a'.repeat(201),
        priority: 'HIGH',
        status: 'TODO',
      }
      expect(() => createTaskSchema.parse(invalidTask)).toThrow()
    })

    test('updateTaskSchema allows partial updates', () => {
      const partialUpdate = {
        name: 'Updated Task',
      }
      expect(() => updateTaskSchema.parse(partialUpdate)).not.toThrow()
    })

    test('updateTaskSchema allows empty update', () => {
      expect(() => updateTaskSchema.parse({})).not.toThrow()
    })
  })

  describe('Routine Validation', () => {
    test('createRoutineSchema validates valid routine', () => {
      const validRoutine = {
        name: 'Morning Routine',
        checklistItems: ['Item 1', 'Item 2'],
        recurrenceDaysOfWeek: [0, 1, 2],
        startDate: '2024-01-01',
      }
      expect(() => createRoutineSchema.parse(validRoutine)).not.toThrow()
    })

    test('createRoutineSchema rejects empty checklistItems', () => {
      const invalidRoutine = {
        name: 'Morning Routine',
        checklistItems: [],
        recurrenceDaysOfWeek: [0],
        startDate: '2024-01-01',
      }
      expect(() => createRoutineSchema.parse(invalidRoutine)).toThrow()
    })

    test('createRoutineSchema rejects invalid recurrenceDaysOfWeek', () => {
      const invalidRoutine = {
        name: 'Morning Routine',
        checklistItems: ['Item 1'],
        recurrenceDaysOfWeek: [7], // Invalid day
        startDate: '2024-01-01',
      }
      expect(() => createRoutineSchema.parse(invalidRoutine)).toThrow()
    })
  })

  describe('Routine Instance Validation', () => {
    test('createRoutineInstanceSchema validates valid instance with answers', () => {
      const validInstance = {
        entryDate: '2024-01-01',
        answers: {
          'Had breakfast': true,
          'Exercised': false,
        },
        notes: 'Test notes',
      }
      expect(() => createRoutineInstanceSchema.parse(validInstance)).not.toThrow()
    })

    test('createRoutineInstanceSchema validates instance without answers', () => {
      const validInstance = {
        entryDate: '2024-01-01',
        notes: 'Test notes',
      }
      expect(() => createRoutineInstanceSchema.parse(validInstance)).not.toThrow()
    })

    test('createRoutineInstanceSchema validates instance with empty notes', () => {
      const validInstance = {
        entryDate: '2024-01-01',
        answers: { 'Item': true },
        notes: '',
      }
      const result = createRoutineInstanceSchema.parse(validInstance)
      expect(result.notes).toBe('')
    })

    test('createRoutineInstanceSchema validates instance with null notes', () => {
      const validInstance = {
        entryDate: '2024-01-01',
        answers: { 'Item': true },
        notes: null,
      }
      expect(() => createRoutineInstanceSchema.parse(validInstance)).not.toThrow()
    })

    test('createRoutineInstanceSchema rejects missing entryDate', () => {
      const invalidInstance = {
        answers: { 'Item': true },
      }
      expect(() => createRoutineInstanceSchema.parse(invalidInstance)).toThrow()
    })

    test('createRoutineInstanceSchema handles answers with string values (coercion)', () => {
      const instance = {
        entryDate: '2024-01-01',
        answers: {
          'Item 1': 'true', // String instead of boolean
          'Item 2': 'false',
        },
      }
      // Should not throw - will be coerced in API
      expect(() => createRoutineInstanceSchema.parse(instance)).not.toThrow()
    })
  })

  describe('Note Validation', () => {
    test('createNoteSchema validates valid note', () => {
      const validNote = {
        title: 'Test Note',
        content: 'Test content',
      }
      expect(() => createNoteSchema.parse(validNote)).not.toThrow()
    })

    test('createNoteSchema rejects empty title', () => {
      const invalidNote = {
        title: '',
        content: 'Test content',
      }
      expect(() => createNoteSchema.parse(invalidNote)).toThrow()
    })

    test('createNoteSchema rejects empty content', () => {
      const invalidNote = {
        title: 'Test Note',
        content: '',
      }
      expect(() => createNoteSchema.parse(invalidNote)).toThrow()
    })
  })

  describe('Mood Validation', () => {
    test('createMoodSchema validates valid mood', () => {
      const validMood = {
        rating: 'CALM',
        observedAt: '2024-01-01',
      }
      expect(() => createMoodSchema.parse(validMood)).not.toThrow()
    })

    test('createMoodSchema rejects invalid rating', () => {
      const invalidMood = {
        rating: 'INVALID',
        observedAt: '2024-01-01',
      }
      expect(() => createMoodSchema.parse(invalidMood)).toThrow()
    })
  })

  describe('validateRequest', () => {
    test('validates and returns data for valid request', async () => {
      const schema = z.object({ name: z.string() })
      const request = createMockRequest({ name: 'Test' })
      
      const result = await validateRequest(request, schema)
      
      expect(result.error).toBeNull()
      expect(result.data).toEqual({ name: 'Test' })
    })

    test('returns error for invalid request', async () => {
      const schema = z.object({ name: z.string().min(1) })
      const request = createMockRequest({ name: '' })
      
      const result = await validateRequest(request, schema)
      
      expect(result.data).toBeNull()
      expect(result.error).toBeInstanceOf(z.ZodError)
    })

    test('handles JSON parsing errors', async () => {
      const schema = z.object({ name: z.string() })
      const request = {
        json: async () => {
          throw new Error('Invalid JSON')
        },
      } as Request
      
      await expect(validateRequest(request, schema)).rejects.toThrow()
    })
  })

  describe('formatZodError', () => {
    test('formats ZodError correctly', () => {
      const schema = z.object({ name: z.string().min(1) })
      let error: z.ZodError | null = null
      
      try {
        schema.parse({ name: '' })
      } catch (e) {
        error = e as z.ZodError
      }
      
      expect(error).not.toBeNull()
      if (error) {
        const formatted = formatZodError(error)
        expect(formatted.message).toBe('Validation failed')
        expect(formatted.issues).toBeInstanceOf(Array)
        expect(formatted.issues.length).toBeGreaterThan(0)
      }
    })

    test('handles undefined error.errors gracefully', () => {
      const mockError = {
        errors: undefined,
        message: 'Test error',
      } as any
      
      // Should not throw
      const result = formatZodError(mockError)
      expect(result.message).toBe('Validation failed')
      expect(result.issues).toEqual([{ path: [], message: 'Test error' }])
    })

    test('handles null error gracefully', () => {
      const mockError = null as any
      
      // Should not throw
      const result = formatZodError(mockError)
      expect(result.message).toBe('Validation failed')
      expect(result.issues).toEqual([{ path: [], message: 'Unknown validation error' }])
    })
  })
})
