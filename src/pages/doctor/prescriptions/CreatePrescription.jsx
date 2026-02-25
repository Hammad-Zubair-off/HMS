import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../../../hooks/useAuth'
import { Link, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import LogoutButton from '../../../components/LogoutButton'
import { 
  User, 
  UserPlus,
  Calendar, 
  Clock, 
  Phone, 
  Mail, 
  Plus,
  Minus,
  Save,
  ArrowLeft,
  Pill,
  FileText,
  Search,
  AlertTriangle,
  CheckCircle,
  X
} from 'lucide-react'
import { collection, addDoc, onSnapshot, query, orderBy, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '../../../firebase/config'

export default function CreatePrescription() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const { id } = useParams()
  const medicineDropdownRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [patients, setPatients] = useState([])
  const [filteredPatients, setFilteredPatients] = useState([])
  const [medicines, setMedicines] = useState([])
  const [filteredMedicines, setFilteredMedicines] = useState([])
  const [showMedicineDropdown, setShowMedicineDropdown] = useState(false)
  const [showPatientModal, setShowPatientModal] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [patientSearchTerm, setPatientSearchTerm] = useState('')

  const [formData, setFormData] = useState({
    patientId: '',
    patientName: '',
    patientAge: '',
    patientGender: '',
    patientPhone: '',
    patientEmail: '',
    prescriptionDate: new Date().toISOString().split('T')[0],
    diagnosis: '',
    symptoms: '',
    medicines: [],
    instructions: '',
    followUpDate: '',
    status: 'active',
    notes: ''
  })

  // Fetch prescription data for editing
  const fetchPrescriptionData = useCallback(async () => {
    if (!id) return
    
    setInitialLoading(true)
    try {
      // First try to fetch as prescription
      const prescriptionRef = doc(db, 'prescriptions', id)
      const prescriptionSnap = await getDoc(prescriptionRef)
      
      if (prescriptionSnap.exists()) {
        const prescriptionData = prescriptionSnap.data()
        
        // This is edit mode - editing an existing prescription
        setIsEditMode(true)
        
        // Set form data
        setFormData({
          patientId: prescriptionData.patientId || '',
          patientName: prescriptionData.patientName || '',
          patientAge: prescriptionData.patientAge || '',
          patientGender: prescriptionData.patientGender || '',
          patientPhone: prescriptionData.patientPhone || '',
          patientEmail: prescriptionData.patientEmail || '',
          prescriptionDate: prescriptionData.prescriptionDate || new Date().toISOString().split('T')[0],
          diagnosis: prescriptionData.diagnosis || '',
          symptoms: prescriptionData.symptoms || '',
          medicines: prescriptionData.medicines || [],
          instructions: prescriptionData.instructions || '',
          followUpDate: prescriptionData.followUpDate || '',
          status: prescriptionData.status || 'active',
          notes: prescriptionData.notes || ''
        })

        toast.success('Prescription data loaded successfully')
      } else {
        // If not a prescription, try to fetch as appointment
        const appointmentRef = doc(db, 'appointments', id)
        const appointmentSnap = await getDoc(appointmentRef)
        
        if (appointmentSnap.exists()) {
          const appointmentData = appointmentSnap.data()
          
          // This is create mode - creating a new prescription from appointment
          setIsEditMode(false)
          
          // Pre-fill form with appointment data
          setFormData(prev => ({
            ...prev,
            patientId: appointmentData.id,
            patientName: appointmentData.patientName || '',
            patientAge: appointmentData.patientAge || '',
            patientGender: appointmentData.patientGender || '',
            patientPhone: appointmentData.patientPhone || '',
            patientEmail: appointmentData.patientEmail || '',
            symptoms: appointmentData.symptoms || '',
            notes: appointmentData.notes || ''
          }))

          toast.success(`Patient data loaded from appointment: ${appointmentData.patientName}`)
        } else {
          toast.error('Prescription or appointment not found')
          navigate('/doctor/prescriptions')
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Error loading data')
      navigate('/doctor/prescriptions')
    } finally {
      setInitialLoading(false)
    }
  }, [id, navigate])

  // Check if we're in edit mode and fetch data
  useEffect(() => {
    if (id) {
      // Check if this is a prescription ID (edit mode) or appointment ID (new prescription)
      fetchPrescriptionData()
    }
  }, [id, fetchPrescriptionData])

  // Fetch patients and medicines
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch registered patients from patients collection
        const patientsRef = collection(db, 'patients')
        const patientsQuery = query(patientsRef, orderBy('createdAt', 'desc'))
        
        const unsubscribePatients = onSnapshot(patientsQuery, (snapshot) => {
          const registeredPatients = snapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().fullName,
            age: doc.data().dateOfBirth ? (() => {
              const today = new Date()
              const birthDate = new Date(doc.data().dateOfBirth)
              let age = today.getFullYear() - birthDate.getFullYear()
              const monthDiff = today.getMonth() - birthDate.getMonth()
              if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--
              }
              return age.toString()
            })() : '',
            gender: doc.data().gender,
            phone: doc.data().phone,
            email: doc.data().email,
            patientId: doc.data().patientId,
            ...doc.data()
          }))
          
          // Also fetch patients from appointments (for backward compatibility)
          const appointmentsRef = collection(db, 'appointments')
          const appointmentsQuery = query(appointmentsRef, orderBy('createdAt', 'desc'))
          getDocs(appointmentsQuery).then(appointmentsSnapshot => {
            const uniquePatients = [...registeredPatients]
            const patientMap = new Map()
            
            registeredPatients.forEach(p => {
              patientMap.set(p.phone, p)
            })
            
            appointmentsSnapshot.docs.forEach(doc => {
              const appointment = doc.data()
              if (!patientMap.has(appointment.patientPhone)) {
                patientMap.set(appointment.patientPhone, {
                  id: `apt-${doc.id}`,
                  name: appointment.patientName,
                  age: appointment.patientAge,
                  gender: appointment.patientGender,
                  phone: appointment.patientPhone,
                  email: appointment.patientEmail,
                  lastVisit: appointment.appointmentDate
                })
                uniquePatients.push(patientMap.get(appointment.patientPhone))
              }
            })
            
            setPatients(uniquePatients)
            setFilteredPatients(uniquePatients)
          })
        })

        // Fetch medicines
        const medicinesRef = collection(db, 'medicines')
        const medicinesQuery = query(medicinesRef, orderBy('name', 'asc'))
        
        const unsubscribe = onSnapshot(medicinesQuery, (snapshot) => {
          const medicinesData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          setMedicines(medicinesData)
          setFilteredMedicines(medicinesData)
        })

        return () => unsubscribePatients()
      } catch (error) {
        console.error('Error fetching data:', error)
        toast.error('Error loading data')
      }
    }

    fetchData()
  }, [])

  // Filter medicines based on search
  useEffect(() => {
    if (searchTerm) {
      const filtered = medicines.filter(medicine =>
        medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        medicine.category.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredMedicines(filtered)
    } else {
      setFilteredMedicines(medicines)
    }
  }, [searchTerm, medicines])

  // Filter patients based on search
  useEffect(() => {
    if (patientSearchTerm) {
      const filtered = patients.filter(patient =>
        patient.name.toLowerCase().includes(patientSearchTerm.toLowerCase()) ||
        patient.phone.includes(patientSearchTerm) ||
        patient.email.toLowerCase().includes(patientSearchTerm.toLowerCase())
      )
      setFilteredPatients(filtered)
    } else {
      setFilteredPatients(patients)
    }
  }, [patientSearchTerm, patients])

  // Handle click outside medicine dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (medicineDropdownRef.current && !medicineDropdownRef.current.contains(event.target)) {
        setShowMedicineDropdown(false)
        setSearchTerm('')
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShowMedicineDropdown(false)
        setShowPatientModal(false)
        setSearchTerm('')
        setPatientSearchTerm('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient)
    setFormData(prev => ({
      ...prev,
      patientId: patient.id,
      patientName: patient.name || patient.fullName,
      patientAge: patient.age || (patient.dateOfBirth ? (() => {
        const today = new Date()
        const birthDate = new Date(patient.dateOfBirth)
        let age = today.getFullYear() - birthDate.getFullYear()
        const monthDiff = today.getMonth() - birthDate.getMonth()
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--
        }
        return age.toString()
      })() : ''),
      patientGender: patient.gender,
      patientPhone: patient.phone,
      patientEmail: patient.email,
      symptoms: patient.medicalHistory || prev.symptoms,
      notes: patient.notes || prev.notes
    }))
    setShowPatientModal(false)
    setPatientSearchTerm('')
    toast.success(`Selected patient: ${patient.name || patient.fullName}`)
  }

  const handleAddMedicine = (medicine) => {
    const existingMedicine = formData.medicines.find(m => m.id === medicine.id)
    
    if (existingMedicine) {
      toast.error('Medicine already added')
      return
    }

    const newMedicine = {
      id: medicine.id,
      name: medicine.name,
      category: medicine.category,
      dosage: '',
      frequency: '',
      duration: '',
      timing: 'after_meal',
      specialInstructions: ''
    }

    setFormData(prev => ({
      ...prev,
      medicines: [...prev.medicines, newMedicine]
    }))
    
    setShowMedicineDropdown(false)
    setSearchTerm('')
    toast.success(`Added ${medicine.name}`)
  }

  const handleRemoveMedicine = (medicineId) => {
    setFormData(prev => ({
      ...prev,
      medicines: prev.medicines.filter(m => m.id !== medicineId)
    }))
    toast.success('Medicine removed')
  }

  const handleMedicineChange = (medicineId, field, value) => {
    setFormData(prev => ({
      ...prev,
      medicines: prev.medicines.map(medicine =>
        medicine.id === medicineId
          ? { ...medicine, [field]: value }
          : medicine
      )
    }))
  }

  const validateForm = () => {
    if (!formData.patientName.trim()) {
      toast.error('Please select a patient')
      return false
    }
    if (!formData.diagnosis.trim()) {
      toast.error('Please enter diagnosis')
      return false
    }
    if (formData.medicines.length === 0) {
      toast.error('Please add at least one medicine')
      return false
    }
    
    // Validate medicine details
    for (const medicine of formData.medicines) {
      if (!medicine.dosage.trim()) {
        toast.error(`Please enter dosage for ${medicine.name}`)
        return false
      }
      if (!medicine.frequency.trim()) {
        toast.error(`Please enter frequency for ${medicine.name}`)
        return false
      }
      if (!medicine.duration.trim()) {
        toast.error(`Please enter duration for ${medicine.name}`)
        return false
      }
    }
    
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setLoading(true)
    
    try {
      const prescriptionData = {
        ...formData,
        patientId: selectedPatient?.id || formData.patientId || '',
        doctorName: currentUser.displayName || 'Unknown Doctor',
        doctorId: currentUser.uid,
        updatedAt: new Date().toISOString()
      }

      if (isEditMode) {
        // Update existing prescription
        const prescriptionRef = doc(db, 'prescriptions', id)
        await updateDoc(prescriptionRef, prescriptionData)
        toast.success('Prescription updated successfully!')
      } else {
        // Create new prescription
        prescriptionData.createdAt = new Date().toISOString()
        await addDoc(collection(db, 'prescriptions'), prescriptionData)
        toast.success('Prescription created successfully!')
      }
      
      navigate('/doctor/prescriptions')
    } catch (error) {
      console.error('Error saving prescription:', error)
      toast.error(`Error saving prescription: ${error.message}`)
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
            <div className="stat-card-icon stat-card-icon-secondary">
              <FileText className="icon-lg" />
            </div>
            <div>
              <h1 className="nav-bar-title">{isEditMode ? 'Edit Prescription' : 'Create Prescription'}</h1>
              <p className="text-sm text-slate-400">
                {isEditMode ? 'Update prescription details' : id ? 'Create prescription from appointment' : 'Write a new prescription for patient'}
              </p>
            </div>
          </div>
          <div className='flex items-center gap-2'>

            <Link 
              to="/doctor/prescriptions"
              className="btn-outline btn-md rounded-lg justify-cneter flex items-center gap-2"
            >
              <ArrowLeft className="icon-sm" />
              <span>Back to Prescriptions</span>
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
              <p className="text-muted">Loading prescription data...</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="form-container">
            {/* Patient Selection */}
            <div className="card">
              <h2 className="text-heading text-lg mb-4 flex items-center gap-2">
                <User className="icon-md text-primary-500" />
                <span>Patient Information</span>
              </h2>
              
              <div className="mb-4 p-4 bg-primary-50 border border-primary-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <label className="form-label">Select Registered Patient</label>
                  <Link
                    to="/receptionist/patients/create"
                    target="_blank"
                    className="btn-outline-primary rounded-lg btn-sm flex items-center gap-2"
                  >
                    <UserPlus className="icon-sm" />
                    <span>Register New</span>
                  </Link>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Search for registered patient..."
                    value={selectedPatient ? (selectedPatient.name || selectedPatient.fullName) : patientSearchTerm}
                    onChange={(e) => {
                      setPatientSearchTerm(e.target.value)
                      if (selectedPatient) setSelectedPatient(null)
                    }}
                    onFocus={() => setShowPatientModal(true)}
                    className="search-input form-input  flex-1"
                  />
                  {selectedPatient && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPatient(null)
                        setFormData(prev => ({
                          ...prev,
                          patientId: '',
                          patientName: '',
                          patientAge: '',
                          patientGender: '',
                          patientPhone: '',
                          patientEmail: ''
                        }))
                      }}
                      className="btn-icon btn-ghost"
                    >
                      <X className="icon-sm" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowPatientModal(true)}
                    className="btn-primary btn-md rounded-lg flex items-center gap-2"
                  >
                    <Search className="icon-sm" />
                    <span>Search</span>
                  </button>
                </div>
                {showPatientModal && (
                  <div className="mt-2 max-h-60 overflow-y-auto card border-2 border-primary-200">
                    {filteredPatients.length > 0 ? (
                      filteredPatients.map((patient) => (
                        <button
                          key={patient.id}
                          type="button"
                          onClick={() => handlePatientSelect(patient)}
                          className="w-full px-4 py-3 text-left hover:bg-primary-50 border-b border-slate-100 last:border-b-0 transition-colors"
                        >
                          <div className="font-medium text-heading">{patient.name || patient.fullName}</div>
                          <div className="text-sm text-muted">
                            {patient.phone} • {patient.patientId || patient.id.slice(0, 8).toUpperCase()}
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-muted text-center">
                        {patientSearchTerm ? 'No patients found.' : 'No registered patients.'}
                      </div>
                    )}
                  </div>
                )}
                <p className="form-help mt-2">Or enter patient details manually below</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label form-label-required">Patient Name</label>
                  <input
                    type="text"
                    value={formData.patientName}
                    onChange={(e) => setFormData(prev => ({ ...prev, patientName: e.target.value }))}
                    className="form-input"
                    placeholder="Enter patient name"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label form-label-required">Prescription Date</label>
                  <input
                    type="date"
                    value={formData.prescriptionDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, prescriptionDate: e.target.value }))}
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Patient Age</label>
                  <input
                    type="text"
                    value={formData.patientAge}
                    onChange={(e) => setFormData(prev => ({ ...prev, patientAge: e.target.value }))}
                    className="form-input"
                    placeholder="Age"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Patient Gender</label>
                  <select
                    value={formData.patientGender}
                    onChange={(e) => setFormData(prev => ({ ...prev, patientGender: e.target.value }))}
                    className=" form-input"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.patientPhone}
                    onChange={(e) => setFormData(prev => ({ ...prev, patientPhone: e.target.value }))}
                    className="form-input"
                    placeholder="Phone number"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    value={formData.patientEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, patientEmail: e.target.value }))}
                    className="form-input"
                    placeholder="Email address"
                  />
                </div>
              </div>
            </div>

            {/* Diagnosis and Symptoms */}
            <div className="card">
              <h2 className="text-heading text-lg mb-4 flex items-center gap-2">
                <AlertTriangle className="icon-md text-accent-amber-500" />
                <span>Diagnosis & Symptoms</span>
              </h2>
              
              <div className="space-y-4">
                <div className="form-group">
                  <label className="form-label form-label-required">Diagnosis</label>
                  <textarea
                    value={formData.diagnosis}
                    onChange={(e) => setFormData(prev => ({ ...prev, diagnosis: e.target.value }))}
                    className="form-textarea  rounded-lg form-input"
                    rows="3"
                    placeholder="Enter diagnosis..."
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Symptoms</label>
                  <textarea
                    value={formData.symptoms}
                    onChange={(e) => setFormData(prev => ({ ...prev, symptoms: e.target.value }))}
                    className="form-textarea rounded-lg form-input"
                    rows="3"
                    placeholder="Enter symptoms..."
                  />
                </div>
              </div>
            </div>

            {/* Medicines */}
            <div className="card">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-heading text-lg flex items-center gap-2">
                  <Pill className="icon-md text-secondary-500 rounded-lg" />
                  <span>Medicines ({formData.medicines.length})</span>
                </h2>
                
                <button
                  type="button"
                  onClick={() => setShowMedicineDropdown(!showMedicineDropdown)}
                  className="btn-secondary rounded-lg btn-md flex items-center gap-2"
                >
                  <Plus className="icon-sm" />
                  <span>Add Medicine</span>
                </button>
              </div>
              
              {/* Medicine Search Dropdown */}
              {showMedicineDropdown && (
                <div className="mb-4" ref={medicineDropdownRef}>
                  <input
                    type="text"
                    placeholder="Search medicines..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    className="search-input rounded-lg form-input"
                    autoFocus
                  />
                  
                  <div className="mt-2 max-h-60 overflow-y-auto card border-2 border-primary-200">
                    {filteredMedicines.length > 0 ? (
                      filteredMedicines.map((medicine) => (
                        <button
                          key={medicine.id}
                          type="button"
                          onClick={() => handleAddMedicine(medicine)}
                          className="w-full  px-4 py-3 text-left hover:bg-primary-50 border-b border-slate-100 last:border-b-0 transition-colors"
                        >
                          <div className="font-medium text-heading">{medicine.name}</div>
                          <div className="text-sm text-muted">
                            {medicine.category} • {medicine.strength} • {medicine.form}
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-muted text-center">
                        {searchTerm ? 'No medicines found matching your search.' : 'No medicines available. Add medicines first.'}
                      </div>
                    )}
                  </div>
                </div>
              )}
            
              {/* Added Medicines */}
              <div className="space-y-4">
                {formData.medicines.map((medicine) => (
                  <div key={medicine.id} className="card border-2 border-secondary-100">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-heading  font-semibold">{medicine.name}</h3>
                        <p className="text-sm text-muted">{medicine.category}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveMedicine(medicine.id)}
                        className="btn-icon btn-ghost text-error hover:text-error"
                      >
                        <X className="icon-md" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div className="form-group">
                        <label className="form-label form-label-required">Dosage</label>
                        <input
                          type="text"
                          value={medicine.dosage}
                          onChange={(e) => handleMedicineChange(medicine.id, 'dosage', e.target.value)}
                          className=" text-sm form-input"
                          placeholder="e.g., 500mg"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label className="form-label form-label-required">Frequency</label>
                        <input
                          type="text"
                          value={medicine.frequency}
                          onChange={(e) => handleMedicineChange(medicine.id, 'frequency', e.target.value)}
                          className=" text-sm form-input"
                          placeholder="e.g., Twice daily"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label className="form-label form-label-required">Duration</label>
                        <input
                          type="text"
                          value={medicine.duration}
                          onChange={(e) => handleMedicineChange(medicine.id, 'duration', e.target.value)}
                          className=" text-sm form-input"
                          placeholder="e.g., 7 days"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label className="form-label">Timing</label>
                        <select
                          value={medicine.timing}
                          onChange={(e) => handleMedicineChange(medicine.id, 'timing', e.target.value)}
                          className=" form-input text-sm"
                        >
                          <option value="after_meal">After Meal</option>
                          <option value="before_meal">Before Meal</option>
                          <option value="empty_stomach">Empty Stomach</option>
                          <option value="bedtime">Bedtime</option>
                          <option value="as_needed">As Needed</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="mt-3 form-group">
                      <label className="form-label">Special Instructions</label>
                      <input
                        type="text"
                        value={medicine.specialInstructions}
                        onChange={(e) => handleMedicineChange(medicine.id, 'specialInstructions', e.target.value)}
                        className=" text-sm form-input"
                        placeholder="Any special instructions..."
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Instructions and Follow-up */}
            <div className="card">
              <h2 className="text-heading text-lg mb-4 flex items-center gap-2">
                <CheckCircle className="icon-md text-primary-500" />
                <span>Instructions & Follow-up</span>
              </h2>
              
              <div className="space-y-4">
                <div className="form-group">
                  <label className="form-label">General Instructions</label>
                  <textarea
                    value={formData.instructions}
                    onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
                    className="form-textarea rounded-lg form-input"
                    rows="3"
                    placeholder="General instructions for the patient..."
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Follow-up Date</label>
                    <input
                      type="date"
                      value={formData.followUpDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, followUpDate: e.target.value }))}
                      className="form-input rounded-lg"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                      className="form-select rounded-lg form-input"
                    >
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="discontinued">Discontinued</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Additional Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    className="form-textarea rounded-lg form-input"
                    rows="3"
                    placeholder="Any additional notes..."
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-4">
              <Link
                to="/doctor/prescriptions"
                className="btn-outline rounded-lg btn-md"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="btn-secondary rounded-lg btn-md flex items-center gap-2"
              >
                {loading ? (
                  <div className="spinner w-4 h-4"></div>
                ) : (
                  <Save className="icon-sm" />
                )}
                <span>{loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Prescription' : 'Create Prescription')}</span>
              </button>
            </div>
          </form>
        )}
      </main>

      {/* Patient Selection Modal */}
      {showPatientModal && (
        <div className="modal-overlay">
          <div className="modal-container max-w-2xl">
            {/* Modal Header */}
            <div className="modal-header">
              <h2 className="modal-title">Select Patient</h2>
              <button
                onClick={() => {
                  setShowPatientModal(false)
                  setPatientSearchTerm('')
                }}
                className="btn-icon rounded-lg btn-ghost"
              >
                <X className="icon-lg" />
              </button>
            </div>

            {/* Search Input */}
            <div className="modal-body border-b border-slate-200">
              <input
                type="text"
                placeholder="Search patients by name, phone, or email..."
                value={patientSearchTerm}
                onChange={(e) => setPatientSearchTerm(e.target.value)}
                className="search-input form-input"
                autoFocus
              />
            </div>

            {/* Patient List */}
            <div className="modal-body overflow-y-auto max-h-96">
              {filteredPatients.length > 0 ? (
                filteredPatients.map((patient) => (
                  <button
                    key={patient.id}
                    onClick={() => handlePatientSelect(patient)}
                    className="w-full p-4 text-left hover:bg-primary-50 border-b border-slate-100 last:border-b-0 transition-colors rounded-lg"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="text-heading text-lg font-semibold">{patient.name}</div>
                        <div className="text-muted mt-1">
                          {patient.age} years, {patient.gender} • {patient.phone}
                        </div>
                        {patient.email && (
                          <div className="text-muted text-sm mt-1">{patient.email}</div>
                        )}
                        <div className="text-muted text-sm mt-1">
                          Last visit: {patient.lastVisit}
                        </div>
                      </div>
                      <div className="text-primary-500">
                        <User className="icon-lg" />
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-8 text-center">
                  <div className="text-muted text-lg mb-2">
                    {patientSearchTerm ? 'No patients found matching your search.' : 'No patients available.'}
                  </div>
                  <div className="text-muted text-sm">
                    {patientSearchTerm ? 'Try a different search term.' : 'Create appointments first to see patients here.'}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="modal-footer">
              <button
                onClick={() => {
                  setShowPatientModal(false)
                  setPatientSearchTerm('')
                }}
                className="btn-outline rounded-lg btn-md"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
