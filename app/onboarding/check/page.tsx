'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { Spinner } from '@/components/ui/spinner'

export default function OnboardingCheckPage() {
  const router = useRouter()
  const { isLoaded, user } = useUser()

  useEffect(() => {
    if (!isLoaded) return

    // If user is not authenticated, redirect to sign-in (shouldn't happen due to middleware, but safety check)
    if (!user) {
      router.replace('/sign-in')
      return
    }

    const checkOnboarding = async () => {
      try {
        const response = await fetch('/api/check-onboarding')
        
        if (!response.ok) {
          throw new Error('Failed to check onboarding status')
        }
        
        const data = await response.json()

        if (data.userExists && data.onboardingComplete) {
          // User has completed onboarding, go to dashboard
          router.replace('/dashboard')
        } else if (data.userExists && !data.onboardingComplete) {
          // User exists but hasn't completed onboarding
          router.replace('/onboarding')
        } else if (!data.userExists) {
          // User doesn't exist, sync them first
          const syncResponse = await fetch('/api/sync-user', {
            method: 'POST',
          })
          
          if (syncResponse.ok) {
            // After syncing, check again
            const checkAgain = await fetch('/api/check-onboarding')
            const checkData = await checkAgain.json()
            
            if (checkData.onboardingComplete) {
              router.replace('/dashboard')
            } else {
              router.replace('/onboarding')
            }
          } else {
            // If sync fails, still go to onboarding
            router.replace('/onboarding')
          }
        }
      } catch (error) {
        console.error('Error checking onboarding:', error)
        router.replace('/onboarding')
      }
    }

    checkOnboarding()
  }, [isLoaded, user, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Spinner className="mx-auto mb-4 text-primary" size="md" />
        <p className="text-muted-foreground">Checking your account...</p>
      </div>
    </div>
  )
}

