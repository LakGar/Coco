'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { SignIn, SignUp } from '@clerk/nextjs'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Card } from '@/components/ui/card'
import { Check, Users, Mail, Calendar } from 'lucide-react'

export default function AcceptInvitePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const inviteCode = searchParams.get('code')
  
  const [inviteData, setInviteData] = useState<{
    teamName: string
    inviterName: string
    role: string
    roleDisplay: string
    email: string
    invitedName: string
    invitedAt: string
    isAdmin: boolean
    accessLevel: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAuth, setShowAuth] = useState(false)
  
  // Check URL for auth mode
  const mode = searchParams.get('mode')
  const authMode = mode === 'sign-in' ? 'sign-in' : 'sign-up'

  useEffect(() => {
    if (!inviteCode) {
      setError('Invalid invite link. No invite code provided.')
      setLoading(false)
      return
    }

    // Fetch invite data from API
    const fetchInviteData = async () => {
      try {
        const response = await fetch(`/api/invites/${inviteCode}`)
        
        if (!response.ok) {
          const errorData = await response.json()
          if (response.status === 404) {
            setError('Invite not found. This link may be invalid.')
          } else if (response.status === 410) {
            setError('This invitation has expired. Please request a new one.')
          } else if (response.status === 409) {
            setError('This invitation has already been accepted.')
          } else {
            setError(errorData.error || 'Failed to load invite details')
          }
          setLoading(false)
          return
        }

        const data = await response.json()
        setInviteData(data)
        setLoading(false)
      } catch (error) {
        console.error('Error fetching invite:', error)
        setError('Failed to load invite details. Please try again.')
        setLoading(false)
      }
    }

    fetchInviteData()
  }, [inviteCode])

  // Check if we should accept the invite after auth
  useEffect(() => {
    const acceptInvite = async () => {
    const acceptParam = searchParams.get('accept')
    if (acceptParam === 'true' && inviteCode) {
        try {
          const response = await fetch('/api/accept-invite', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ inviteCode }),
          })

          if (!response.ok) {
            const error = await response.json()
            setError(error.error || 'Failed to accept invitation')
            return
          }

          const data = await response.json()
          // Redirect to onboarding check (which will redirect to dashboard or onboarding)
          router.push('/onboarding/check')
        } catch (error) {
          console.error('Error accepting invite:', error)
          setError('Failed to accept invitation. Please try again.')
    }
      }
    }

    acceptInvite()
  }, [searchParams, inviteCode, router])

  const handleGetStarted = () => {
    setShowAuth(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen min-w-screen bg-[#f6e9cf]/10 overflow-hidden p-4 relative flex items-center justify-center">
        <div className="fixed -top-8 -left-10 hidden md:block z-0 pointer-events-none">
          <Image src="/onboarding-left.png" alt="Coco" width={300} height={300} />
        </div>
        <div className="fixed -bottom-10 right-0 hidden md:block z-0 pointer-events-none">
          <Image src="/onboarding-right.png" alt="Coco" width={300} height={300} />
        </div>
        <div className="relative z-10 text-center">
          <Spinner className="mx-auto mb-4 text-primary" size="lg" />
          <p className="text-muted-foreground">Loading invite details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen min-w-screen bg-[#f6e9cf]/10 overflow-hidden p-4 relative flex items-center justify-center">
        <div className="fixed -top-8 -left-10 hidden md:block z-0 pointer-events-none">
          <Image src="/onboarding-left.png" alt="Coco" width={300} height={300} />
        </div>
        <div className="fixed -bottom-10 right-0 hidden md:block z-0 pointer-events-none">
          <Image src="/onboarding-right.png" alt="Coco" width={300} height={300} />
        </div>
        <Card className="relative z-10 max-w-md w-full p-8 text-center">
          <div className="mb-4">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <Mail className="h-8 w-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-semibold mb-2">Invalid Invite</h1>
            <p className="text-muted-foreground">{error}</p>
          </div>
          <Button onClick={() => router.push('/')} className="w-full">
            Go to Home
          </Button>
        </Card>
      </div>
    )
  }

  if (showAuth) {
    return (
      <div className="min-h-screen min-w-screen bg-[#f6e9cf]/10 overflow-hidden p-4 relative flex items-center justify-center">
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
        <div className="relative z-10 w-full max-w-md">
          {authMode === 'sign-up' ? (
            <SignUp
              routing="path"
              path="/accept-invite"
              signInUrl={`/accept-invite?code=${inviteCode}&mode=sign-in`}
              fallbackRedirectUrl={`/accept-invite?code=${inviteCode}&accept=true`}
            />
          ) : (
            <SignIn
              routing="path"
              path="/accept-invite"
              signUpUrl={`/accept-invite?code=${inviteCode}&mode=sign-up`}
              fallbackRedirectUrl={`/accept-invite?code=${inviteCode}&accept=true`}
            />
          )}
          <div className="mt-4 text-center">
            <Button
              variant="ghost"
              onClick={() => {
                const newMode = authMode === 'sign-up' ? 'sign-in' : 'sign-up'
                router.push(`/accept-invite?code=${inviteCode}&mode=${newMode}`)
              }}
            >
              {authMode === 'sign-up'
                ? 'Already have an account? Sign in'
                : "Don't have an account? Sign up"}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Use roleDisplay from API (Admin or Team Member)
  const roleDisplay = inviteData?.roleDisplay || 'Team Member'

  return (
    <div className="min-h-screen min-w-screen bg-[#f6e9cf]/10 overflow-hidden p-4 relative flex items-center justify-center">
      {/* Background Images */}
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

      {/* Main Content */}
      <Card className="relative z-10 max-w-lg w-full p-8 md:p-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-semibold mb-2">You're Invited!</h1>
          <p className="text-muted-foreground">
            Join {inviteData?.teamName || 'the care team'}
          </p>
        </div>

        {/* Invite Details */}
        <div className="space-y-4 mb-8">
          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
            <div className="mt-0.5">
              <Check className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Team</p>
              <p className="text-sm text-muted-foreground">
                {inviteData?.teamName || 'Loading...'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
            <div className="mt-0.5">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Invited by</p>
              <p className="text-sm text-muted-foreground">
                {inviteData?.inviterName || 'Loading...'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
            <div className="mt-0.5">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Your Role</p>
              <p className="text-sm text-muted-foreground capitalize">
                {roleDisplay}
              </p>
            </div>
          </div>

          {inviteData?.invitedAt && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
              <div className="mt-0.5">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Invited on</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(inviteData.invitedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="space-y-3">
          <Button
            onClick={handleGetStarted}
            className="w-full"
            size="lg"
          >
            Accept Invitation & Get Started
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            You'll be asked to sign up or sign in to accept this invitation
          </p>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t text-center">
          <p className="text-xs text-muted-foreground">
            This invitation will expire in 7 days
          </p>
        </div>
      </Card>
    </div>
  )
}

