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
  Search,
  Filter,
  FileText,
  Pill,
  Eye,
  Download,
  Printer,
  ArrowLeft,
  CalendarDays,
  CalendarRange,
  CalendarCheck,
  FileDown,
  Users,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'
import { collection, onSnapshot, query, orderBy, where } from 'firebase/firestore'
import { db } from '../../../firebase/config'
import { downloadPrescriptionPDF } from './PrescriptionPdfGenerator'
import { getDateString, getDateObject } from '../../../utils/firestoreUtils'

export default function ReceptionistPrescriptions() {
  const { currentUser } = useAuth()
  const [prescriptions, setPrescriptions] = useState([])
  const [filteredPrescriptions, setFilteredPrescriptions] = useState([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [viewMode, setViewMode] = useState('today') // today, week, month, all
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterDoctor, setFilterDoctor] = useState('all')
  const [loading, setLoading] = useState(false)
  const [doctors, setDoctors] = useState([])

  // Fetch prescriptions (client-side sort to handle mixed createdAt: string vs Timestamp)
  useEffect(() => {
    if (!currentUser) return

    setLoading(true)

    const prescriptionsRef = collection(db, 'prescriptions')
    const q = query(prescriptionsRef)

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const raw = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      const prescriptionsData = raw.map(p => ({
        ...p,
        prescriptionDate: getDateString(p.date ?? p.prescriptionDate) || p.prescriptionDate || ''
      }))
      prescriptionsData.sort((a, b) => {
        const dateA = getDateObject(a.createdAt) || new Date(0)
        const dateB = getDateObject(b.createdAt) || new Date(0)
        return dateB - dateA
      })
      setPrescriptions(prescriptionsData)
      setLoading(false)

      if (prescriptionsData.length > 0) {
        toast.success(`Loaded ${prescriptionsData.length} prescriptions`)
      } else {
        toast.success('No prescriptions found')
      }
    }, (error) => {
      console.error('Error fetching prescriptions:', error)
      toast.error('Error loading prescriptions')
      setLoading(false)
    })

    return () => unsubscribe()
  }, [currentUser])

  // Fetch doctors (doc id is uid, used for filter by doctorId)
  useEffect(() => {
    const staffRef = collection(db, 'staffData')
    const staffQuery = query(staffRef, where('role', '==', 'doctor'))
    const unsubscribe = onSnapshot(staffQuery, (snapshot) => {
      const doctorsData = snapshot.docs.map(doc => ({
        id: doc.id,
        uid: doc.id,
        ...doc.data()
      }))
      setDoctors(doctorsData)
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    let filtered = prescriptions

    // Normalize selected date for comparison (YYYY-MM-DD)
    const selectedNorm = selectedDate.split('T')[0]

    // Filter by date based on view mode (use normalized prescriptionDate)
    if (viewMode === 'today') {
      filtered = filtered.filter(p => (p.prescriptionDate || '').split('T')[0] === selectedNorm)
    } else if (viewMode === 'week') {
      const startOfWeek = new Date(selectedNorm)
      const endOfWeek = new Date(selectedNorm)
      endOfWeek.setDate(endOfWeek.getDate() + 7)
      filtered = filtered.filter(p => {
        const d = getDateObject(p.date ?? p.prescriptionDate) || new Date(p.prescriptionDate)
        if (!d || isNaN(d.getTime())) return false
        return d >= startOfWeek && d < endOfWeek
      })
    } else if (viewMode === 'month') {
      const startOfMonth = new Date(selectedNorm)
      const endOfMonth = new Date(selectedNorm)
      endOfMonth.setMonth(endOfMonth.getMonth() + 1)
      filtered = filtered.filter(p => {
        const d = getDateObject(p.date ?? p.prescriptionDate) || new Date(p.prescriptionDate)
        if (!d || isNaN(d.getTime())) return false
        return d >= startOfMonth && d < endOfMonth
      })
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(prescription =>
        (prescription.patientName || '').toLowerCase().includes(term) ||
        (prescription.doctorName || '').toLowerCase().includes(term) ||
        (prescription.diagnosis || '').toLowerCase().includes(term)
      )
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(prescription => (prescription.status || '') === filterStatus)
    }

    // Filter by doctor (use doctorId to sync with staffData; dropdown value is uid)
    if (filterDoctor !== 'all') {
      filtered = filtered.filter(prescription => (prescription.doctorId || '') === filterDoctor)
    }

    setFilteredPrescriptions(filtered)
  }, [prescriptions, selectedDate, viewMode, searchTerm, filterStatus, filterDoctor])

  const handlePrintPrescription = (prescription) => {
    // Implement print functionality
    toast.success(`Printing prescription for ${prescription.patientName}`)
  }

  const handleDownloadPDF = (prescription) => {
    try {
      const success = downloadPrescriptionPDF(prescription)
      if (success) {
        toast.success(`PDF downloaded for ${prescription.patientName}`)
      } else {
        toast.error(`Failed to generate PDF for ${prescription.patientName}`)
      }
    } catch (error) {
      console.error('PDF generation error:', error)
      toast.error(`Error generating PDF for ${prescription.patientName}`)
    }
  }

  const handleDownloadAllPDFs = () => {
    try {
      let successCount = 0
      let errorCount = 0

      filteredPrescriptions.forEach((prescription, index) => {
        setTimeout(() => {
          try {
            const success = downloadPrescriptionPDF(prescription)
            if (success) {
              successCount++
            } else {
              errorCount++
            }
          } catch (error) {
            errorCount++
            console.error(`Error downloading PDF for ${prescription.patientName}:`, error)
          }
        }, index * 1000) // Delay each download by 1 second
      })

      toast.success(`Started downloading ${filteredPrescriptions.length} prescriptions`)

      // Show final result after all downloads
      setTimeout(() => {
        if (errorCount === 0) {
          toast.success(`Successfully downloaded ${successCount} prescriptions`)
        } else {
          toast.error(`Downloaded ${successCount} prescriptions, failed ${errorCount}`)
        }
      }, (filteredPrescriptions.length + 2) * 1000)

    } catch (error) {
      console.error('Bulk download error:', error)
      toast.error('Error starting bulk download')
    }
  }

  const getStatusBadgeClass = (status) => {
    const map = { active: 'badge-info', completed: 'badge-success', discontinued: 'badge-error', pending: 'badge-pending' }
    return `badge ${map[status] || 'badge-info'}`
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <Pill className="w-4 h-4" />
      case 'completed': return <FileText className="w-4 h-4" />
      case 'discontinued': return <AlertTriangle className="w-4 h-4" />
      case 'pending': return <Clock className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  const selectedNorm = (selectedDate || '').split('T')[0]
  const todayPrescriptions = filteredPrescriptions.filter(
    prescription => (prescription.prescriptionDate || '').split('T')[0] === selectedNorm
  )

  return (
    <div className="dashboard-container">
      <nav className="nav-bar">
        <div className="nav-bar-content">
          <div className="flex items-center gap-3">
            <div className="stat-card-icon stat-card-icon-secondary w-10 h-10 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="nav-bar-title">Prescriptions Management</h1>
              <p className="text-sm text-slate-300">View and manage patient prescriptions</p>
            </div>
          </div>
          <div className="nav-bar-user flex items-center gap-2">
            <Link to="/receptionist" className="btn btn-outline btn-md inline-flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </Link>
            <button type="button" onClick={handleDownloadAllPDFs} className="btn btn-secondary btn-md inline-flex items-center gap-2">
              <FileDown className="w-4 h-4" />
              <span>Download All PDFs</span>
            </button>
            <LogoutButton />
          </div>
        </div>
      </nav>

      <main className="page-container">
        <div className="filter-container flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">

          <div className="filter-container mb-6">
            <div className="flex items-center gap-3 overflow-x-auto">
              {/* Search Input */}
              <input
                type="text"
                placeholder="Search patients, doctors, or diagnosis..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input form-input flex-1 min-w-[600px]"
              />

              {/* Time Period Dropdown */}
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value)}
                className="form-input w-auto whitespace-nowrap"
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="all">All Time</option>
              </select>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="form-input w-auto whitespace-nowrap"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="discontinued">Discontinued</option>
                <option value="pending">Pending</option>
              </select>

              {/* Doctor Filter (value = uid for reliable sync) */}
              <select
                value={filterDoctor}
                onChange={(e) => setFilterDoctor(e.target.value)}
                className="form-input w-auto whitespace-nowrap"
              >
                <option value="all">All Doctors</option>
                {doctors.map(doctor => (
                  <option key={doctor.id} value={doctor.id}>{doctor.fullName || doctor.email || 'Doctor'}</option>
                ))}
              </select>

              {/* Date Picker */}
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="form-input w-auto whitespace-nowrap"
              />
            </div>
          </div>
        </div>


        <div className="section-container mb-8">
          <h2 className="section-title mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-secondary-500" />
            <span>Today's Prescriptions ({todayPrescriptions.length})</span>
          </h2>
          {loading ? (
            <div className="card p-8 text-center">
              <div className="spinner mx-auto" />
              <p className="text-muted mt-4">Loading prescriptions...</p>
            </div>
          ) : todayPrescriptions.length === 0 ? (
            <div className="card p-8 text-center">
              <FileText className="w-16 h-16 text-muted mx-auto mb-4 icon-lg" />
              <p className="text-muted">No prescriptions for today</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {todayPrescriptions.map((prescription) => (
                <div key={prescription.id} className="card">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-heading text-lg font-semibold">{prescription.patientName}</h3>
                      <p className="text-muted">{prescription.patientAge || 'N/A'} years old, {prescription.patientGender || 'N/A'}</p>
                    </div>
                    <span className={`${getStatusBadgeClass(prescription.status)} inline-flex items-center gap-1`}>
                      {getStatusIcon(prescription.status)}
                      <span className="capitalize">{prescription.status}</span>
                    </span>
                  </div>
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted icon-sm" />
                      <span className="text-body">{prescription.prescriptionDate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted icon-sm" />
                      <span className="text-body">Dr. {prescription.doctorName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted icon-sm" />
                      <span className="text-body">{prescription.patientPhone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted icon-sm" />
                      <span className="text-body">{prescription.patientEmail}</span>
                    </div>
                  </div>
                  {prescription.diagnosis && (
                    <div className="mb-4">
                      <h4 className="form-label mb-1">Diagnosis:</h4>
                      <p className="text-sm text-muted">{prescription.diagnosis}</p>
                    </div>
                  )}
                  <div className="mb-4">
                    <h4 className="form-label mb-1">Medicines ({prescription.medicines?.length || 0}):</h4>
                    <div className="space-y-1">
                      {prescription.medicines?.slice(0, 3).map((medicine, index) => (
                        <p key={index} className="text-sm text-muted">• {medicine.name} - {medicine.dosage}</p>
                      ))}
                      {prescription.medicines?.length > 3 && (
                        <p className="text-sm text-muted">+{prescription.medicines.length - 3} more medicines</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link to={`/receptionist/prescriptions/view/${prescription.id}`} className="btn btn-primary btn-sm flex-1 inline-flex items-center justify-center gap-2">
                      <Eye className="w-4 h-4" />
                      <span>View</span>
                    </Link>
                    <button type="button" onClick={() => handlePrintPrescription(prescription)} className="btn btn-outline btn-icon btn-sm">
                      <Printer className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => handleDownloadPDF(prescription)} className="btn btn-secondary btn-icon btn-sm">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {filteredPrescriptions.length > 0 && (
          <div className="section-container">
            <h2 className="section-title mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary-500" />
              <span>All Prescriptions ({filteredPrescriptions.length})</span>
            </h2>
            <div className="table-container card">
              <div className="table-wrapper">
                <table className="table">
                  <thead className="table-header">
                    <tr className="table-header-row">
                      <th className="table-header-cell">Patient</th>
                      <th className="table-header-cell">Doctor</th>
                      <th className="table-header-cell">Date</th>
                      <th className="table-header-cell">Diagnosis</th>
                      <th className="table-header-cell">Medicines</th>
                      <th className="table-header-cell">Status</th>
                      <th className="table-header-cell">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="table-body">
                    {filteredPrescriptions.map((prescription) => (
                      <tr key={prescription.id} className="table-row">
                        <td className="table-cell">
                          <div>
                            <p className="font-medium text-heading">{prescription.patientName}</p>
                            <p className="text-sm text-muted">{prescription.patientPhone}</p>
                          </div>
                        </td>
                        <td className="table-cell text-body">{prescription.doctorName}</td>
                        <td className="table-cell text-body">{prescription.prescriptionDate}</td>
                        <td className="table-cell text-body">{prescription.diagnosis || 'N/A'}</td>
                        <td className="table-cell text-body">{prescription.medicines?.length || 0} medicines</td>
                        <td className="table-cell">
                          <span className={`${getStatusBadgeClass(prescription.status)} inline-flex items-center gap-1 w-fit`}>
                            {getStatusIcon(prescription.status)}
                            <span className="capitalize">{prescription.status}</span>
                          </span>
                        </td>
                        <td className="table-cell">
                          <div className="flex gap-2">
                            <Link to={`/receptionist/prescriptions/view/${prescription.id}`} className="btn btn-primary btn-sm">
                              View
                            </Link>
                            <button type="button" onClick={() => handleDownloadPDF(prescription)} className="btn btn-secondary btn-sm">
                              PDF
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
