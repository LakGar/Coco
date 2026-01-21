# Routine Journal Proposal

## 🎯 Concept Shift

**From:** Routines → Auto-generate Tasks → Complete Tasks  
**To:** Routines → Daily Journal Checklist → Fill Out at Night/Morning

## 📋 New Model

### Routine = Daily Checklist Template
- A routine is a **template** of items to check off daily
- Examples:
  - "Morning Routine": [Medication, Breakfast, Exercise, Shower]
  - "Evening Routine": [Dinner, Medication, Brush Teeth, Sleep]
  - "Daily Check-in": [Mood, Sleep Quality, Appetite, Energy Level]

### RoutineInstance = Daily Journal Entry
- Each day, user fills out the checklist
- Can add notes/observations
- Timestamped (nightly or morning)

## 🗄️ Simplified Schema

```prisma
model Routine {
  id          String   @id @default(cuid())
  name        String   // e.g., "Morning Routine"
  description String?  // Optional description
  
  teamId      String
  team        CareTeam @relation(fields: [teamId], references: [id])
  
  patientName String?  // Patient name for this routine
  
  createdById String
  createdBy   User     @relation("CreatedRoutines", fields: [createdById], references: [id])
  
  // Checklist items (simple array of strings)
  checklistItems String[] // ["Medication", "Breakfast", "Exercise", "Shower"]
  
  // When to prompt
  promptTime     String?  // "morning" | "evening" | null (both)
  preferredTime  String?  // "08:00" for morning, "20:00" for evening
  
  // Recurrence (simpler - just which days)
  recurrenceDaysOfWeek Int[] // [0,1,2,3,4,5,6] for daily, [1,3,5] for MWF, etc.
  startDate   DateTime
  endDate     DateTime? // null = repeat indefinitely
  
  isActive    Boolean @default(true)
  
  instances   RoutineInstance[]
  
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  
  @@index([teamId])
  @@index([isActive])
}

model RoutineInstance {
  id          String   @id @default(cuid())
  routineId   String
  routine     Routine  @relation(fields: [routineId], references: [id])
  
  // Date this entry is for
  entryDate   DateTime // The day this journal entry is about
  
  // Checklist completion
  completedItems String[] // Which items from the checklist were completed
  skippedItems   String[] // Which items were skipped
  
  // Optional notes/observations
  notes       String?
  
  // When was this filled out
  filledOutAt DateTime @default(now())
  filledOutBy String?  // userId who filled it out
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@unique([routineId, entryDate]) // One entry per routine per day
  @@index([routineId])
  @@index([entryDate])
}
```

## 🎨 User Experience Flow

### 1. Creating a Routine
- Simple form:
  - Name: "Morning Routine"
  - Add checklist items: [Add Item] button
  - When to prompt: Morning / Evening / Both
  - Preferred time: 8:00 AM
  - Which days: Daily / Custom days

### 2. Daily Prompt (Nightly or Morning)

**Option A: Nightly Journal (Reflection)**
- User logs in after 6 PM
- Dashboard shows: "How did today go?"
- Shows all active routines for today
- Large, simple checklist interface
- "Save Journal Entry" button

**Option B: Morning Check-in (Planning)**
- User logs in before 12 PM
- Dashboard shows: "Good morning! Let's check in"
- Shows routines for today
- Can mark what's already done
- "Save" button

**Option C: First Login Prompt**
- When user first logs in each day
- Modal/dialog: "Complete your daily routines"
- Shows pending routines
- Simple checklist interface

### 3. Journal Entry Interface

```
┌─────────────────────────────────────┐
│  Morning Routine - January 20, 2026 │
├─────────────────────────────────────┤
│                                     │
│  ☑ Medication                      │
│  ☑ Breakfast                        │
│  ☐ Exercise                         │
│  ☑ Shower                           │
│                                     │
│  Notes:                             │
│  [Large text area]                  │
│                                     │
│  [Save Entry] [Skip Today]          │
└─────────────────────────────────────┘
```

## 🚀 Implementation Plan

### Phase 1: Schema Update
1. Simplify Routine model (remove task generation fields)
2. Add checklistItems array
3. Update RoutineInstance to be journal-focused
4. Remove task generation logic

### Phase 2: Routine Form
1. Update form to add checklist items
2. Remove task generation options
3. Add prompt time selection
4. Simplify recurrence (just days of week)

### Phase 3: Daily Journal Prompt
1. Create daily journal page/component
2. Check for pending routines on login
3. Show checklist interface
4. Save journal entries

### Phase 4: Dashboard Integration
1. Add "Complete Daily Routines" prompt on dashboard
2. Show pending routines count
3. Link to journal entry page

## 💡 Benefits

1. **Simpler for older users**: Just checkboxes, no task management
2. **More reflective**: Encourages thinking about the day
3. **Less prescriptive**: Tracks what happened, not what needs to happen
4. **Better for dementia care**: Focus on observation, not task completion
5. **Natural journaling**: Feels like a diary, not a to-do list

## 🔄 Migration Path

1. Keep existing routines but mark as "legacy"
2. New routines use journal model
3. Gradually migrate or let users recreate

