export function Authenticated({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

export function Unauthenticated({ children }: { children: React.ReactNode }) {
  return null
}

export function AuthLoading({ children }: { children: React.ReactNode }) {
  return null
}
