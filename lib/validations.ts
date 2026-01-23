import { z } from "zod"
import { log, loggerUtils } from './logger'

// Common validation schemas
export const cuidSchema = z.string().cuid()
export const emailSchema = z.string().email("Invalid email address")
export const nonEmptyStringSchema = z.string().min(1, "Cannot be empty").trim()

// Task validation schemas
export const taskPrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"])
export const taskStatusSchema = z.enum(["TODO", "DONE", "CANCELLED", "DUE"])

export const createTaskSchema = z.object({
  name: z.string().min(1, "Task name is required").max(200, "Task name must be less than 200 characters").trim(),
  description: z.string().max(5000, "Description must be less than 5000 characters").trim().nullable().optional(),
  patientName: z.string().max(200, "Patient name must be less than 200 characters").trim().nullable().optional(),
  assignedToId: cuidSchema.nullable().optional(),
  priority: taskPrioritySchema,
  status: taskStatusSchema,
  dueDate: z.union([z.string().datetime(), z.string().date(), z.null()]).optional().nullable(),
})

export const updateTaskSchema = z.object({
  name: z.string().min(1, "Task name is required").max(200, "Task name must be less than 200 characters").trim().optional(),
  description: z.string().max(5000, "Description must be less than 5000 characters").trim().nullable().optional(),
  patientName: z.string().max(200, "Patient name must be less than 200 characters").trim().nullable().optional(),
  assignedToId: cuidSchema.nullable().optional(),
  priority: taskPrioritySchema.optional(),
  status: taskStatusSchema.optional(),
  dueDate: z.union([z.string().datetime(), z.string().date(), z.null()]).optional().nullable(),
})

// Routine validation schemas
export const recurrenceDaysOfWeekSchema = z.array(z.number().int().min(0).max(6)).min(1, "At least one day must be selected")

export const createRoutineSchema = z.object({
  name: z.string().min(1, "Routine name is required").max(200, "Routine name must be less than 200 characters").trim(),
  description: z.string().max(5000, "Description must be less than 5000 characters").trim().nullable().optional(),
  patientName: z.string().max(200, "Patient name must be less than 200 characters").trim().nullable().optional(),
  checklistItems: z.array(z.string().min(1, "Checklist item cannot be empty").max(500, "Checklist item must be less than 500 characters").trim()).min(1, "At least one checklist item is required"),
  recurrenceDaysOfWeek: recurrenceDaysOfWeekSchema,
  startDate: z.union([z.string().datetime(), z.string().date()]),
  endDate: z.union([z.string().datetime(), z.string().date(), z.null()]).optional().nullable(),
})

export const updateRoutineSchema = z.object({
  name: z.string().min(1, "Routine name is required").max(200, "Routine name must be less than 200 characters").trim().optional(),
  description: z.string().max(5000, "Description must be less than 5000 characters").trim().nullable().optional(),
  patientName: z.string().max(200, "Patient name must be less than 200 characters").trim().nullable().optional(),
  checklistItems: z.array(z.string().min(1, "Checklist item cannot be empty").max(500, "Checklist item must be less than 500 characters").trim()).min(1, "At least one checklist item is required").optional(),
  recurrenceDaysOfWeek: recurrenceDaysOfWeekSchema.optional(),
  startDate: z.union([z.string().datetime(), z.string().date()]).optional(),
  endDate: z.union([z.string().datetime(), z.string().date(), z.null()]).optional().nullable(),
})

// Routine Instance (Journal Entry) validation schemas
// Note: Schema currently uses `answers` (Json), but we validate for both formats
export const createRoutineInstanceSchema = z.object({
  entryDate: z.union([z.string().datetime(), z.string().date()]),
  answers: z
    .object({})
    .catchall(z.unknown())
    .optional(), // Legacy format: accepts any object with any values (will be coerced to boolean in API)
  completedItems: z.array(z.string().trim()).optional(), // New format
  skippedItems: z.array(z.string().trim()).optional(), // New format
  notes: z
    .union([
      z.string().max(5000, "Notes must be less than 5000 characters"),
      z.literal(""),
      z.null(),
    ])
    .optional(),
})

// Log schema creation for debugging
log.debug({
  type: 'schema_creation',
  schemaType: typeof createRoutineInstanceSchema,
  hasParse: typeof createRoutineInstanceSchema?.parse === 'function',
}, 'createRoutineInstanceSchema created')

