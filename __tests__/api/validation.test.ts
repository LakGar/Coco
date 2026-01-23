/**
 * Integration tests for API route validation
 * Tests the validation flow used in API routes
 */

import {
  createTaskSchema,
  createRoutineSchema,
  createRoutineInstanceSchema,
  createNoteSchema,
  createMoodSchema,
  validateRequest,
  formatZodError,
} from '@/lib/validations'
import { z } from 'zod'

// Mock Request object
const createMockRequest = (body: any): Request => {
  return {
    json: async () => body,
  } as Request
}

describe('API Route Validation', () => {
  describe('Task Creation Validation', () => {
    test('validates complete task creation request', async () => {
      const request = createMockRequest({
        name: 'Complete Task',
        description: 'Task description',
        priority: 'HIGH',
        status: 'TODO',
        dueDate: '2024-12-31',
      })

      const result = await validateRequest(request, createTaskSchema)

      expect(result.error).toBeNull()
      expect(result.data).toMatchObject({
        name: 'Complete Task',
        priority: 'HIGH',
        status: 'TODO',
      })
    })

    test('validates minimal task creation request', async () => {
      const request = createMockRequest({
        name: 'Minimal Task',
        priority: 'MEDIUM',
        status: 'DONE',
      })

      const result = await validateRequest(request, createTaskSchema)

      expect(result.error).toBeNull()
      expect(result.data).toBeDefined()
    })

    test('rejects task with invalid priority', async () => {
      const request = createMockRequest({
        name: 'Task',
        priority: 'INVALID_PRIORITY',
        status: 'TODO',
      })

      const result = await validateRequest(request, createTaskSchema)

      expect(result.data).toBeNull()
      expect(result.error).toBeInstanceOf(z.ZodError)
    })
  })

  describe('Routine Instance Validation', () => {
    test('validates routine instance with answers', async () => {
      const request = createMockRequest({
        entryDate: '2024-01-15',
        answers: {
          'Had breakfast': true,
          'Exercised': false,
        },
        notes: 'All good',
      })

      const result = await validateRequest(request, createRoutineInstanceSchema)

      expect(result.error).toBeNull()
      expect(result.data).toBeDefined()
      expect(result.data?.entryDate).toBe('2024-01-15')
    })

    test('validates routine instance without answers', async () => {
      const request = createMockRequest({
        entryDate: '2024-01-15',
        notes: 'Test notes',
      })

      const result = await validateRequest(request, createRoutineInstanceSchema)

      expect(result.error).toBeNull()
      expect(result.data).toBeDefined()
    })

    test('validates routine instance with empty notes', async () => {
      const request = createMockRequest({
        entryDate: '2024-01-15',
        answers: { 'Item': true },
        notes: '',
      })

      const result = await validateRequest(request, createRoutineInstanceSchema)

      expect(result.error).toBeNull()
      expect(result.data).toBeDefined()
    })
  })

  describe('Note Creation Validation', () => {
    test('validates note creation request', async () => {
      const request = createMockRequest({
        title: 'Test Note',
        content: 'Note content here',
        editorIds: ['clx1234567890abcdefghij'],
        viewerIds: ['clx0987654321fedcbaijklm'],
      })

      const result = await validateRequest(request, createNoteSchema)

      expect(result.error).toBeNull()
      expect(result.data).toMatchObject({
        title: 'Test Note',
        content: 'Note content here',
      })
    })

    test('rejects note with empty title', async () => {
      const request = createMockRequest({
        title: '',
        content: 'Content',
      })

      const result = await validateRequest(request, createNoteSchema)

      expect(result.data).toBeNull()
      expect(result.error).toBeInstanceOf(z.ZodError)
    })
  })

  describe('Mood Creation Validation', () => {
    test('validates mood creation request', async () => {
      const request = createMockRequest({
        rating: 'CALM',
        notes: 'Feeling relaxed',
        observedAt: '2024-01-15T10:00:00Z',
      })

      const result = await validateRequest(request, createMoodSchema)

      expect(result.error).toBeNull()
      expect(result.data).toMatchObject({
        rating: 'CALM',
      })
    })

    test('rejects mood with invalid rating', async () => {
      const request = createMockRequest({
        rating: 'INVALID_RATING',
        observedAt: '2024-01-15',
      })

      const result = await validateRequest(request, createMoodSchema)

      expect(result.data).toBeNull()
      expect(result.error).toBeInstanceOf(z.ZodError)
    })
  })

  describe('Error Formatting', () => {
    test('formatZodError formats validation errors correctly', () => {
      const schema = z.object({
        name: z.string().min(1, 'Name is required'),
        email: z.string().email('Invalid email'),
      })

      let error: z.ZodError | null = null
      try {
        schema.parse({ name: '', email: 'invalid' })
      } catch (e) {
        error = e as z.ZodError
      }

      expect(error).not.toBeNull()
      if (error) {
        const formatted = formatZodError(error)
        expect(formatted.message).toBe('Validation failed')
        expect(formatted.issues.length).toBeGreaterThan(0)
        expect(formatted.issues[0]).toHaveProperty('path')
        expect(formatted.issues[0]).toHaveProperty('message')
      }
    })
  })
})
