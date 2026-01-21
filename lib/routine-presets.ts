/**
 * Preset checklist items for routines - simplified like Whoop's daily journal
 * Simple Yes/No questions about daily activities
 */

export interface PresetItem {
  id: string
  label: string
  category: string
}

export const ROUTINE_PRESETS: Record<string, PresetItem[]> = {
  "Daily Activities": [
    { id: "breakfast", label: "Had breakfast", category: "Daily Activities" },
    { id: "snack", label: "Had a snack", category: "Daily Activities" },
    { id: "alcohol", label: "Drank alcohol", category: "Daily Activities" },
    { id: "exercise", label: "Exercised", category: "Daily Activities" },
    { id: "feel-good", label: "Did the patient feel good/positive?", category: "Daily Activities" },
    { id: "walk", label: "Went for a walk", category: "Daily Activities" },
    { id: "social", label: "Socialized with others", category: "Daily Activities" },
    { id: "hobby", label: "Did a hobby or activity", category: "Daily Activities" },
  ],
  
  "Meals & Nutrition": [
    { id: "lunch", label: "Had lunch", category: "Meals & Nutrition" },
    { id: "dinner", label: "Had dinner", category: "Meals & Nutrition" },
    { id: "good-appetite", label: "Had a good appetite", category: "Meals & Nutrition" },
    { id: "water", label: "Drank enough water", category: "Meals & Nutrition" },
  ],
  
  "Medication": [
    { id: "med-morning", label: "Took morning medication", category: "Medication" },
    { id: "med-afternoon", label: "Took afternoon medication", category: "Medication" },
    { id: "med-evening", label: "Took evening medication", category: "Medication" },
    { id: "med-all", label: "Took all medications", category: "Medication" },
  ],
  
  "Mood & Wellbeing": [
    { id: "mood-happy", label: "Felt happy", category: "Mood & Wellbeing" },
    { id: "mood-calm", label: "Felt calm", category: "Mood & Wellbeing" },
    { id: "mood-anxious", label: "Felt anxious", category: "Mood & Wellbeing" },
    { id: "mood-irritable", label: "Felt irritable", category: "Mood & Wellbeing" },
    { id: "mood-energetic", label: "Felt energetic", category: "Mood & Wellbeing" },
  ],
  
  "Sleep": [
    { id: "sleep-well", label: "Slept well last night", category: "Sleep" },
    { id: "sleep-enough", label: "Got enough sleep", category: "Sleep" },
    { id: "sleep-rested", label: "Woke up feeling rested", category: "Sleep" },
    { id: "sleep-nap", label: "Took a nap", category: "Sleep" },
  ],
  
  "Daily Care": [
    { id: "shower", label: "Showered or bathed", category: "Daily Care" },
    { id: "teeth", label: "Brushed teeth", category: "Daily Care" },
    { id: "dressed", label: "Got dressed", category: "Daily Care" },
  ],
}

export const PRESET_CATEGORIES = Object.keys(ROUTINE_PRESETS)

export function getAllPresets(): PresetItem[] {
  return Object.values(ROUTINE_PRESETS).flat()
}

export function getPresetsByCategory(category: string): PresetItem[] {
  return ROUTINE_PRESETS[category] || []
}

