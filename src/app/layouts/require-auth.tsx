import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/app/providers/auth-provider'
import { Skeleton } from '@/shared/components/ui/skeleton'

export function RequireAuth() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col gap-4 p-6">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  if (!user) {
    return <Navigate replace to="/auth" />
  }

  return <Outlet />
}