export const updateRoutineInstanceSchema = z.object({
  answers: z
    .object({})
    .catchall(z.unknown())
    .optional(), // Legacy format: accepts any object with any values (will be coerced to boolean in API)
  completedItems: z.array(z.string().trim()).optional(), // New format
  skippedItems: z.array(z.string().trim()).optional(), // New format
  notes: z
    .union([
      z.string().max(5000, "Notes must be less than 5000 characters"),
      z.literal(""),
      z.null(),
    ])
    .optional(),
})

// Note validation schemas
export const createNoteSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters").trim(),
  content: z.string().min(1, "Content is required").max(50000, "Content must be less than 50000 characters").trim(),
  editorIds: z.array(cuidSchema).optional().default([]),
  viewerIds: z.array(cuidSchema).optional().default([]),
})

export const updateNoteSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters").trim().optional(),
  content: z.string().min(1, "Content is required").max(50000, "Content must be less than 50000 characters").trim().optional(),
})

export const updateNotePermissionsSchema = z.object({
  editorIds: z.array(cuidSchema).optional(),
  viewerIds: z.array(cuidSchema).optional(),
})

// Mood validation schemas
export const moodRatingSchema = z.enum([
  "CALM",
  "CONTENT",
  "NEUTRAL",
  "RELAXED",
  "SAD",
  "WITHDRAWN",
  "TIRED",
  "ANXIOUS",
  "IRRITABLE",
  "RESTLESS",
  "CONFUSED",
])

export const createMoodSchema = z.object({
  rating: moodRatingSchema,
  notes: z.string().max(2000, "Notes must be less than 2000 characters").trim().nullable().optional(),
  observedAt: z.union([z.string().datetime(), z.string().date()]),
})

// Team validation schemas
export const accessLevelSchema = z.enum(["FULL", "READ_ONLY"])
export const teamRoleSchema = z.enum(["CAREGIVER", "FAMILY", "PHYSICIAN", "PATIENT"])

export const updateMemberAccessSchema = z.object({
  accessLevel: accessLevelSchema,
})

// Helper function to validate and parse request body
export async function validateRequest<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ data: T; error: null } | { data: null; error: z.ZodError }> {
  try {
    log.debug({ type: 'validation_start' }, 'Starting request validation')
    
    // Try to get request body
    let body
    try {
      body = await request.json()
      log.debug({ type: 'validation_parse' }, 'Request body parsed successfully')
    } catch (parseError) {
      loggerUtils.logError(parseError, { type: 'validation_parse_error' })
      throw new Error(`Failed to parse request body as JSON: ${parseError instanceof Error ? parseError.message : String(parseError)}`)
    }
    
    log.debug({ type: 'validation_body', bodyKeys: body ? Object.keys(body) : [] }, 'Request body received')
    
    if (!schema) {
      log.error({ type: 'validation_schema_error' }, 'Schema is undefined or null')
      throw new Error('Schema is undefined or null')
    }
    
    if (typeof schema.parse !== 'function') {
      log.error({ type: 'validation_schema_error', schemaKeys: Object.keys(schema || {}) }, 'Schema.parse is not a function')
      throw new Error('Schema.parse is not a function')
    }
    
    const data = schema.parse(body)
    log.debug({ type: 'validation_success' }, 'Validation successful')
    return { data, error: null }
  } catch (error) {
    if (error instanceof z.ZodError) {
      loggerUtils.logValidationError(error, { type: 'validation_zod_error' })
      return { data: null, error }
    }
    
    loggerUtils.logError(error, { type: 'validation_error' })
    throw error
  }
}

// Helper function to format Zod errors for API responses
export function formatZodError(error: unknown): { message: string; issues: Array<{ path: string[]; message: string }> } {
  // Type guard: check if it's a ZodError
  if (error instanceof z.ZodError) {
    // Safety check: ensure error.errors exists and is an array
    if (error.errors && Array.isArray(error.errors)) {
      return {
        message: "Validation failed",
        issues: error.errors.map((err) => ({
          path: err.path,
          message: err.message,
        })),
      }
    }
    // If error.errors doesn't exist but we have error.message, use it
    if (error.message) {
      return {
        message: "Validation failed",
        issues: [{ path: [], message: error.message }],
      }
    }
  }

  // Fallback for non-Zod errors or malformed Zod errors
  // Check if error has a message property (even if not an Error instance)
  let errorMessage = "Unknown validation error"
  
  if (error instanceof Error) {
    errorMessage = error.message
  } else if (error && typeof error === 'object' && 'message' in error) {
    const msg = (error as any).message
    if (typeof msg === 'string') {
      errorMessage = msg
    }
  } else if (typeof error === 'string') {
    errorMessage = error
  }

  return {
    message: "Validation failed",
    issues: [{ path: [], message: errorMessage }],
  }
}

