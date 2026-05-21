import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth } from '@/lib/firebase'
import { Spinner } from '@/components/ui/spinner'

export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      if (user) {
        navigate('/', { replace: true })
      }
    })
    return () => unsub()
  }, [navigate])

  return (
    <div className="flex flex-col items-center justify-center h-svh gap-4">
      <Spinner className="size-8" />
      <p className="text-sm text-muted-foreground">Completing sign in...</p>
    </div>
  )
}
