import { useState, useEffect } from 'react'
import { useAuth } from '../../../hooks/useAuth'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import LogoutButton from '../../../components/LogoutButton'
import {
  User,
  Calendar,
  Clock,
  Phone,
  Mail,
  Check,
  X,
  AlertTriangle,
  Search,
  CalendarDays,
  CalendarRange,
  CalendarCheck,
  ArrowLeft
} from 'lucide-react'
import { collection, onSnapshot, query, orderBy, updateDoc, doc, getDoc, where } from 'firebase/firestore'
import { db } from '../../../firebase/config'

export default function DoctorAppointments() {
  const { currentUser } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [filteredAppointments, setFilteredAppointments] = useState([])
  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-CA'))
  const [viewMode, setViewMode] = useState('today')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [showPatientDetails, setShowPatientDetails] = useState(false)
  const [doctorName, setDoctorName] = useState('')

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
        setDoctorName(currentUser.displayName || 'Unknown Doctor')
      }
    }

    fetchDoctorName()
  }, [currentUser])

  useEffect(() => {
    if (!currentUser) return

    toast.success('Loading your appointments...')

    const appointmentsRef = collection(db, 'appointments')
    // Query by doctorId (UID) - robust and secure
    // Note: client-side sorting is used to avoid needing a composite index for where+orderBy
    const q = query(
      appointmentsRef,
      where('doctorId', '==', currentUser.uid)
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const doctorAppointments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      // Sort client-side by createdAt descending
      doctorAppointments.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt.toDate ? a.createdAt.toDate() : a.createdAt) : new Date(0)
        const dateB = b.createdAt ? new Date(b.createdAt.toDate ? b.createdAt.toDate() : b.createdAt) : new Date(0)
        return dateB - dateA
      })

      setAppointments(doctorAppointments)

      if (doctorAppointments.length > 0) {
        toast.success(`Loaded ${doctorAppointments.length} appointments`)
      } else {
        toast.success('No appointments found for you')
      }
    }, (error) => {
      console.error('Error fetching appointments:', error)
      toast.error('Error loading appointments')
    })

    return () => unsubscribe()
  }, [currentUser])

  useEffect(() => {
    let filtered = appointments

    const getDateStr = (apt) => {
      if (apt.date && typeof apt.date.toDate === 'function') {
        return apt.date.toDate().toISOString().split('T')[0]
      }
      if (apt.date && typeof apt.date === 'string') {
        return apt.date.split('T')[0]
      }
      if (apt.appointmentDate) return apt.appointmentDate
      return ''
    }

    const getDateObj = (apt) => {
      if (apt.date && typeof apt.date.toDate === 'function') {
        return apt.date.toDate()
      }
      if (apt.date) return new Date(apt.date)
      if (apt.appointmentDate) return new Date(apt.appointmentDate)
      return new Date(0)
    }

    if (viewMode === 'today') {
      filtered = filtered.filter(apt => getDateStr(apt) === selectedDate)
    } else if (viewMode === 'week') {
      const startOfWeek = new Date(selectedDate)
      const endOfWeek = new Date(selectedDate)
      endOfWeek.setDate(endOfWeek.getDate() + 7)
      filtered = filtered.filter(apt => {
        const aptDate = getDateObj(apt)
        return aptDate >= startOfWeek && aptDate < endOfWeek
      })
    } else if (viewMode === 'month') {
      const startOfMonth = new Date(selectedDate)
      const endOfMonth = new Date(selectedDate)
      endOfMonth.setMonth(endOfMonth.getMonth() + 1)
      filtered = filtered.filter(apt => {
        const aptDate = getDateObj(apt)
        return aptDate >= startOfMonth && aptDate < endOfMonth
      })
    }

    if (searchTerm) {
      filtered = filtered.filter(apt =>
        apt.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.appointmentType?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredAppointments(filtered)
  }, [appointments, selectedDate, viewMode, searchTerm])

  const handleViewPatientDetails = (appointment) => {
    setSelectedAppointment(appointment)
    setShowPatientDetails(true)
    toast.success('Patient details opened!')
  }

  const handleCompleteAppointment = async (appointmentId) => {
    try {
      const appointmentRef = doc(db, 'appointments', appointmentId)
      await updateDoc(appointmentRef, {
        status: 'completed',
        updatedAt: new Date().toISOString()
      })
      toast.success('Appointment marked as completed!')
    } catch (error) {
      console.error('Error completing appointment:', error)
      toast.error(`Error completing appointment: ${error.message}`)
    }
  }

  const handleCancelAppointment = async (appointmentId) => {
    try {
      const appointmentRef = doc(db, 'appointments', appointmentId)
      await updateDoc(appointmentRef, {
        status: 'cancelled',
        updatedAt: new Date().toISOString()
      })
      toast.success('Appointment cancelled successfully!')
    } catch (error) {
      console.error('Error cancelling appointment:', error)
      toast.error(`Error cancelling appointment: ${error.message}`)
    }
  }

  const todayAppointments = filteredAppointments.filter(apt => {
    let dateStr = ''
    if (apt.date && typeof apt.date.toDate === 'function') {
      dateStr = apt.date.toDate().toISOString().split('T')[0]
    } else if (apt.date && typeof apt.date === 'string') {
      dateStr = apt.date.split('T')[0]
    } else if (apt.appointmentDate) {
      dateStr = apt.appointmentDate
    }
    return dateStr === selectedDate
  })
  const upcomingAppointments = filteredAppointments.filter(apt => {
    let aptDate
    if (apt.date && typeof apt.date.toDate === 'function') {
      aptDate = apt.date.toDate()
    } else {
      aptDate = new Date(apt.date || apt.appointmentDate)
    }
    return aptDate > new Date(selectedDate) && apt.status === 'scheduled'
  })

  return (
    <div className="dashboard-container">
      {/* Premium Navigation Bar */}
      <header className="nav-bar">
        <div className="nav-bar-content">
          <div className="flex items-center space-x-4">
            <div className="stat-card-icon stat-card-icon-primary">
              <User className="icon-lg" />
            </div>
            <div>
              <h1 className="nav-bar-title">Patient Appointments</h1>
              <p className="text-sm text-slate-300">Welcome, {doctorName || 'Doctor'}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/doctor" className="btn-primary flex justify-center items-center btn-md rounded-lg">
              <ArrowLeft className="icon-sm mr-2" />
              Back
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      {/* Main Content */}
      <main className="page-container">
        {/* Page Header */}
        <div className="page-header">
          <h1 className="page-title">Appointment Management</h1>
          <p className="page-description">View and manage patient appointments</p>
        </div>

        {/* Controls */}
        <div className="card mb-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex flex-col md:flex-row gap-4 w-full lg:w-auto flex-1">
              <div className="relative flex-1  max-w-[600px] ">
                {/* <Search className="absolute left-3 top-1/2 -translate-y-1/2 icon-sm text-slate-400" /> */}
                <input
                  type="text"
                  placeholder="Search patients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input form-input"
                />
              </div>

              <div className="filter-container">
                <button
                  onClick={() => setViewMode('today')}
                  className={`filter-badge ${viewMode === 'today' ? 'filter-badge-active' : ''}`}
                >
                  <CalendarDays className="icon-sm mr-2" />
                  Today
                </button>
                <button
                  onClick={() => setViewMode('week')}
                  className={`filter-badge ${viewMode === 'week' ? 'filter-badge-active' : ''}`}
                >
                  <CalendarRange className="icon-sm mr-2" />
                  Week
                </button>
                <button
                  onClick={() => setViewMode('month')}
                  className={`filter-badge ${viewMode === 'month' ? 'filter-badge-active' : ''}`}
                >
                  <CalendarCheck className="icon-sm mr-2 " />
                  Month
                </button>
              </div>
            </div>

            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className=" w-auto"
            />
          </div>
        </div>

        {/* Today's Appointments */}
        <div className="section-container mb-8">
          <div className="section-header">
            <div>
              <h2 className="section-title flex items-center gap-2">
                <Calendar className="icon-lg text-primary-600" />
                Today's Appointments ({todayAppointments.length})
              </h2>
              <p className="section-subtitle">Scheduled for {new Date(selectedDate).toLocaleDateString()}</p>
            </div>
          </div>

          {todayAppointments.length === 0 ? (
            <div className="card text-center py-12">
              <Calendar className="icon-xl text-muted mx-auto mb-4" />
              <p className="text-muted">No appointments scheduled for today</p>
            </div>
          ) : (
            <div className="grid-cards">
              {todayAppointments.map((appointment) => (
                <div key={appointment.id} className="card">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-heading text-lg mb-1">{appointment.patientName}</h3>
                      <p className="text-muted text-sm">
                        {appointment.patientAge || 'N/A'} years old, {appointment.patientGender || 'N/A'}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      {appointment.status === 'scheduled' && (
                        <span className="badge-info">Scheduled</span>
                      )}
                      {appointment.status === 'completed' && (
                        <span className="badge-success">Completed</span>
                      )}
                      {appointment.status === 'cancelled' && (
                        <span className="badge-error">Cancelled</span>
                      )}
                      {appointment.appointmentType && (
                        <span className="badge-pending text-xs">{appointment.appointmentType}</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-body">
                      <Clock className="icon-sm text-muted" />
                      <span>{appointment.appointmentTime}</span>
                    </div>
                    <div className="flex items-center gap-2 text-body">
                      <Phone className="icon-sm text-muted" />
                      <span>{appointment.patientPhone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-body">
                      <Mail className="icon-sm text-muted" />
                      <span className="text-sm">{appointment.patientEmail}</span>
                    </div>
                  </div>

                  {appointment.symptoms && (
                    <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                      <h4 className="text-sm font-semibold text-heading mb-1">Symptoms:</h4>
                      <p className="text-sm text-body">{appointment.symptoms}</p>
                    </div>
                  )}

                  {appointment.notes && (
                    <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                      <h4 className="text-sm font-semibold text-heading mb-1">Notes:</h4>
                      <p className="text-sm text-body">{appointment.notes}</p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4 border-t border-slate-200">
                    <button
                      onClick={() => handleViewPatientDetails(appointment)}
                      className="btn-primary btn-sm rounded-lg flex-1"
                    >
                      View Details
                    </button>
                    {appointment.status === 'scheduled' && (
                      <>
                        <button
                          onClick={() => handleCompleteAppointment(appointment.id)}
                          className="btn-secondary btn-icon"
                          title="Mark Complete"
                        >
                          <Check className="icon-sm" />
                        </button>
                        <button
                          onClick={() => handleCancelAppointment(appointment.id)}
                          className="btn-danger btn-icon"
                          title="Cancel"
                        >
                          <X className="icon-sm" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Appointments */}
        {upcomingAppointments.length > 0 && (
          <div className="section-container">
            <div className="section-header">
              <div>
                <h2 className="section-title flex items-center gap-2">
                  <Calendar className="icon-lg text-secondary-600" />
                  Upcoming Appointments ({upcomingAppointments.length})
                </h2>
                <p className="section-subtitle">Future scheduled appointments</p>
              </div>
            </div>

            <div className="card">
              <div className="table-container">
                <div className="table-wrapper">
                  <table className="table">
                    <thead className="table-header">
                      <tr className="table-header-row">
                        <th className="table-header-cell">Patient</th>
                        <th className="table-header-cell">Date</th>
                        <th className="table-header-cell">Time</th>
                        <th className="table-header-cell">Type</th>
                        <th className="table-header-cell text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="table-body">
                      {upcomingAppointments.slice(0, 10).map((appointment) => (
                        <tr key={appointment.id} className="table-row">
                          <td className="table-cell">
                            <p className="table-cell-header">{appointment.patientName}</p>
                            <p className="text-xs text-muted">{appointment.patientPhone}</p>
                          </td>
                          <td className="table-cell">
                            {new Date(appointment.appointmentDate).toLocaleDateString()}
                          </td>
                          <td className="table-cell">{appointment.appointmentTime}</td>
                          <td className="table-cell">
                            <span className="badge-pending">{appointment.appointmentType || 'Consultation'}</span>
                          </td>
                          <td className="table-cell text-right">
                            <button
                              onClick={() => handleViewPatientDetails(appointment)}
                              className="btn-outline-primary btn-sm"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Patient Details Modal */}
      {showPatientDetails && selectedAppointment && (
        <div className="modal-overlay" onClick={() => setShowPatientDetails(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Patient Details</h2>
              <button
                onClick={() => setShowPatientDetails(false)}
                className="btn-icon btn-ghost"
              >
                <X className="icon-md" />
              </button>
            </div>

            <div className="modal-body">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Patient Information */}
                <div className="card bg-slate-50">
                  <h3 className="text-heading text-lg mb-4">Patient Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted">Name:</span>
                      <span className="text-heading font-medium">{selectedAppointment.patientName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Age:</span>
                      <span>{selectedAppointment.patientAge || 'N/A'} years old</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Gender:</span>
                      <span>{selectedAppointment.patientGender || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Phone:</span>
                      <span>{selectedAppointment.patientPhone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Email:</span>
                      <span className="text-sm">{selectedAppointment.patientEmail}</span>
                    </div>
                  </div>
                </div>

                {/* Medical Information */}
                <div className="space-y-4">
                  <div className="card bg-slate-50">
                    <h3 className="text-heading text-lg mb-3">Symptoms</h3>
                    <p className="text-body">{selectedAppointment.symptoms || 'No symptoms reported'}</p>
                  </div>

                  <div className="card bg-slate-50">
                    <h3 className="text-heading text-lg mb-3">Notes</h3>
                    <p className="text-body">{selectedAppointment.notes || 'No notes available'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                onClick={() => setShowPatientDetails(false)}
                className="btn-outline rounded-lg btn-md"
              >
                Close
              </button>
              {selectedAppointment.status === 'scheduled' && (
                <>
                  <button
                    onClick={() => {
                      handleCompleteAppointment(selectedAppointment.id)
                      setShowPatientDetails(false)
                    }}
                    className="btn-secondary btn-md"
                  >
                    Mark Complete
                  </button>
                  <button
                    onClick={() => {
                      handleCancelAppointment(selectedAppointment.id)
                      setShowPatientDetails(false)
                    }}
                    className="btn-danger btn-md"
                  >
                    Cancel Appointment
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
