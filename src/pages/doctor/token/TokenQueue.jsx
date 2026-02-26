import { useState, useEffect } from 'react'
import { useAuth } from '../../../hooks/useAuth'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import LogoutButton from '../../../components/LogoutButton'
import {
  Hash,
  Calendar,
  Clock,
  Phone,
  Mail,
  CheckCircle,
  AlertCircle,
  Clock as ClockIcon,
  ArrowLeft,
  Search,
  Play,
  Check
} from 'lucide-react'
import { collection, onSnapshot, query, where, updateDoc, doc, getDoc } from 'firebase/firestore'
import { db } from '../../../firebase/config'
import { getDateString, getDateObject, getDisplayDate, getDisplayTime } from '../../../utils/firestoreUtils'

export default function TokenQueue() {
  const { currentUser } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [filteredAppointments, setFilteredAppointments] = useState([])
  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-CA'))


  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [loading, setLoading] = useState(false)
  const [doctorName, setDoctorName] = useState('')
  const [currentToken, setCurrentToken] = useState(null)
  const [error, setError] = useState('')

  // Fetch doctor's name from staffData collection
  useEffect(() => {
    if (!currentUser) return

    const fetchDoctorName = async () => {
      try {
        const userDocRef = doc(db, 'staffData', currentUser.uid)
        const userDoc = await getDoc(userDocRef)

        if (userDoc.exists()) {
          const userData = userDoc.data()
          const name = userData.fullName || currentUser.displayName || 'Unknown Doctor'
          setDoctorName(name)
        } else {
          setDoctorName(currentUser.displayName || 'Unknown Doctor')
        }
      } catch (error) {
        console.error('Error fetching doctor name:', error)
        setError('Error fetching doctor information')
        setDoctorName(currentUser.displayName || 'Unknown Doctor')
      }
    }

    fetchDoctorName()
  }, [currentUser])

  // Fetch appointments for the selected date and doctor
  useEffect(() => {
    if (!currentUser?.uid || !selectedDate || !doctorName) {
      return
    }

    setLoading(true)
    setError('')

    try {
      const appointmentsRef = collection(db, 'appointments')
      // Fetch all for doctor, filter by date client-side to handle Timestamp vs String mismatch
      const q = query(
        appointmentsRef,
        where('doctorId', '==', currentUser.uid)
      )

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const selectedNorm = (selectedDate || '').split('T')[0]
        const raw = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }))
        const appointmentsData = raw
          .filter(apt => {
            const dateStr = getDateString(apt.date ?? apt.appointmentDate)
            return (dateStr || '').split('T')[0] === selectedNorm
          })
          .map(apt => ({
            ...apt,
            appointmentDateDisplay: getDisplayDate(apt.date ?? apt.appointmentDate) || apt.appointmentDate || '',
            appointmentTimeDisplay: getDisplayTime(apt.appointmentTime ?? apt.time) || apt.appointmentTime || ''
          }))

        // Sort by token number if available, otherwise by creation time
        const sortedAppointments = appointmentsData.sort((a, b) => {
          if (a.tokenNumber != null && b.tokenNumber != null) return a.tokenNumber - b.tokenNumber
          if (a.tokenNumber != null) return -1
          if (b.tokenNumber != null) return 1
          const dateA = getDateObject(a.createdAt) || new Date(0)
          const dateB = getDateObject(b.createdAt) || new Date(0)
          return (dateA?.getTime?.() || 0) - (dateB?.getTime?.() || 0)
        })

        setAppointments(sortedAppointments)
        setFilteredAppointments(sortedAppointments)

        // Set current token (first token_generated or in_progress)
        const current = sortedAppointments.find(apt =>
          apt.status === 'token_generated' || apt.status === 'in_progress'
        )
        setCurrentToken(current)

        setLoading(false)
      }, (error) => {
        console.error('Error fetching appointments:', error)
        setError('Error loading appointments')
        setLoading(false)
        toast.error('Error loading appointments')
      })

      return () => unsubscribe()
    } catch (error) {
      console.error('Error fetching appointments:', error)
      setError('Error loading appointments')
      setLoading(false)
      toast.error('Error loading appointments')
    }
  }, [selectedDate, doctorName, currentUser?.uid])



  // Filter appointments based on search and status
  useEffect(() => {
    let filtered = appointments

    if (searchTerm) {
      const term = (searchTerm || '').toLowerCase().trim()
      filtered = filtered.filter(appointment =>
        (appointment.patientName || '').toLowerCase().includes(term) ||
        (appointment.patientPhone || '').includes(searchTerm) ||
        (appointment.tokenNumber != null && String(appointment.tokenNumber).includes(searchTerm))
      )
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(appointment => appointment.status === filterStatus)
    }

    setFilteredAppointments(filtered)
  }, [appointments, searchTerm, filterStatus])

  // Update appointment status
  const updateAppointmentStatus = async (appointmentId, newStatus) => {
    try {
      const appointmentRef = doc(db, 'appointments', appointmentId)
      await updateDoc(appointmentRef, {
        status: newStatus,
        updatedAt: new Date().toISOString()
      })

      toast.success(`Appointment status updated to ${newStatus}`)
    } catch (error) {
      console.error('Error updating appointment status:', error)
      toast.error('Error updating appointment status')
    }
  }

  // Call next patient
  const callNextPatient = async () => {
    const nextPatient = appointments.find(apt => apt.status === 'token_generated')
    if (nextPatient) {
      await updateAppointmentStatus(nextPatient.id, 'in_progress')
      toast.success(`Calling patient ${nextPatient.patientName} with token ${nextPatient.tokenNumber}`)
    } else {
      toast.info('No more patients waiting')
    }
  }

  // Complete current consultation
  const completeConsultation = async () => {
    if (currentToken && currentToken.status === 'in_progress') {
      await updateAppointmentStatus(currentToken.id, 'completed')
      toast.success(`Consultation completed for ${currentToken.patientName}`)
    }
  }

  // Get status color and icon
  const getStatusInfo = (status) => {
    switch (status) {
      case 'scheduled':
        return { color: 'badge-info', icon: ClockIcon }
      case 'token_generated':
        return { color: 'badge-info', icon: CheckCircle }
      case 'in_progress':
        return { color: 'badge-warning', icon: AlertCircle }
      case 'completed':
        return { color: 'badge-success', icon: CheckCircle }
      case 'cancelled':
        return { color: 'badge-error', icon: AlertCircle }
      default:
        return { color: 'badge-pending', icon: ClockIcon }
    }
  }

  // Get today's date in readable format
  const getTodayDisplay = () => {
    const today = new Date()
    return today.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Get queue statistics
  const getQueueStats = () => {
    const waiting = appointments.filter(apt => apt.status === 'token_generated').length
    const inProgress = appointments.filter(apt => apt.status === 'in_progress').length
    const completed = appointments.filter(apt => apt.status === 'completed').length
    const total = appointments.filter(apt => apt.tokenNumber).length

    return { waiting, inProgress, completed, total }
  }

  const queueStats = getQueueStats()



  return (
    <div className="dashboard-container">
      {/* Premium Navigation */}
      <header className="nav-bar">
        <div className="nav-bar-content">
          <div className="flex items-center gap-4">
            <div className="stat-card-icon stat-card-icon-primary">
              <Hash className="icon-lg" />
            </div>
            <div>
              <h1 className="nav-bar-title">Patient Queue</h1>
              <p className="text-sm text-slate-400">View and manage patient tokens for today</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/doctor"
              className="btn-outline btn-md rounded-lg flex items-center gap-2"
            >
              <ArrowLeft className="icon-sm" />
              <span>Back to Dashboard</span>
            </Link>

            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="page-container">
        {/* Error Display */}
        {error && (
          <div className="card mb-6 border-error-border bg-error-bg">
            <div className="flex items-center gap-3">
              <AlertCircle className="icon-md text-error" />
              <span className="text-error-text font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Current Token Display */}
        {currentToken && (
          <div className="card mb-6 bg-gradient-to-r from-primary-50 to-secondary-50 border-primary-200">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="stat-card-icon stat-card-icon-primary w-20 h-20">
                  <span className="text-4xl font-bold">{currentToken.tokenNumber}</span>
                </div>
                <div>
                  <h2 className="text-heading text-2xl mb-1">Current Patient</h2>
                  <p className="text-body text-lg font-semibold">{currentToken.patientName}</p>
                  <p className="text-muted">
                    {currentToken.patientAge} years, {currentToken.patientGender} • {currentToken.appointmentTime}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {currentToken.status === 'in_progress' && (
                  <button
                    onClick={completeConsultation}
                    className="btn-secondary btn-md rounded-lg flex items-center gap-2"
                  >
                    <Check className="icon-sm" />
                    <span>Complete Consultation</span>
                  </button>
                )}

                <button
                  onClick={callNextPatient}
                  disabled={queueStats.waiting === 0}
                  className="btn-primary btn-md rounded-lg flex items-center gap-2"
                >
                  <Play className="icon-sm" />
                  <span>Call Next Patient</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Queue Statistics */}
        <div className="grid-stats mb-6">
          <div className="stat-card">
            <div className="stat-card-header">
              <div className="stat-card-icon stat-card-icon-primary">
                <Hash className="icon-lg" />
              </div>
            </div>
            <p className="stat-card-title">Total Tokens</p>
            <p className="stat-card-value">{queueStats.total}</p>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <div className="stat-card-icon stat-card-icon-secondary">
                <ClockIcon className="icon-lg" />
              </div>
            </div>
            <p className="stat-card-title">Waiting</p>
            <p className="stat-card-value">{queueStats.waiting}</p>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <div className="stat-card-icon stat-card-icon-amber">
                <AlertCircle className="icon-lg" />
              </div>
            </div>
            <p className="stat-card-title">In Progress</p>
            <p className="stat-card-value">{queueStats.inProgress}</p>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <div className="stat-card-icon stat-card-icon-success">
                <CheckCircle className="icon-lg" />
              </div>
            </div>
            <p className="stat-card-title">Completed</p>
            <p className="stat-card-value">{queueStats.completed}</p>
          </div>
        </div>

        {/* Page Header */}
        <div className="page-header">
          <h1 className="page-title">Today's Queue</h1>
          <p className="page-description">{getTodayDisplay()}</p>
        </div>

        {/* Search and Filters */}
        <div className="card mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by patient name, phone, or token number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input   form-input "
              />
            </div>

            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className=""
            />

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className=" "
            >
              <option value="all">All Status</option>
              <option value="token_generated">Waiting</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>


        {/* Queue Table */}
        <div className="table-container">
          <div className="table-wrapper">
            {loading ? (
              <div className="table-empty">
                <div className="spinner w-12 h-12 mx-auto mb-4"></div>
                <p className="table-empty-text">Loading queue...</p>
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="table-empty">
                <div className="text-muted text-lg mb-2">No patients in queue</div>
                <div className="text-muted text-sm">
                  {searchTerm || filterStatus !== 'all'
                    ? 'Try adjusting your search or filters.'
                    : 'No appointments scheduled for the selected date.'}
                </div>
              </div>
            ) : (
              <table className="table">
                <thead className="table-header">
                  <tr className="table-header-row">
                    <th className="table-header-cell">Token</th>
                    <th className="table-header-cell">Patient</th>
                    <th className="table-header-cell">Contact</th>
                    <th className="table-header-cell">Appointment</th>
                    <th className="table-header-cell">Status</th>
                    <th className="table-header-cell">Actions</th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {filteredAppointments.map((appointment) => {
                    const statusInfo = getStatusInfo(appointment.status)
                    const StatusIcon = statusInfo.icon
                    const isCurrentPatient = currentToken && currentToken.id === appointment.id

                    return (
                      <tr
                        key={appointment.id}
                        className={`table-row ${isCurrentPatient ? 'bg-primary-50 border-l-4 border-l-primary-500' : ''}`}
                      >
                        <td className="table-cell">
                          {appointment.tokenNumber ? (
                            <div className="flex items-center gap-2">
                              <div className={`stat-card-icon stat-card-icon-primary w-12 h-12 ${isCurrentPatient ? 'ring-2 ring-primary-500' : ''}`}>
                                <span className="text-xl font-bold">{appointment.tokenNumber}</span>
                              </div>
                              {isCurrentPatient && (
                                <span className="badge-info">Current</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>

                        <td className="table-cell table-cell-header">
                          <div>
                            <div className="font-semibold">{appointment.patientName}</div>
                            <div className="text-muted text-sm">
                              {appointment.patientAge} years, {appointment.patientGender}
                            </div>
                          </div>
                        </td>

                        <td className="table-cell">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="icon-sm text-muted" />
                              <span>{appointment.patientPhone}</span>
                            </div>
                            {appointment.patientEmail && (
                              <div className="flex items-center gap-2 text-sm">
                                <Mail className="icon-sm text-muted" />
                                <span className="text-muted">{appointment.patientEmail}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="table-cell">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="icon-sm text-muted" />
                              <span>{appointment.appointmentDateDisplay ?? appointment.appointmentDate ?? '—'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="icon-sm text-muted" />
                              <span className="text-muted">{appointment.appointmentTimeDisplay ?? appointment.appointmentTime ?? '—'}</span>
                            </div>
                          </div>
                        </td>

                        <td className="table-cell">
                          <span className={`badge ${statusInfo.color}`}>
                            <StatusIcon className="icon-sm mr-1" />
                            {appointment.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        </td>

                        <td className="table-cell">
                          <div className="flex items-center gap-2">
                            {appointment.status === 'token_generated' && (
                              <button
                                onClick={() => updateAppointmentStatus(appointment.id, 'in_progress')}
                                className="btn-primary rounded-lg btn-sm"
                                title="Start Consultation"
                              >
                                Start
                              </button>
                            )}

                            {appointment.status === 'in_progress' && (
                              <button
                                onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
                                className="btn-secondary rounded-lg btn-sm"
                                title="Complete Consultation"
                              >
                                Complete
                              </button>
                            )}

                            <Link
                              to={`/doctor/prescriptions/create/${appointment.id}`}
                              className="btn-outline-primary rounded-lg btn-sm"
                              title="Create Prescription"
                            >
                              Prescription
                            </Link>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
