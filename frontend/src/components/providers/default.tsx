import type { ReactNode } from 'react'
import { FirebaseAuthProvider } from './firebase'
import { QueryClientProvider } from './query-client'

export { useAuth, useFirebaseAuth } from './firebase'

export function Provider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider>
      <FirebaseAuthProvider>
        {children}
      </FirebaseAuthProvider>
    </QueryClientProvider>
  )
}
