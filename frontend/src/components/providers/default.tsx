import type { ReactNode } from 'react'
import { SupabaseProvider } from './supabase'
import { QueryClientProvider } from './query-client'

export { useAuth } from './supabase'

export function Provider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider>
      <SupabaseProvider>
        {children}
      </SupabaseProvider>
    </QueryClientProvider>
  )
}
