import { useState, useEffect } from 'react'
import { useAuth } from '../../../hooks/useAuth'
import { Link, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import LogoutButton from '../../../components/LogoutButton'
import { downloadPrescriptionPDF, openPrescriptionPDF, printPrescriptionPDF } from './PrescriptionPdfGenerator'
import { 
  User, 
  Calendar, 
  Clock, 
  Phone, 
  Mail, 
  ArrowLeft,
  Pill,
  FileText,
  Printer,
  Download,
  AlertTriangle,
  CheckCircle,
  Package,
  Activity,
  Users
} from 'lucide-react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../../firebase/config'

export default function ReceptionistViewPrescription() {
  const { currentUser: _ } = useAuth()
  const { id } = useParams()
  const [prescription, setPrescription] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPrescription = async () => {
      if (!id) return

      try {
        const prescriptionDoc = await getDoc(doc(db, 'prescriptions', id))
        if (prescriptionDoc.exists()) {
          setPrescription({ id: prescriptionDoc.id, ...prescriptionDoc.data() })
        } else {
          toast.error('Prescription not found')
        }
      } catch (error) {
        console.error('Error fetching prescription:', error)
        toast.error('Error loading prescription')
      } finally {
        setLoading(false)
      }
    }

    fetchPrescription()
  }, [id])

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <Pill className="w-4 h-4" />
      case 'completed': return <FileText className="w-4 h-4" />
      case 'discontinued': return <AlertTriangle className="w-4 h-4" />
      case 'pending': return <Clock className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  const getTimingLabel = (timing) => {
    switch (timing) {
      case 'before_meal': return 'Before Meal'
      case 'after_meal': return 'After Meal'
      case 'empty_stomach': return 'Empty Stomach'
      case 'bedtime': return 'Bedtime'
      case 'as_needed': return 'As Needed'
      default: return timing
    }
  }

  const handlePrint = () => {
    try {
      const success = printPrescriptionPDF(prescription)
      if (success) {
        toast.success('Opening print dialog...')
      } else {
        toast.error('Failed to generate print view')
      }
    } catch (error) {
      console.error('Print error:', error)
      toast.error('Error generating print view')
    }
  }

  const handleDownloadPDF = () => {
    try {
      const success = downloadPrescriptionPDF(prescription)
      if (success) {
        toast.success('PDF download started')
      } else {
        toast.error('Failed to generate PDF')
      }
    } catch (error) {
      console.error('PDF generation error:', error)
      toast.error('Error generating PDF')
    }
  }

  const handleViewPDF = () => {
    try {
      const success = openPrescriptionPDF(prescription)
      if (success) {
        toast.success('Opening PDF in new tab...')
      } else {
        toast.error('Failed to open PDF')
      }
    } catch (error) {
      console.error('PDF view error:', error)
      toast.error('Error opening PDF')
    }
  }

  if (loading) {
    return (
      <div className="dashboard-container flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto" />
          <p className="text-muted mt-4">Loading prescription...</p>
        </div>
      </div>
    )
  }

  if (!prescription) {
    return (
      <div className="dashboard-container flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-16 h-16 text-muted mx-auto mb-4 icon-lg" />
          <p className="text-muted">Prescription not found</p>
          
        </div>
      </div>
    )
  }

  const statusBadgeClass = {
    active: 'badge badge-info',
    completed: 'badge badge-success',
    discontinued: 'badge badge-error',
    pending: 'badge badge-pending'
  }[prescription.status] || 'badge badge-info'

  return (
    <div className="dashboard-container">
      <nav className="nav-bar">
        <div className="nav-bar-content">
          <div className="flex items-center gap-3">
            {/* <Link to="/receptionist/prescriptions" className="btn btn-ghost btn-sm inline-flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Prescriptions</span>
            </Link> */}
            <div className="stat-card-icon stat-card-icon-secondary w-10 h-10 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="nav-bar-title">Prescription Details</h1>
              <p className="text-sm text-slate-300">View and manage prescription</p>
            </div>
          </div>
          <div className="nav-bar-user flex items-center justify-center gap-2">
              <Link to="/receptionist/prescriptions" className="btn btn-outline btn-md  inline-flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Prescriptions</span>
            </Link>
            <button type="button" onClick={handleViewPDF} className="btn btn-secondary btn-md inline-flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>View PDF</span>
            </button>
            <button type="button" onClick={handlePrint} className="btn btn-primary btn-md inline-flex items-center gap-2">
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
            <button type="button" onClick={handleDownloadPDF} className="btn btn-secondary btn-md inline-flex items-center gap-2">
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
            <LogoutButton />
          </div>
        </div>
      </nav>

      <main className="page-container max-w-4xl mx-auto">
        <div className="space-y-6">
          <div className="card">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-heading text-2xl font-bold mb-2">Medical Prescription</h2>
                <p className="text-muted">Prescription ID: {prescription.id}</p>
              </div>
              <span className={`${statusBadgeClass} inline-flex items-center gap-2`}>
                {getStatusIcon(prescription.status)}
                <span className="capitalize">{prescription.status}</span>
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-body">
              <div>
                <span className="text-muted">Date:</span>
                <span className="ml-2 text-heading">{prescription.prescriptionDate}</span>
              </div>
              <div>
                <span className="text-muted">Doctor:</span>
                <span className="ml-2 text-heading">{prescription.doctorName}</span>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="section-title mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-primary-500" />
              <span>Patient Information</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-muted">Name:</span>
                <span className="ml-2 text-heading font-medium">{prescription.patientName}</span>
              </div>
              <div>
                <span className="text-muted">Age:</span>
                <span className="ml-2 text-heading">{prescription.patientAge} years</span>
              </div>
              <div>
                <span className="text-muted">Gender:</span>
                <span className="ml-2 text-heading">{prescription.patientGender}</span>
              </div>
              <div>
                <span className="text-muted">Phone:</span>
                <span className="ml-2 text-heading">{prescription.patientPhone}</span>
              </div>
              <div className="md:col-span-2">
                <span className="text-muted">Email:</span>
                <span className="ml-2 text-heading">{prescription.patientEmail}</span>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="section-title mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <span>Diagnosis & Symptoms</span>
            </h3>
            <div className="space-y-4">
              {prescription.diagnosis && (
                <div>
                  <h4 className="form-label mb-2">Diagnosis:</h4>
                  <p className="text-body">{prescription.diagnosis}</p>
                </div>
              )}
              {prescription.symptoms && (
                <div>
                  <h4 className="form-label mb-2">Symptoms:</h4>
                  <p className="text-body">{prescription.symptoms}</p>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <h3 className="section-title mb-4 flex items-center gap-2">
              <Pill className="w-5 h-5 text-secondary-500" />
              <span>Prescribed Medicines ({prescription.medicines?.length || 0})</span>
            </h3>
            <div className="space-y-4">
              {prescription.medicines?.map((medicine, index) => (
                <div key={medicine.id || index} className="rounded-xl border border-neutral-200 bg-neutral-50/80 p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="text-heading font-semibold text-lg">{medicine.name}</h4>
                      <p className="text-muted">{medicine.category}</p>
                    </div>
                    <span className="text-muted text-sm">#{index + 1}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-body">
                    <div>
                      <span className="text-muted">Dosage:</span>
                      <span className="ml-2 text-heading">{medicine.dosage}</span>
                    </div>
                    <div>
                      <span className="text-muted">Frequency:</span>
                      <span className="ml-2 text-heading">{medicine.frequency}</span>
                    </div>
                    <div>
                      <span className="text-muted">Duration:</span>
                      <span className="ml-2 text-heading">{medicine.duration}</span>
                    </div>
                    <div>
                      <span className="text-muted">Timing:</span>
                      <span className="ml-2 text-heading">{getTimingLabel(medicine.timing)}</span>
                    </div>
                  </div>
                  {medicine.specialInstructions && (
                    <div className="mt-3">
                      <span className="text-muted text-sm">Special Instructions:</span>
                      <p className="text-body text-sm mt-1">{medicine.specialInstructions}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="section-title mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-primary-500" />
              <span>Instructions & Follow-up</span>
            </h3>
            <div className="space-y-4">
              {prescription.instructions && (
                <div>
                  <h4 className="form-label mb-2">General Instructions:</h4>
                  <p className="text-body">{prescription.instructions}</p>
                </div>
              )}
              {prescription.followUpDate && (
                <div>
                  <h4 className="form-label mb-2">Follow-up Date:</h4>
                  <p className="text-body">{prescription.followUpDate}</p>
                </div>
              )}
              {prescription.notes && (
                <div>
                  <h4 className="form-label mb-2">Additional Notes:</h4>
                  <p className="text-body">{prescription.notes}</p>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted">Prescribed on: {prescription.prescriptionDate}</p>
                <p className="text-sm text-muted">Doctor: {prescription.doctorName}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted">Prescription ID</p>
                <p className="text-sm text-heading font-mono">{prescription.id}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
