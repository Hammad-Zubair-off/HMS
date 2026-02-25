import { useState, useEffect } from 'react'
import { useAuth } from '../../../hooks/useAuth'
import { Link, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import LogoutButton from '../../../components/LogoutButton'
import { 
  UserPlus, 
  ArrowLeft, 
  Save,
  User,
  Phone,
  Mail,
  Calendar,
  MapPin,
  FileText,
  AlertCircle
} from 'lucide-react'
import { collection, addDoc, doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '../../../firebase/config'

export default function CreatePatient() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const { id } = useParams()
  const [loading, setLoading] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [initialLoading, setInitialLoading] = useState(false)

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: '',
    bloodGroup: '',
    allergies: '',
    medicalHistory: '',
    medications: '',
    insuranceProvider: '',
    insurancePolicyNumber: '',
    notes: '',
    status: 'active'
  })

  const [errors, setErrors] = useState({})

  // Generate Patient ID
  const generatePatientId = () => {
    const prefix = 'PAT'
    const timestamp = Date.now().toString().slice(-6)
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    return `${prefix}-${timestamp}-${random}`
  }

  // Fetch patient data for editing
  useEffect(() => {
    if (!id) return

    const fetchPatientData = async () => {
      setInitialLoading(true)
      try {
        const patientRef = doc(db, 'patients', id)
        const patientSnap = await getDoc(patientRef)
        
        if (patientSnap.exists()) {
          setIsEditMode(true)
          const patientData = patientSnap.data()
          setFormData({
            fullName: patientData.fullName || '',
            phone: patientData.phone || '',
            email: patientData.email || '',
            dateOfBirth: patientData.dateOfBirth || '',
            gender: patientData.gender || '',
            address: patientData.address || '',
            city: patientData.city || '',
            state: patientData.state || '',
            zipCode: patientData.zipCode || '',
            emergencyContactName: patientData.emergencyContactName || '',
            emergencyContactPhone: patientData.emergencyContactPhone || '',
            emergencyContactRelation: patientData.emergencyContactRelation || '',
            bloodGroup: patientData.bloodGroup || '',
            allergies: patientData.allergies || '',
            medicalHistory: patientData.medicalHistory || '',
            medications: patientData.medications || '',
            insuranceProvider: patientData.insuranceProvider || '',
            insurancePolicyNumber: patientData.insurancePolicyNumber || '',
            notes: patientData.notes || '',
            status: patientData.status || 'active'
          })
          toast.success('Patient data loaded successfully')
        } else {
          toast.error('Patient not found')
          navigate('/receptionist/patients')
        }
      } catch (error) {
        console.error('Error fetching patient:', error)
        toast.error('Error loading patient data')
        navigate('/receptionist/patients')
      } finally {
        setInitialLoading(false)
      }
    }

    fetchPatientData()
  }, [id, navigate])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    } else if (!/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone number format'
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    }

    if (formData.dateOfBirth) {
      const birthDate = new Date(formData.dateOfBirth)
      const today = new Date()
      if (birthDate > today) {
        newErrors.dateOfBirth = 'Date of birth cannot be in the future'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const patientData = {
        ...formData,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser.uid
      }

      if (isEditMode) {
        // Update existing patient
        const patientRef = doc(db, 'patients', id)
        await updateDoc(patientRef, patientData)
        toast.success('Patient updated successfully!')
      } else {
        // Create new patient
        patientData.patientId = generatePatientId()
        patientData.createdAt = new Date().toISOString()
        patientData.createdBy = currentUser.uid
        await addDoc(collection(db, 'patients'), patientData)
        toast.success('Patient registered successfully!')
      }
      
      navigate('/receptionist/patients')
    } catch (error) {
      console.error('Error saving patient:', error)
      toast.error(`Error saving patient: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="dashboard-container">
      {/* Premium Navigation */}
      <header className="nav-bar">
        <div className="nav-bar-content">
          <div className="flex items-center gap-4">
          
            <div className="stat-card-icon stat-card-icon-primary">
              <UserPlus className="icon-lg" />
            </div>
            <div>
              <h1 className="nav-bar-title">{isEditMode ? 'Edit Patient' : 'Register New Patient'}</h1>
              <p className="text-sm text-slate-400">
                {isEditMode ? 'Update patient information' : 'Create a new patient profile'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
                      <Link 
                        to="/receptionist"
                        className="btn-outline rounded-lg btn-md flex"
                      >
                        {/* <ArrowLeft className="icon-sm" /> */}
                        <span>Back to Dashboard</span>
                      </Link>
                    <LogoutButton />
            </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="page-container">
        {initialLoading ? (
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <div className="spinner w-12 h-12 mx-auto mb-4"></div>
              <p className="text-muted">Loading patient data...</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="form-container">
            {/* Personal Information */}
            <div className="card">
              <h2 className="text-heading text-lg mb-4 flex items-center gap-2">
                <User className="icon-md text-primary-500" />
                <span>Personal Information</span>
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label form-label-required">Full Name</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className={` ${errors.fullName ? '-error' : ''} form-input`}
                    placeholder="Enter full name"
                  />
                  {errors.fullName && <p className="form-error">{errors.fullName}</p>}
                </div>
                
                <div className="form-group">
                  <label className="form-label form-label-required">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={` ${errors.phone ? '-error' : ''} form-input`}
                    placeholder="Enter phone number"
                  />
                  {errors.phone && <p className="form-error">{errors.phone}</p>}
                </div>
                
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={` ${errors.email ? '-error' : ''} form-input`}
                    placeholder="Enter email address"
                  />
                  {errors.email && <p className="form-error">{errors.email}</p>}
                </div>
                
                <div className="form-group">
                  <label className="form-label">Date of Birth</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    max={new Date().toISOString().split('T')[0]}
                    className={` ${errors.dateOfBirth ? '-error' : ''} form-input`}
                  />
                  {errors.dateOfBirth && <p className="form-error">{errors.dateOfBirth}</p>}
                </div>
                
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="form-input"
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div className="form-group ">
                  <label className="form-label">Blood Group</label>
                  <select
                    name="bloodGroup"
                    value={formData.bloodGroup}
                    onChange={handleInputChange}
                    className="form-input"
                  >
                    <option value="">Select blood group</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="card">
              <h2 className="text-heading text-lg mb-4 flex items-center gap-2">
                <MapPin className="icon-md text-secondary-500" />
                <span>Address Information</span>
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group md:col-span-2">
                  <label className="form-label">Street Address</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter street address"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter city"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">State</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter state"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Zip Code</label>
                  <input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter zip code"
                  />
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="card">
              <h2 className="text-heading text-lg mb-4 flex items-center gap-2">
                <AlertCircle className="icon-md text-accent-amber-500" />
                <span>Emergency Contact</span>
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="form-group">
                  <label className="form-label">Contact Name</label>
                  <input
                    type="text"
                    name="emergencyContactName"
                    value={formData.emergencyContactName}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter contact name"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Contact Phone</label>
                  <input
                    type="tel"
                    name="emergencyContactPhone"
                    value={formData.emergencyContactPhone}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter contact phone"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Relation</label>
                  <input
                    type="text"
                    name="emergencyContactRelation"
                    value={formData.emergencyContactRelation}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="e.g., Spouse, Parent"
                  />
                </div>
              </div>
            </div>

            {/* Medical Information */}
            <div className="card">
              <h2 className="text-heading text-lg mb-4 flex items-center gap-2">
                <FileText className="icon-md text-accent-emerald-500" />
                <span>Medical Information</span>
              </h2>
              
              <div className="space-y-4">
                <div className="form-group">
                  <label className="form-label">Allergies</label>
                  <textarea
                    name="allergies"
                    value={formData.allergies}
                    onChange={handleInputChange}
                    className="form-textarea form-input"
                    rows="2"
                    placeholder="List any known allergies..."
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Medical History</label>
                  <textarea
                    name="medicalHistory"
                    value={formData.medicalHistory}
                    onChange={handleInputChange}
                    className="form-textarea form-input"
                    rows="3"
                    placeholder="Past medical conditions, surgeries, etc..."
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Current Medications</label>
                  <textarea
                    name="medications"
                    value={formData.medications}
                    onChange={handleInputChange}
                    className="form-textarea form-input"
                    rows="2"
                    placeholder="Current medications and dosages..."
                  />
                </div>
              </div>
            </div>

            {/* Insurance Information */}
            <div className="card">
              <h2 className="text-heading text-lg mb-4">Insurance Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Insurance Provider</label>
                  <input
                    type="text"
                    name="insuranceProvider"
                    value={formData.insuranceProvider}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter insurance provider"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Policy Number</label>
                  <input
                    type="text"
                    name="insurancePolicyNumber"
                    value={formData.insurancePolicyNumber}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter policy number"
                  />
                </div>
              </div>
            </div>

            {/* Additional Notes */}
            <div className="card">
              <h2 className="text-heading text-lg mb-4">Additional Notes</h2>
              
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="form-textarea form-input"
                  rows="3"
                  placeholder="Any additional notes about the patient..."
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-4">
              <Link
                to="/receptionist/patients"
                className="btn-outline btn-md rounded-lg"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary btn-md rounded-lg flex items-center gap-2"
              >
                {loading ? (
                  <div className="spinner w-4 h-4"></div>
                ) : (
                  <Save className="icon-sm" />
                )}
                <span>{loading ? (isEditMode ? 'Updating...' : 'Registering...') : (isEditMode ? 'Update Patient' : 'Register Patient')}</span>
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  )
}
