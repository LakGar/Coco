'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Field,
  FieldLabel,
  FieldContent,
  FieldError,
  FieldGroup,
} from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, X, ChevronRight, ChevronLeft, Check, Brain } from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'
import { Spinner } from '@/components/ui/spinner'
import { ROUTINE_PRESETS, type PresetItem } from '@/lib/routine-presets'
import { Checkbox } from '@/components/ui/checkbox'

type UserRole = 'CAREGIVER' | 'FAMILY' | 'PHYSICIAN' | 'PATIENT'
type TeamRole = 'CAREGIVER' | 'FAMILY' | 'PHYSICIAN'
type AccessLevel = 'FULL' | 'READ_ONLY'

interface TeamMember {
  id: string
  email: string
  name?: string // Optional name for the invited member
  role: TeamRole
  accessLevel: AccessLevel
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isExistingTeamMember, setIsExistingTeamMember] = useState(false)
  const [checkingTeamStatus, setCheckingTeamStatus] = useState(true)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    role: '' as UserRole | '',
    city: '',
    state: '',
    patientName: '',
    patientEmail: '',
    teamMembers: [] as TeamMember[],
    journalQuestions: [] as string[], // ADL and other journal questions
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Check if user is already a team member (from invite acceptance)
  useEffect(() => {
    const checkTeamStatus = async () => {
      try {
        const response = await fetch('/api/check-onboarding')
        if (response.ok) {
          const data = await response.json()
          setIsExistingTeamMember(data.isExistingTeamMember || false)
        }
        setCheckingTeamStatus(false)
      } catch (error) {
        console.error('Error checking team status:', error)
        setCheckingTeamStatus(false)
      }
    }
    checkTeamStatus()
  }, [])

  const validateStep = (stepNumber: number): boolean => {
    const newErrors: Record<string, string> = {}

    if (stepNumber === 1) {
      if (!formData.firstName.trim()) newErrors.firstName = 'First name is required'
      if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required'
    }

    if (stepNumber === 2) {
      if (!formData.role) newErrors.role = 'Please select a role'
    }

    if (stepNumber === 3) {
      if (!formData.city.trim()) newErrors.city = 'City is required'
      if (!formData.state.trim()) newErrors.state = 'State is required'
    }

    // Step 4 validation only if user is creating a new team
    if (stepNumber === 4 && !isExistingTeamMember) {
      if (!formData.patientName.trim()) newErrors.patientName = 'Patient name is required'
      if (!formData.patientEmail.trim()) newErrors.patientEmail = 'Patient email is required'
      if (formData.patientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.patientEmail)) {
        newErrors.patientEmail = 'Please enter a valid email'
      }
    }

    // Step 5 validation (journal setup) - optional but recommended
    if (stepNumber === 5) {
      // Journal questions are optional, but we can show a warning if none selected
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    setStep(step - 1)
  }

  const addTeamMember = () => {
    const newMember: TeamMember = {
      id: Date.now().toString(),
      email: '',
      role: 'CAREGIVER',
      accessLevel: 'FULL',
    }
    setFormData({
      ...formData,
      teamMembers: [...formData.teamMembers, newMember],
    })
  }

  const removeTeamMember = (id: string) => {
    setFormData({
      ...formData,
      teamMembers: formData.teamMembers.filter((m) => m.id !== id),
    })
  }

  const updateTeamMember = (id: string, field: keyof TeamMember, value: string) => {
    setFormData({
      ...formData,
      teamMembers: formData.teamMembers.map((m) =>
        m.id === id ? { ...m, [field]: value } : m
      ),
    })
  }

  const handleSubmit = async () => {
    // Validate based on whether user is creating a team or just updating profile
    const stepToValidate = isExistingTeamMember ? 3 : 5
    if (!validateStep(stepToValidate)) return

    toast.promise(
      fetch('/api/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: formData.role,
          city: formData.city,
          state: formData.state,
          // Only include patient info if creating a new team
          patientName: isExistingTeamMember ? undefined : formData.patientName,
          patientEmail: isExistingTeamMember ? undefined : formData.patientEmail,
          teamMembers: isExistingTeamMember ? [] : formData.teamMembers,
          journalQuestions: formData.journalQuestions, // Include journal questions
        }),
      }).then(async (response) => {
        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to complete onboarding')
        }
        return response.json()
      }).then((data) => {
        // Redirect to dashboard on success
        setTimeout(() => {
          router.push('/dashboard')
        }, 1000)
        return data
      }),
      {
        loading: isExistingTeamMember ? 'Updating your profile...' : 'Setting up your care team...',
        success: isExistingTeamMember 
          ? 'Profile updated! Redirecting to dashboard...'
          : 'Onboarding completed! Redirecting to dashboard...',
        error: (error) => error.message || 'Failed to complete onboarding',
      }
    )
  }

  const toggleJournalQuestion = (question: string) => {
    setFormData((prev) => ({
      ...prev,
      journalQuestions: prev.journalQuestions.includes(question)
        ? prev.journalQuestions.filter((q) => q !== question)
        : [...prev.journalQuestions, question],
    }))
  }

  const steps = [
    { number: 1, title: 'Personal Information', description: 'Tell us about yourself' },
    { number: 2, title: 'Your Role', description: 'What role do you play?' },
    { number: 3, title: 'Location', description: 'Where are you located?' },
    ...(isExistingTeamMember ? [] : [
      { number: 4, title: 'Create Team', description: 'Set up your care team' },
      { number: 5, title: 'Daily Journal', description: 'Set up your daily journal questions' },
    ]),
  ]

  const progress = (step / steps.length) * 100

  return (
    <div className="min-h-screen min-w-screen bg-[#f6e9cf]/10 overflow-hidden p-4 relative">
        <div className="fixed -top-8 -left-10 hidden md:block z-0 pointer-events-none">
            <Image src="/onboarding-left.png" alt="Coco" width={300} height={300} />
        </div>
        <div className="fixed -top-8 -left-10 block md:hidden z-0 pointer-events-none">
            <Image src="/onboarding-left.png" alt="Coco" width={200} height={200} />
        </div>
        <div className="fixed -bottom-10 right-0 hidden md:block z-0 pointer-events-none">
            <Image src="/onboarding-right.png" alt="Coco" width={300} height={300} />
        </div>
        <div className="fixed -bottom-10 right-0 block md:hidden z-0 pointer-events-none">
            <Image src="/onboarding-right.png" alt="Coco" width={200} height={200} />
        </div>

      {/* bottom Left Logo */}
      {/* <div className="absolute bottom-6 left-6 hodden md:flex items-center gap-3 z-1">
        <img src="/logo.png" alt="Coco" className="h-10 w-10 object-contain" />
        <div>
          <div className="font-bold text-lg leading-tight">COCO</div>
          <div className="text-xs text-muted-foreground leading-tight">Cognitive Companion</div>
        </div>
      </div> */}

       <div className="max-w-4xl mx-auto px-6 py-12 sm:px-6 lg:px-8 flex flex-col min-h-screen justify-center relative z-10">
        {/* Header */}
        <div className="my-12 text-left md:text-center z-1">
          <h1 className="text-2xl md:text-4xl font-bold tracking-tight mb-1 md:mb-3">
            Welcome! Let's get you set up
          </h1>
          <p className="text-muted-foreground text-sm md:text-lg">
            We'll guide you through setting up your care team
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-12 w-full md:max-w-4xl mx-auto z-1">
          <div className="flex items-center justify-center gap-4 mb-3 w-full">
            {steps.map((s) => (
              <div key={s.number} className="flex items-center  gap-2 w-full">
                {step > s.number ? (
                  <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                ) : step === s.number ? (
                  <div className="w-5 h-5 rounded-full hidden sm:flex bg-primary items-center justify-center shrink-0">
                    <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full hidden sm:block bg-muted shrink-0" />
                )}
                <span
                  className={`text-xs font-medium  hidden sm:block ${
                    step >= s.number ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {s.title}
                </span>
              </div>
            ))}
          </div>
          {/* Progress Bar Fill */}
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="w-full md:max-w-2xl mx-auto z-1">
          {/* Step 1: First and Last Name */}
          {step === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <h2 className="text-2xl font-semibold mb-2">What's your name?</h2>
                <p className="text-muted-foreground">
                  We'll use this to personalize your experience
                </p>
              </div>
              <FieldGroup className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <Field>
                    <FieldLabel>First Name</FieldLabel>
                    <FieldContent>
                      <Input
                        value={formData.firstName}
                        onChange={(e) =>
                          setFormData({ ...formData, firstName: e.target.value })
                        }
                        placeholder="John"
                        aria-invalid={!!errors.firstName}
                        className="h-11"
                      />
                      {errors.firstName && <FieldError>{errors.firstName}</FieldError>}
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel>Last Name</FieldLabel>
                    <FieldContent>
                      <Input
                        value={formData.lastName}
                        onChange={(e) =>
                          setFormData({ ...formData, lastName: e.target.value })
                        }
                        placeholder="Doe"
                        aria-invalid={!!errors.lastName}
                        className="h-11"
                      />
                      {errors.lastName && <FieldError>{errors.lastName}</FieldError>}
                    </FieldContent>
                  </Field>
                </div>
              </FieldGroup>
            </div>
          )}

          {/* Step 2: User Role */}
          {step === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <h2 className="text-2xl font-semibold mb-2">What's your role?</h2>
                <p className="text-muted-foreground">
                  This helps us customize your experience
                </p>
              </div>
              <FieldGroup className="space-y-6">
                <Field>
                  <FieldLabel>Select your role</FieldLabel>
                  <FieldContent>
                    <Select
                      value={formData.role}
                      onValueChange={(value: string) =>
                        setFormData({ ...formData, role: value as UserRole })
                      }
                    >
                      <SelectTrigger aria-invalid={!!errors.role} className="h-11">
                        <SelectValue placeholder="Choose your role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CAREGIVER">Professional</SelectItem>
                        <SelectItem value="FAMILY">Family Member</SelectItem>
                        <SelectItem value="PHYSICIAN">Physician</SelectItem>
                        <SelectItem value="PATIENT" disabled>
                          Patient 
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.role && <FieldError>{errors.role}</FieldError>}
                    {formData.role === 'PATIENT' && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Note: Patient accounts are usually created by team members.
                      </p>
                    )}
                  </FieldContent>
                </Field>
              </FieldGroup>
            </div>
          )}

          {/* Step 3: City and State */}
          {step === 3 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <h2 className="text-2xl font-semibold mb-2">Where are you located?</h2>
                <p className="text-muted-foreground">
                  This helps us connect you with local resources
                </p>
              </div>
              <FieldGroup className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <Field>
                    <FieldLabel>City</FieldLabel>
                    <FieldContent>
                      <Input
                        value={formData.city}
                        onChange={(e) =>
                          setFormData({ ...formData, city: e.target.value })
                        }
                        placeholder="New York"
                        aria-invalid={!!errors.city}
                        className="h-11"
                      />
                      {errors.city && <FieldError>{errors.city}</FieldError>}
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel>State</FieldLabel>
                    <FieldContent>
                      <Input
                        value={formData.state}
                        onChange={(e) =>
                          setFormData({ ...formData, state: e.target.value })
                        }
                        placeholder="NY"
                        aria-invalid={!!errors.state}
                        className="h-11"
                      />
                      {errors.state && <FieldError>{errors.state}</FieldError>}
                    </FieldContent>
                  </Field>
                </div>
              </FieldGroup>
            </div>
          )}

          {/* Step 4: Create Team */}
          {step === 4 && (
            <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <h2 className="text-2xl font-semibold mb-2">Create Your Care Team</h2>
                <p className="text-muted-foreground">
                  Add the patient and invite team members to collaborate
                </p>
              </div>

              {/* Patient Section */}
              <div className="space-y-6 pt-6 border-t">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Patient Information</h3>
                  <p className="text-sm text-muted-foreground">
                    Who is this care team for?
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <Field>
                    <FieldLabel>Patient Name</FieldLabel>
                    <FieldContent>
                      <Input
                        value={formData.patientName}
                        onChange={(e) =>
                          setFormData({ ...formData, patientName: e.target.value })
                        }
                        placeholder="Patient's full name"
                        aria-invalid={!!errors.patientName}
                        className="h-11"
                      />
                      {errors.patientName && <FieldError>{errors.patientName}</FieldError>}
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel>Patient Email</FieldLabel>
                    <FieldContent>
                      <Input
                        type="email"
                        value={formData.patientEmail}
                        onChange={(e) =>
                          setFormData({ ...formData, patientEmail: e.target.value })
                        }
                        placeholder="patient@example.com"
                        aria-invalid={!!errors.patientEmail}
                        className="h-11"
                      />
                      {errors.patientEmail && <FieldError>{errors.patientEmail}</FieldError>}
                    </FieldContent>
                  </Field>
                </div>
                <p className="text-sm text-muted-foreground">
                  An invite will be sent to this email address
                </p>
              </div>

              {/* Team Members Section */}
              <div className="space-y-6 pt-6 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">Team Members</h3>
                    <p className="text-sm text-muted-foreground">
                      Invite caregivers, family members, and physicians
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addTeamMember}
                    className="shrink-0"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Member
                  </Button>
                </div>

                <div className="space-y-4">
                  {formData.teamMembers.map((member, index) => (
                    <div
                      key={member.id}
                      className="p-6 rounded-lg border bg-background/50 backdrop-blur-sm space-y-4 hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-4 ">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary mb-2">
                              {index + 1}
                            </div>
                            <span className="text-sm font-medium text-muted-foreground ">
                              Team Member {index + 1}
                            </span>
                          </div>
                          <Field>
                            <FieldLabel>Name (Optional)</FieldLabel>
                            <FieldContent>
                              <Input
                                value={member.name || ''}
                                onChange={(e) =>
                                  updateTeamMember(member.id, 'name', e.target.value)
                                }
                                placeholder="Team member's name"
                                className="h-11"
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                We'll use this to personalize their invite email
                              </p>
                            </FieldContent>
                          </Field>

                          <Field>
                            <FieldLabel>Email Address</FieldLabel>
                            <FieldContent>
                              <Input
                                type="email"
                                value={member.email}
                                onChange={(e) =>
                                  updateTeamMember(member.id, 'email', e.target.value)
                                }
                                placeholder="member@example.com"
                                className="h-11"
                              />
                            </FieldContent>
                          </Field>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field>
                              <FieldLabel>Role</FieldLabel>
                              <FieldContent>
                                <Select
                                  value={member.role}
                                  onValueChange={(value: string) =>
                                    updateTeamMember(member.id, 'role', value)
                                  }
                                >
                                  <SelectTrigger className="h-11">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="CAREGIVER">Caregiver</SelectItem>
                                    <SelectItem value="FAMILY">Family</SelectItem>
                                    <SelectItem value="PHYSICIAN">Physician</SelectItem>
                                  </SelectContent>
                                </Select>
                              </FieldContent>
                            </Field>

                            <Field>
                              <FieldLabel>Access Level</FieldLabel>
                              <FieldContent>
                                <Select
                                  value={member.accessLevel}
                                  onValueChange={(value: string) =>
                                    updateTeamMember(member.id, 'accessLevel', value)
                                  }
                                >
                                  <SelectTrigger className="h-11">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="FULL">Full Access</SelectItem>
                                    <SelectItem value="READ_ONLY">Read Only</SelectItem>
                                  </SelectContent>
                                </Select>
                              </FieldContent>
                            </Field>
                          </div>
                        </div>
                        <div className="absolute top-3 right-3">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeTeamMember(member.id)}
                          className="ml-4 shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        </div>
                        
                      </div>
                    </div>
                  ))}

                  {formData.teamMembers.length === 0 && (
                    <div className="text-center py-12 border-2 border-dashed rounded-lg px-4">
                      <p className="text-muted-foreground mb-2">
                        No team members added yet
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Click "Add Member" to invite someone to your care team
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Team Name Preview */}
              {formData.patientName && (
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-sm font-medium text-primary mb-1">Team Name</p>
                  <p className="text-lg font-semibold">
                    {formData.patientName}'s Care Team
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 5: Daily Journal Setup */}
          {step === 5 && !isExistingTeamMember && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <h2 className="text-2xl font-semibold mb-2">Set Up Your Daily Journal</h2>
                <p className="text-muted-foreground">
                  Select questions to track daily. You can add more later.
                </p>
              </div>

              <div className="space-y-6">
                {/* Activities of Daily Living Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Activities of Daily Living (ADL)</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Track essential daily activities for care planning
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {ROUTINE_PRESETS["Activities of Daily Living (ADL)"].map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => toggleJournalQuestion(item.label)}
                      >
                        <Checkbox
                          checked={formData.journalQuestions.includes(item.label)}
                          onCheckedChange={() => toggleJournalQuestion(item.label)}
                        />
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1">
                          {item.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Other Categories - Collapsed by default */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-lg font-semibold">Additional Questions (Optional)</h3>
                  {Object.entries(ROUTINE_PRESETS)
                    .filter(([category]) => category !== "Activities of Daily Living (ADL)")
                    .map(([category, items]) => (
                      <div key={category} className="space-y-3">
                        <h4 className="text-sm font-medium text-muted-foreground">{category}</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {items.slice(0, 4).map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                              onClick={() => toggleJournalQuestion(item.label)}
                            >
                              <Checkbox
                                checked={formData.journalQuestions.includes(item.label)}
                                onCheckedChange={() => toggleJournalQuestion(item.label)}
                              />
                              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1">
                                {item.label}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>

                {formData.journalQuestions.length > 0 && (
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <p className="text-sm font-medium text-primary mb-1">
                      {formData.journalQuestions.length} question{formData.journalQuestions.length !== 1 ? 's' : ''} selected
                    </p>
                    <p className="text-xs text-muted-foreground">
                      These will be included in your daily journal routine
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-12 pt-8 border-t">
            <Button
              type="button"
              variant="ghost"
              onClick={handleBack}
              disabled={step === 1}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
            {step < (isExistingTeamMember ? 3 : 5) ? (
              <Button type="button" onClick={handleNext} className="gap-2" size="lg">
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button type="button" onClick={handleSubmit} size="lg" className="gap-2">
                {isExistingTeamMember ? 'Complete Profile' : 'Complete Setup'}
                <Check className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
