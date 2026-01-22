import { z } from "zod"

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
console.log('[validations.ts] createRoutineInstanceSchema created:', {
  schemaType: typeof createRoutineInstanceSchema,
  hasParse: typeof createRoutineInstanceSchema?.parse === 'function',
  schemaDef: (createRoutineInstanceSchema as any)?._def,
})

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
    console.log('[validateRequest] ========== STARTING VALIDATION ==========')
    console.log('[validateRequest] Schema type:', typeof schema)
    console.log('[validateRequest] Schema is undefined:', schema === undefined)
    console.log('[validateRequest] Schema is null:', schema === null)
    console.log('[validateRequest] Schema:', schema)
    console.log('[validateRequest] Schema._def:', (schema as any)?._def)
    console.log('[validateRequest] Schema._def?.typeName:', (schema as any)?._def?.typeName)
    console.log('[validateRequest] Schema._def?.shape:', (schema as any)?._def?.shape)
    console.log('[validateRequest] Schema has parse method:', typeof schema?.parse === 'function')
    console.log('[validateRequest] Schema parse method:', schema?.parse)
    
    // Try to get request body
    let body
    try {
      body = await request.json()
      console.log('[validateRequest] Request body parsed successfully from JSON')
    } catch (parseError) {
      console.error('[validateRequest] ERROR parsing JSON:', parseError)
      console.error('[validateRequest] Parse error type:', typeof parseError)
      console.error('[validateRequest] Parse error message:', parseError instanceof Error ? parseError.message : String(parseError))
      throw new Error(`Failed to parse request body as JSON: ${parseError instanceof Error ? parseError.message : String(parseError)}`)
    }
    
    console.log('[validateRequest] Request body received:', JSON.stringify(body, null, 2))
    console.log('[validateRequest] Body type:', typeof body)
    console.log('[validateRequest] Body is null:', body === null)
    console.log('[validateRequest] Body is undefined:', body === undefined)
    console.log('[validateRequest] Body keys:', body ? Object.keys(body) : 'N/A')
    
    if (!schema) {
      console.error('[validateRequest] ERROR: Schema is undefined or null!')
      throw new Error('Schema is undefined or null')
    }
    
    if (typeof schema.parse !== 'function') {
      console.error('[validateRequest] ERROR: schema.parse is not a function!')
      console.error('[validateRequest] Schema object:', schema)
      console.error('[validateRequest] Schema keys:', Object.keys(schema || {}))
      throw new Error('Schema.parse is not a function')
    }
    
    console.log('[validateRequest] About to call schema.parse with body:', body)
    const data = schema.parse(body)
    console.log('[validateRequest] Validation successful!')
    console.log('[validateRequest] Parsed data:', JSON.stringify(data, null, 2))
    console.log('[validateRequest] ========== VALIDATION SUCCESS ==========')
    return { data, error: null }
  } catch (error) {
    console.error('[validateRequest] ========== VALIDATION ERROR ==========')
    console.error('[validateRequest] Error caught:', error)
    console.error('[validateRequest] Error type:', typeof error)
    console.error('[validateRequest] Error constructor:', error?.constructor?.name)
    console.error('[validateRequest] Error instanceof ZodError:', error instanceof z.ZodError)
    console.error('[validateRequest] Error instanceof Error:', error instanceof Error)
    console.error('[validateRequest] Error message:', error instanceof Error ? error.message : 'No message')
    console.error('[validateRequest] Error stack:', error instanceof Error ? error.stack : 'No stack')
    
    if (error instanceof z.ZodError) {
      console.error('[validateRequest] ZodError details:', {
        issues: error.issues,
        errors: error.errors,
        issuesCount: error.issues?.length,
      })
      console.error('[validateRequest] ZodError issues (formatted):', JSON.stringify(error.issues, null, 2))
      return { data: null, error }
    }
    
    console.error('[validateRequest] Non-ZodError, re-throwing...')
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
  }

  // Fallback for non-Zod errors or malformed Zod errors
  const errorMessage = error instanceof Error 
    ? error.message 
    : typeof error === 'string' 
    ? error 
    : "Unknown validation error"

  return {
    message: "Validation failed",
    issues: [{ path: [], message: errorMessage }],
  }
}

