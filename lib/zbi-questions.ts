/**
 * Zarit Burden Interview (ZBI) Questions
 * 22-item self-report questionnaire assessing caregiver burden
 * Each question scored 0-4: Never (0), Rarely (1), Sometimes (2), Quite Frequently (3), Nearly Always (4)
 * Total score range: 0-88
 */

export interface ZBIQuestion {
  id: string
  number: number
  text: string
}

export const ZBI_QUESTIONS: ZBIQuestion[] = [
  { id: "q1", number: 1, text: "Do you feel that your relative asks for more help than he/she needs?" },
  { id: "q2", number: 2, text: "Do you feel that because of the time you spend with your relative that you don't have enough time for yourself?" },
  { id: "q3", number: 3, text: "Do you feel stressed between caring for your relative and trying to meet other responsibilities for your family or work?" },
  { id: "q4", number: 4, text: "Do you feel embarrassed over your relative's behavior?" },
  { id: "q5", number: 5, text: "Do you feel angry when you are around your relative?" },
  { id: "q6", number: 6, text: "Do you feel that your relative currently affects your relationships with other family members or friends in a negative way?" },
  { id: "q7", number: 7, text: "Are you afraid of what the future holds for your relative?" },
  { id: "q8", number: 8, text: "Do you feel your relative is dependent on you?" },
  { id: "q9", number: 9, text: "Do you feel strained when you are around your relative?" },
  { id: "q10", number: 10, text: "Do you feel your health has suffered because of your involvement with your relative?" },
  { id: "q11", number: 11, text: "Do you feel that you don't have as much privacy as you would like because of your relative?" },
  { id: "q12", number: 12, text: "Do you feel that your social life has suffered because you are caring for your relative?" },
  { id: "q13", number: 13, text: "Do you feel uncomfortable about having friends over because of your relative?" },
  { id: "q14", number: 14, text: "Do you feel that your relative seems to expect you to take care of him/her as if you were the only one he/she could depend on?" },
  { id: "q15", number: 15, text: "Do you feel that you don't have enough money to care for your relative in addition to the rest of your expenses?" },
  { id: "q16", number: 16, text: "Do you feel that you will be unable to take care of your relative much longer?" },
  { id: "q17", number: 17, text: "Do you feel you have lost control of your life since your relative's illness?" },
  { id: "q18", number: 18, text: "Do you wish you could leave the care of your relative to someone else?" },
  { id: "q19", number: 19, text: "Do you feel uncertain about what to do about your relative?" },
  { id: "q20", number: 20, text: "Do you feel you should be doing more for your relative?" },
  { id: "q21", number: 21, text: "Do you feel you could do a better job in caring for your relative?" },
  { id: "q22", number: 22, text: "Overall, how burdened do you feel in caring for your relative?" },
]

export const ZBI_SCORE_OPTIONS = [
  { value: 0, label: "Never" },
  { value: 1, label: "Rarely" },
  { value: 2, label: "Sometimes" },
  { value: 3, label: "Quite Frequently" },
  { value: 4, label: "Nearly Always" },
]

export function calculateBurdenLevel(totalScore: number): "LOW" | "MILD_MODERATE" | "MODERATE_SEVERE" | "SEVERE" {
  if (totalScore <= 20) return "LOW"
  if (totalScore <= 40) return "MILD_MODERATE"
  if (totalScore <= 60) return "MODERATE_SEVERE"
  return "SEVERE"
}

export function getBurdenLevelLabel(level: string): string {
  switch (level) {
    case "LOW":
      return "Little or no burden"
    case "MILD_MODERATE":
      return "Mild to moderate burden"
    case "MODERATE_SEVERE":
      return "Moderate to severe burden"
    case "SEVERE":
      return "Severe burden"
    default:
      return "Unknown"
  }
}

export function getBurdenLevelColor(level: string): string {
  switch (level) {
    case "LOW":
      return "text-green-600"
    case "MILD_MODERATE":
      return "text-yellow-600"
    case "MODERATE_SEVERE":
      return "text-orange-600"
    case "SEVERE":
      return "text-red-600"
    default:
      return "text-gray-600"
  }
}
