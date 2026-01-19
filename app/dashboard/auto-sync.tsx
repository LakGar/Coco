'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export function AutoSync({ needsSync }: { needsSync: boolean }) {
  const [synced, setSynced] = useState(false)

  useEffect(() => {
    if (needsSync && !synced) {
      // Auto-sync the user
      toast.promise(
        fetch('/api/sync-user', {
          method: 'POST',
        }).then(async (response) => {
          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Failed to sync user')
          }
          return response.json()
        }),
        {
          loading: 'Syncing user to database...',
          success: (data) => {
            setSynced(true)
            // Reload the page after a short delay to show updated data
            setTimeout(() => {
              window.location.reload()
            }, 1000)
            return data.message || 'User has been created successfully'
          },
          error: (error) => {
            return error.message || 'Failed to sync user'
          },
        }
      )
    }
  }, [needsSync, synced])

  return null
}

