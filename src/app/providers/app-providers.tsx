import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { AuthProvider } from '@/app/providers/auth-provider'
import { ThemeProvider } from '@/app/providers/theme-provider'
import { FyProvider } from '@/app/providers/fy-provider'
import { UndoToastProvider } from '@/shared/components/ui/undo-toast'

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <FyProvider>
            <UndoToastProvider>{children}</UndoToastProvider>
          </FyProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
