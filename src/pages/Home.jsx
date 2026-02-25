import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Home() {
  const navigate = useNavigate()
  const appName = import.meta.env.VITE_APP_NAME || 'ClinicFlow Management System'
  const redirectDelay = Number(import.meta.env.VITE_REDIRECT_DELAY_MS || 5000)

  useEffect(() => {
    const id = setTimeout(() => navigate('/login'), redirectDelay)
    return () => clearTimeout(id)
  }, [navigate, redirectDelay])

  useEffect(() => {
    document.title = `${appName} — Welcome`
  }, [appName])

  return (
    <div className="min-h-screen dashboard-container flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-primary rounded-2xl mb-8 shadow-glow-primary animate-pulse">
          <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h1 className="page-title text-5xl mb-4">Welcome to {appName}</h1>
        <p className="page-description text-xl mb-8">
          Getting things ready for you. Redirecting to login shortly…
        </p>
        <div className="flex justify-center">
          <div className="spinner w-12 h-12"></div>
        </div>
        <p className="text-muted mt-6 text-sm">
          You will be redirected in about {redirectDelay / 1000} seconds.
        </p>
      </div>
    </div>
  )
}
