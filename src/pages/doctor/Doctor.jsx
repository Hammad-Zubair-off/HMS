import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { Link } from 'react-router-dom'
import LogoutButton from '../../components/LogoutButton'
import EmailVerificationStatus from '../../components/EmailVerificationStatus'
import { FaUserDoctor, FaCalendar, FaUserInjured, FaPills, FaCalendarDay, FaFileLines, FaPlus, FaHashtag } from 'react-icons/fa6'
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore'
import { db } from '../../firebase/config'

export default function Doctor() {
  const { currentUser, userRole } = useAuth()
  const [stats, setStats] = useState({
    todayAppointments: 0,
    waitingPatients: 0,
    weeklyPrescriptions: 0,
    loading: true
  })
  const [doctorName, setDoctorName] = useState('')

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
        setDoctorName(currentUser.displayName || 'Unknown Doctor')
      }
    }

    fetchDoctorName()
  }, [currentUser])

  // Fetch real-time stats
  useEffect(() => {
    if (!doctorName) return

    const today = new Date().toISOString().split('T')[0]
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - 7)

    // Query for today's appointments
    const todayAppointmentsRef = collection(db, 'appointments')
    const todayQuery = query(
      todayAppointmentsRef,
      where('doctorId', '==', currentUser.uid)
    )

    // Query for waiting patients (tokens generated but not completed)
    const waitingPatientsRef = collection(db, 'appointments')
    const waitingQuery = query(
      waitingPatientsRef,
      where('doctorId', '==', currentUser.uid)
    )

    // Query for weekly prescriptions
    const weeklyPrescriptionsRef = collection(db, 'prescriptions')
    const weeklyQuery = query(
      weeklyPrescriptionsRef,
      where('doctorId', '==', currentUser.uid)
    )

    // Set up real-time listeners
    const unsubscribeToday = onSnapshot(todayQuery, (snapshot) => {
      const today = new Date().toISOString().split('T')[0]
      const todayCount = snapshot.docs.filter(doc => {
        const data = doc.data()
        let dateStr = ''
        if (data.date && typeof data.date.toDate === 'function') {
          dateStr = data.date.toDate().toLocaleDateString('en-CA')
        } else if (data.date && typeof data.date === 'string') {
          dateStr = data.date.split('T')[0]
        } else if (data.appointmentDate) {
          dateStr = data.appointmentDate
        }
        return dateStr === today
      }).length
      setStats(prev => ({ ...prev, todayAppointments: todayCount }))
    })

    const unsubscribeWaiting = onSnapshot(waitingQuery, (snapshot) => {
      const today = new Date().toLocaleDateString('en-CA')
      const waitingCount = snapshot.docs.filter(doc => {
        const data = doc.data()

        // Filter by date first
        let dateStr = ''
        if (data.date && typeof data.date.toDate === 'function') {
          dateStr = data.date.toDate().toLocaleDateString('en-CA')
        } else if (data.date && typeof data.date === 'string') {
          dateStr = data.date.split('T')[0]
        } else if (data.appointmentDate) {
          dateStr = data.appointmentDate
        }

        if (dateStr !== today) return false

        return data.status === 'token_generated' || data.status === 'in_progress' || data.tokenStatus === 'Active' || data.tokenStatus === 'Pending'
      }).length
      setStats(prev => ({ ...prev, waitingPatients: waitingCount }))
    })

    const unsubscribeWeekly = onSnapshot(weeklyQuery, (snapshot) => {
      const weeklyCount = snapshot.docs.filter(doc => {
        const data = doc.data()
        let createdAt
        if (data.createdAt && typeof data.createdAt.toDate === 'function') {
          createdAt = data.createdAt.toDate()
        } else if (data.createdAt) {
          createdAt = new Date(data.createdAt)
        } else {
          return false
        }
        return createdAt >= weekStart
      }).length
      setStats(prev => ({ ...prev, weeklyPrescriptions: weeklyCount, loading: false }))
    })

    return () => {
      unsubscribeToday()
      unsubscribeWaiting()
      unsubscribeWeekly()
    }
  }, [doctorName, currentUser])

  return (
    <div className="dashboard-container">
      {/* Premium Navigation Bar */}
      <header className="nav-bar">
        <div className="nav-bar-content">
          <div className="flex items-center space-x-4">
            <div className="stat-card-icon stat-card-icon-primary">
              <FaUserDoctor className="icon-lg" />
            </div>
            <div>
              <h1 className="nav-bar-title">Doctor Dashboard</h1>
              <p className="text-sm text-slate-300">Welcome, {currentUser?.displayName || 'Doctor'}</p>
            </div>
          </div>
          <LogoutButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="page-container">
        {/* Page Header */}
        <div className="page-header">
          <h1 className="page-title">Overview</h1>
          <p className="page-description">Monitor your daily operations and patient care metrics</p>
        </div>

        {/* Premium Stat Cards */}
        <div className="grid-stats mb-8">
          <Link to="/doctor/appointments" className="stat-card action-card">
            <div className="stat-card-header">
              <div className="stat-card-icon stat-card-icon-primary">
                <FaCalendar className="icon-lg" />
              </div>
            </div>
            <p className="stat-card-title">Today's Appointments</p>
            {stats.loading ? (
              <div className="flex items-center space-x-2">
                <div className="spinner w-6 h-6"></div>
                <p className="text-muted">Loading...</p>
              </div>
            ) : (
              <>
                <p className="stat-card-value">{stats.todayAppointments}</p>
                <p className="text-muted text-sm mt-1">
                  {stats.todayAppointments === 0 ? 'No appointments today' :
                    stats.todayAppointments === 1 ? 'appointment scheduled' :
                      'appointments scheduled'}
                </p>
              </>
            )}
          </Link>

          <Link to="/doctor/tokens" className="stat-card action-card">
            <div className="stat-card-header">
              <div className="stat-card-icon stat-card-icon-amber">
                <FaHashtag className="icon-lg" />
              </div>
            </div>
            <p className="stat-card-title">Patient Queue</p>
            {stats.loading ? (
              <div className="flex items-center space-x-2">
                <div className="spinner w-6 h-6"></div>
                <p className="text-muted">Loading...</p>
              </div>
            ) : (
              <>
                <p className="stat-card-value">{stats.waitingPatients}</p>
                <p className="text-muted text-sm mt-1">
                  {stats.waitingPatients === 0 ? 'No patients waiting' :
                    stats.waitingPatients === 1 ? 'patient waiting' :
                      'patients waiting'}
                </p>
              </>
            )}
          </Link>

          <Link to="/doctor/prescriptions" className="stat-card action-card">
            <div className="stat-card-header">
              <div className="stat-card-icon stat-card-icon-secondary">
                <FaPills className="icon-lg" />
              </div>
            </div>
            <p className="stat-card-title">Weekly Prescriptions</p>
            {stats.loading ? (
              <div className="flex items-center space-x-2">
                <div className="spinner w-6 h-6"></div>
                <p className="text-muted">Loading...</p>
              </div>
            ) : (
              <>
                <p className="stat-card-value">{stats.weeklyPrescriptions}</p>
                <p className="text-muted text-sm mt-1">
                  {stats.weeklyPrescriptions === 0 ? 'No prescriptions this week' :
                    'prescriptions this week'}
                </p>
              </>
            )}
          </Link>

          <div className="stat-card">
            <div className="stat-card-header">
              <div className="stat-card-icon stat-card-icon-success">
                <FaUserInjured className="icon-lg" />
              </div>
            </div>
            <p className="stat-card-title">Total Patients</p>
            <p className="stat-card-value">{stats.todayAppointments + stats.waitingPatients}</p>
            <p className="text-muted text-sm mt-1">Active today</p>
          </div>
        </div>

        {/* Quick Actions Section */}
        <div className="section-container">
          <div className="section-header">
            <div>
              <h2 className="section-title">Quick Actions</h2>
              <p className="section-subtitle">Access frequently used features</p>
            </div>
          </div>

          <div className="grid-cards">
            <Link to="/doctor/appointments" className="card action-card p-6">
              <div className="flex items-start space-x-6">
                <div className="stat-card-icon stat-card-icon-primary shrink-0">
                  <FaCalendar className="icon-lg" />
                </div>
                <div className="flex-1">
                  <h3 className="text-heading text-lg mb-1">View Appointments</h3>
                  <p className="text-muted text-sm leading-relaxed">Manage patient appointments</p>
                </div>
              </div>
            </Link>

            <Link to="/doctor/prescriptions/create" className="card action-card p-6">
              <div className="flex items-start space-x-6">
                <div className="stat-card-icon stat-card-icon-secondary shrink-0">
                  <FaPlus className="icon-lg" />
                </div>
                <div className="flex-1">
                  <h3 className="text-heading text-lg mb-1">New Prescription</h3>
                  <p className="text-muted text-sm leading-relaxed">Create prescription for patient</p>
                </div>
              </div>
            </Link>

            <Link to="/doctor/prescriptions" className="card action-card p-6">
              <div className="flex items-start space-x-6">
                <div className="stat-card-icon stat-card-icon-secondary shrink-0">
                  <FaFileLines className="icon-lg" />
                </div>
                <div className="flex-1">
                  <h3 className="text-heading text-lg mb-1">View Prescriptions</h3>
                  <p className="text-muted text-sm leading-relaxed">Manage all prescriptions</p>
                </div>
              </div>
            </Link>

            <Link to="/doctor/prescriptions/medicines" className="card action-card p-6">
              <div className="flex items-start space-x-6">
                <div className="stat-card-icon stat-card-icon-amber shrink-0">
                  <FaPills className="icon-lg" />
                </div>
                <div className="flex-1">
                  <h3 className="text-heading text-lg mb-1">Manage Medicines</h3>
                  <p className="text-muted text-sm leading-relaxed">Add/edit medicine inventory</p>
                </div>
              </div>
            </Link>

            <Link to="/doctor/tokens" className="card action-card p-6">
              <div className="flex items-start space-x-6">
                <div className="stat-card-icon stat-card-icon-primary shrink-0">
                  <FaHashtag className="icon-lg" />
                </div>
                <div className="flex-1">
                  <h3 className="text-heading text-lg mb-1">Patient Queue</h3>
                  <p className="text-muted text-sm leading-relaxed">View and manage patient tokens</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Account Information Card */}
        <div className="mt-8">
          <div className="card">
            <div className="section-header mb-6">
              <div>
                <h2 className="section-title">Account Information</h2>
                <p className="section-subtitle">Your profile and verification status</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-muted text-sm mb-1">Email</p>
                <p className="text-heading">{currentUser?.email}</p>
              </div>
              <div>
                <p className="text-muted text-sm mb-1">Role</p>
                <span className="badge-info capitalize">{userRole}</span>
              </div>
              <div>
                <p className="text-muted text-sm mb-1">Full Name</p>
                <p className="text-heading">{currentUser?.displayName}</p>
              </div>
              <div>
                <p className="text-muted text-sm mb-1">Email Verified</p>
                <EmailVerificationStatus />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
