'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { isLoaded, user } = useUser()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (!isLoaded || !user) return

    const checkOnboarding = async () => {
      try {
        const response = await fetch('/api/check-onboarding')
        const data = await response.json()

        if (!data.onboardingComplete) {
          router.push('/onboarding')
          return
        }
        setChecking(false)
      } catch (error) {
        console.error('Error checking onboarding:', error)
        router.push('/onboarding')
      }
    }

    checkOnboarding()
  }, [isLoaded, user, router])

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

