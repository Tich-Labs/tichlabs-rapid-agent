import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'

export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (error) throw error
        
        if (data.session) {
          navigate('/', { replace: true })
        } else {
          navigate('/', { replace: true })
        }
      } catch (error) {
        console.error('Auth callback error:', error)
      }
    }

    handleAuthCallback()
  }, [navigate])

  return (
    <div className="flex flex-col items-center justify-center h-svh gap-4">
      <Spinner className="size-8" />
      <p className="text-sm text-muted-foreground">Completing sign in...</p>
    </div>
  )
}
