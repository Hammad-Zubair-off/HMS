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
  Plus,
  Search,
  Filter,
  FileText,
  Pill,
  Eye,
  Edit,
  Trash2,
  ArrowLeft,
  CalendarDays,
  CalendarRange,
  CalendarCheck
} from 'lucide-react'
import { collection, onSnapshot, query, orderBy, doc, deleteDoc, where } from 'firebase/firestore'
import { db } from '../../../firebase/config'

export default function Prescriptions() {
  const { currentUser } = useAuth()
  const [prescriptions, setPrescriptions] = useState([])
  const [filteredPrescriptions, setFilteredPrescriptions] = useState([])
  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-CA'))
  const [viewMode, setViewMode] = useState('today')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!currentUser) return

    setLoading(true)

    const prescriptionsRef = collection(db, 'prescriptions')
    // Query by doctorId (UID) - robust and secure
    // Note: client-side sorting is used to avoid needing a composite index for where+orderBy
    const q = query(
      prescriptionsRef,
      where('doctorId', '==', currentUser.uid)
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const doctorPrescriptions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      // Sort client-side by createdAt descending
      doctorPrescriptions.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt.toDate ? a.createdAt.toDate() : a.createdAt) : new Date(0)
        const dateB = b.createdAt ? new Date(b.createdAt.toDate ? b.createdAt.toDate() : b.createdAt) : new Date(0)
        return dateB - dateA
      })

      setPrescriptions(doctorPrescriptions)
      setLoading(false)

      if (doctorPrescriptions.length > 0) {
        toast.success(`Loaded ${doctorPrescriptions.length} prescriptions`)
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

  useEffect(() => {
    let filtered = prescriptions

    const getDateStr = (pres) => {
      if (pres.date && typeof pres.date.toDate === 'function') {
        return pres.date.toDate().toISOString().split('T')[0]
      }
      if (pres.date && typeof pres.date === 'string') {
        return pres.date.split('T')[0]
      }
      if (pres.prescriptionDate) return pres.prescriptionDate
      return ''
    }

    const getDateObj = (pres) => {
      if (pres.date && typeof pres.date.toDate === 'function') {
        return pres.date.toDate()
      }
      if (pres.date) return new Date(pres.date)
      if (pres.prescriptionDate) return new Date(pres.prescriptionDate)
      return new Date(0)
    }

    if (viewMode === 'today') {
      filtered = filtered.filter(prescription => getDateStr(prescription) === selectedDate)
    } else if (viewMode === 'week') {
      const startOfWeek = new Date(selectedDate)
      const endOfWeek = new Date(selectedDate)
      endOfWeek.setDate(endOfWeek.getDate() + 7)
      filtered = filtered.filter(prescription => {
        const prescriptionDate = getDateObj(prescription)
        return prescriptionDate >= startOfWeek && prescriptionDate < endOfWeek
      })
    } else if (viewMode === 'month') {
      const startOfMonth = new Date(selectedDate)
      const endOfMonth = new Date(selectedDate)
      endOfMonth.setMonth(endOfMonth.getMonth() + 1)
      filtered = filtered.filter(prescription => {
        const prescriptionDate = getDateObj(prescription)
        return prescriptionDate >= startOfMonth && prescriptionDate < endOfMonth
      })
    }

    if (searchTerm) {
      filtered = filtered.filter(prescription =>
        prescription.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prescription.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(prescription => prescription.status === filterStatus)
    }

    setFilteredPrescriptions(filtered)
  }, [prescriptions, selectedDate, viewMode, searchTerm, filterStatus])

  const handleDeletePrescription = async (prescriptionId) => {
    if (window.confirm('Are you sure you want to delete this prescription? This action cannot be undone.')) {
      try {
        await deleteDoc(doc(db, 'prescriptions', prescriptionId))
        toast.success('Prescription deleted successfully!')
      } catch (error) {
        console.error('Error deleting prescription:', error)
        toast.error(`Error deleting prescription: ${error.message}`)
      }
    }
  }

  const todayPrescriptions = filteredPrescriptions.filter(prescription => {
    let dateStr = ''
    if (prescription.date && typeof prescription.date.toDate === 'function') {
      dateStr = prescription.date.toDate().toISOString().split('T')[0]
    } else if (prescription.date && typeof prescription.date === 'string') {
      dateStr = prescription.date.split('T')[0]
    } else if (prescription.prescriptionDate) {
      dateStr = prescription.prescriptionDate
    }
    return dateStr === selectedDate
  })

  return (
    <div className="dashboard-container">
      {/* Premium Navigation Bar */}
      <header className="nav-bar">
        <div className="nav-bar-content">
          <div className="flex items-center space-x-4">
            <div className="stat-card-icon stat-card-icon-secondary">
              <Pill className="icon-lg" />
            </div>
            <div>
              <h1 className="nav-bar-title">Prescriptions</h1>
              <p className="text-sm text-slate-300">Manage patient prescriptions</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/doctor" className="btn-outline flex items-center rounded-lg btn-md">
              <ArrowLeft className="icon-sm mr-2" />
              Back
            </Link>
            <Link to="/doctor/prescriptions/create" className="btn-secondary flex items-center rounded-lg btn-md">
              <Plus className="icon-sm mr-2" />
              New Prescription
            </Link>
            <Link to="/doctor/prescriptions/medicines" className="btn-primary flex items-center rounded-lg btn-md">
              <Pill className="icon-sm mr-2" />
              Manage Medicines
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="page-container">
        {/* Page Header */}
        <div className="page-header">
          <h1 className="page-title">Prescription Management</h1>
          <p className="page-description">View and manage patient prescriptions</p>
        </div>

        {/* Controls */}

        <div className="card mb-6">
          <div className="flex items-center gap-3 overflow-x-auto">
            {/* Search Input */}
            <input
              type="text"
              placeholder="Search patient..."
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
              className="form-input w-auto min-w-[150px] whitespace-nowrap"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="discontinued">Discontinued</option>
              <option value="pending">Pending</option>
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

        {/* Today's Prescriptions */}
        <div className="section-container mb-8">
          <div className="section-header">
            <div>
              <h2 className="section-title flex items-center gap-2">
                <FileText className="icon-lg text-secondary-600" />
                Today's Prescriptions ({todayPrescriptions.length})
              </h2>
              <p className="section-subtitle">Prescriptions scheduled for {new Date(selectedDate).toLocaleDateString()}</p>
            </div>
          </div>

          {loading ? (
            <div className="card text-center py-12">
              <div className="spinner w-12 h-12 mx-auto mb-4"></div>
              <p className="text-muted font-medium">Loading prescriptions...</p>
            </div>
          ) : todayPrescriptions.length === 0 ? (
            <div className="card text-center py-16">
              <FileText className="icon-xl text-muted mx-auto mb-4" />
              <p className="text-muted text-lg font-medium">No prescriptions for today</p>
            </div>
          ) : (
            <div className="grid-cards">
              {todayPrescriptions.map((prescription) => (
                <div key={prescription.id} className="card">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-heading text-lg mb-1">{prescription.patientName}</h3>
                      <p className="text-muted text-sm font-medium">
                        {prescription.patientAge || 'N/A'}y • {prescription.patientGender || 'N/A'}
                      </p>
                    </div>
                    <span className={`badge-${prescription.status === 'active' ? 'success' :
                      prescription.status === 'pending' ? 'warning' : 'info'
                      }`}>
                      {prescription.status?.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className="flex items-center gap-2 text-body">
                      <Calendar className="icon-sm text-muted" />
                      <span className="text-sm font-medium">{prescription.prescriptionDate}</span>
                    </div>
                    <div className="flex items-center gap-2 text-body">
                      <Phone className="icon-sm text-muted" />
                      <span className="text-sm font-medium">{prescription.patientPhone}</span>
                    </div>
                  </div>

                  {prescription.diagnosis && (
                    <div className="mb-5 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <h4 className="text-xs font-bold text-muted uppercase tracking-wider mb-1">Diagnosis</h4>
                      <p className="text-sm text-heading font-medium">{prescription.diagnosis}</p>
                    </div>
                  )}

                  <div className="mb-6">
                    <h4 className="text-xs font-bold text-muted uppercase tracking-wider mb-2">
                      Medicines ({prescription.medicines?.length || 0})
                    </h4>
                    <div className="space-y-1.5">
                      {prescription.medicines?.slice(0, 2).map((medicine, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-body">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                          <span className="font-semibold">{medicine.name}</span>
                          <span className="text-muted text-xs">— {medicine.dosage}</span>
                        </div>
                      ))}
                      {prescription.medicines?.length > 2 && (
                        <p className="text-xs text-primary-600 font-bold mt-1 pl-3">
                          +{prescription.medicines.length - 2} more items
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-slate-200">
                    <Link
                      to={`/doctor/prescriptions/view/${prescription.id}`}
                      className="btn-primary btn-sm flex rounded-lg flex-1 justify-center items-center"
                    >
                      <Eye className="icon-sm mr-2" />
                      View
                    </Link>
                    <Link
                      to={`/doctor/prescriptions/edit/${prescription.id}`}
                      className="btn-icon btn-outline"
                      title="Edit"
                    >
                      <Edit className="icon-sm" />
                    </Link>
                    <button
                      onClick={() => handleDeletePrescription(prescription.id)}
                      className="btn-icon btn-danger"
                      title="Delete"
                    >
                      <Trash2 className="icon-sm" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* All Prescriptions Table */}
        {filteredPrescriptions.length > 0 && (
          <div className="section-container">
            <div className="section-header">
              <div>
                <h2 className="section-title flex items-center gap-2">
                  <FileText className="icon-lg text-primary-600" />
                  History Log ({filteredPrescriptions.length})
                </h2>
                <p className="section-subtitle">Complete prescription history</p>
              </div>
            </div>

            <div className="table-container">
              <div className="table-wrapper">
                <table className="table">
                  <thead className="table-header">
                    <tr className="table-header-row">
                      <th className="table-header-cell">Patient</th>
                      <th className="table-header-cell">Date</th>
                      <th className="table-header-cell">Diagnosis</th>
                      <th className="table-header-cell">Medicines</th>
                      <th className="table-header-cell">Status</th>
                      <th className="table-header-cell text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="table-body">
                    {filteredPrescriptions.map((prescription) => (
                      <tr key={prescription.id} className="table-row">
                        <td className="table-cell">
                          <div>
                            <p className="table-cell-header">{prescription.patientName}</p>
                            <p className="text-xs text-muted">{prescription.patientPhone}</p>
                          </div>
                        </td>
                        <td className="table-cell text-body font-medium">{prescription.prescriptionDate}</td>
                        <td className="table-cell">
                          <p className="text-body font-medium truncate max-w-[200px]">
                            {prescription.diagnosis || 'N/A'}
                          </p>
                        </td>
                        <td className="table-cell">
                          <span className="badge-pending text-xs">
                            {prescription.medicines?.length || 0} items
                          </span>
                        </td>
                        <td className="table-cell">
                          <span className={`badge-${prescription.status === 'active' ? 'success' :
                            prescription.status === 'pending' ? 'warning' : 'info'
                            }`}>
                            {prescription.status}
                          </span>
                        </td>
                        <td className="table-cell text-right">
                          <div className="flex justify-end gap-2">
                            <Link
                              to={`/doctor/prescriptions/view/${prescription.id}`}
                              className="btn-icon btn-ghost"
                              title="View"
                            >
                              <Eye className="icon-sm" />
                            </Link>
                            <Link
                              to={`/doctor/prescriptions/edit/${prescription.id}`}
                              className="btn-icon btn-ghost"
                              title="Edit"
                            >
                              <Edit className="icon-sm" />
                            </Link>
                            <button
                              onClick={() => handleDeletePrescription(prescription.id)}
                              className="btn-icon btn-danger"
                              title="Delete"
                            >
                              <Trash2 className="icon-sm" />
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
