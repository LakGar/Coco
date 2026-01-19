import { getCurrentUser } from '@/lib/get-user'

export default async function ForumPage() {
  const user = await getCurrentUser()

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-black dark:text-zinc-50 mb-6">
            Forum
          </h1>

          <div className="space-y-4">
            <p className="text-zinc-600 dark:text-zinc-400">
              Welcome to the forum, {user?.firstName || user?.email || 'User'}!
            </p>
            
            <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-6">
              <p className="text-sm text-zinc-500 dark:text-zinc-500">
                This is a protected route. Only authenticated users can access this page.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

