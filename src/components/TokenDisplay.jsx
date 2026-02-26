import { useState, useEffect } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../firebase/config'
import { Hash, Clock, AlertCircle } from 'lucide-react'
import { getDateString } from '../utils/firestoreUtils'

export default function TokenDisplay() {
  const [currentToken, setCurrentToken] = useState(null)
  const [nextToken, setNextToken] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    if (!selectedDate) return

    setLoading(true)
    const appointmentsRef = collection(db, 'appointments')
    const q = query(
      appointmentsRef,
      where('status', 'in', ['token_generated', 'in_progress'])
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const selectedNorm = (selectedDate || '').split('T')[0]
      const raw = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      const appointmentsData = raw.filter(apt => {
        const aptDateStr = getDateString(apt.date ?? apt.appointmentDate)
        return (aptDateStr || '').split('T')[0] === selectedNorm
      })

      const sortedAppointments = appointmentsData.sort((a, b) => {
        if (a.tokenNumber != null && b.tokenNumber != null) return a.tokenNumber - b.tokenNumber
        if (a.tokenNumber != null) return -1
        if (b.tokenNumber != null) return 1
        return 0
      })

      const current = sortedAppointments.find(apt => apt.status === 'in_progress')
      setCurrentToken(current ?? null)

      const next = sortedAppointments.find(apt => apt.status === 'token_generated')
      setNextToken(next ?? null)

      setLoading(false)
    }, (error) => {
      console.error('Error fetching appointments:', error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [selectedDate])

  if (loading) {
    return (
      <div className="dashboard-container flex items-center justify-center">
        <div className="text-center">
          <div className="spinner w-16 h-16 mx-auto mb-4"></div>
          <p className="text-xl text-muted">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      {/* Premium Header */}
      <header className="nav-bar">
        <div className="nav-bar-content">
          <div className="flex items-center space-x-4">
            <div className="stat-card-icon stat-card-icon-primary">
              <Hash className="icon-lg" />
            </div>
            <div>
              <h1 className="nav-bar-title">Patient Queue</h1>
              <p className="text-sm text-slate-300">
                {new Date(selectedDate).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="page-container">
        {/* Current Token */}
        {currentToken && (
          <div className="card bg-gradient-success bg-opacity-10 border-success-border mb-8">
            <div className="text-center">
              <div className="mb-6">
                <h2 className="section-title text-success mb-4">Currently Serving</h2>
                <div className="inline-flex items-center justify-center w-32 h-32 bg-gradient-success rounded-full mb-6 shadow-glow-success">
                  <span className="text-6xl font-bold text-white">{currentToken.tokenNumber}</span>
                </div>
                <div className="text-center">
                  <h3 className="text-3xl font-bold text-heading mb-2">{currentToken.patientName ?? '—'}</h3>
                  <p className="text-lg text-body mb-2">
                    {currentToken.patientAge ?? '—'} years, {currentToken.patientGender ?? '—'}
                  </p>
                  <p className="text-muted flex items-center justify-center gap-2">
                    <Clock className="icon-sm" />
                    {currentToken.appointmentTime ?? '—'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Next Token */}
        {nextToken && (
          <div className="card bg-primary-50 border-primary-200 mb-8">
            <div className="text-center">
              <div className="mb-6">
                <h2 className="section-title text-primary-700 mb-4">Next Patient</h2>
                <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-primary rounded-full mb-6 shadow-glow-primary">
                  <span className="text-4xl font-bold text-white">{nextToken.tokenNumber}</span>
                </div>
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-heading mb-2">{nextToken.patientName ?? '—'}</h3>
                  <p className="text-lg text-body mb-2">
                    {nextToken.patientAge ?? '—'} years, {nextToken.patientGender ?? '—'}
                  </p>
                  <p className="text-muted flex items-center justify-center gap-2">
                    <Clock className="icon-sm" />
                    {nextToken.appointmentTime ?? '—'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* No Tokens Message */}
        {!currentToken && !nextToken && (
          <div className="card text-center py-16">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-slate-100 rounded-full mb-6">
              <AlertCircle className="icon-xl text-muted" />
            </div>
            <h2 className="section-title mb-4">No Active Tokens</h2>
            <p className="text-muted text-lg">
              No patients are currently waiting or being served.
            </p>
          </div>
        )}

        {/* Instructions */}
        <div className="card bg-slate-50 border-slate-200">
          <h3 className="text-heading text-lg mb-4 text-center">Instructions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-body">
            <div className="flex items-center justify-center gap-2">
              <div className="w-3 h-3 bg-success rounded-full"></div>
              <span>Green: Currently being served</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
              <span>Blue: Next in line</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-3 h-3 bg-slate-400 rounded-full"></div>
              <span>Gray: Waiting for token</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
