import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { collection, addDoc, updateDoc, doc, getDoc, serverTimestamp, query, getDocs, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '../../../firebase/config'
import LogoutButton from '../../../components/LogoutButton'

import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Save, 
  User, 
  Phone, 
  Calendar,
  DollarSign,
  FileText,
  AlertCircle,
  Zap,
  Clock,
  CheckCircle,
  Search,
  Filter,
  X,
  UserPlus,
  Mail
} from 'lucide-react'

export default function CreateInvoice() {
  const navigate = useNavigate()
  const { id } = useParams() // Get invoice ID if editing
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [patients, setPatients] = useState([])
  const [filteredPatients, setFilteredPatients] = useState([])
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [showPatientModal, setShowPatientModal] = useState(false)
  const [patientSearchTerm, setPatientSearchTerm] = useState('')
  const [showQuickServices, setShowQuickServices] = useState(false)
  const [errors, setErrors] = useState({})
  
  // Predefined common services for quick selection
  const commonServices = [
    { description: 'Consultation Fee', unitPrice: 500, category: 'consultation' },
    { description: 'Follow-up Consultation', unitPrice: 300, category: 'consultation' },
    { description: 'Emergency Consultation', unitPrice: 800, category: 'consultation' },
    { description: 'Blood Test', unitPrice: 400, category: 'lab' },
    { description: 'X-Ray', unitPrice: 600, category: 'imaging' },
    { description: 'ECG', unitPrice: 350, category: 'cardiology' },
    { description: 'Ultrasound', unitPrice: 1200, category: 'imaging' },
    { description: 'Dental Cleaning', unitPrice: 800, category: 'dental' },
    { description: 'Dental Filling', unitPrice: 1500, category: 'dental' },
    { description: 'Physiotherapy Session', unitPrice: 700, category: 'therapy' },
    { description: 'Medicine Dispensing', unitPrice: 200, category: 'pharmacy' },
    { description: 'Suturing', unitPrice: 1000, category: 'procedure' },
    { description: 'Dressing Change', unitPrice: 300, category: 'procedure' },
    { description: 'Injection', unitPrice: 150, category: 'procedure' },
    { description: 'Vaccination', unitPrice: 400, category: 'vaccination' }
  ]
  
  const [invoiceData, setInvoiceData] = useState({
    patientId: '',
    patientName: '',
    patientPhone: '',
    patientEmail: '',
    patientAddress: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    items: [
      {
        description: '',
        quantity: 1,
        unitPrice: 0,
        amount: 0
      }
    ],
    subtotal: 0,
    taxRate: 18,
    taxAmount: 0,
    discount: 0,
    totalAmount: 0,
    notes: '',
    terms: 'Payment due within 7 days of invoice date.',
    status: 'pending'
  })

  const patientDropdownRef = useRef(null)

  // Fetch patients and services on component mount
  useEffect(() => {
    // Fetch registered patients from patients collection
    const patientsRef = collection(db, 'patients')
    const patientsQuery = query(patientsRef, orderBy('createdAt', 'desc'))
    
    const unsubscribePatients = onSnapshot(patientsQuery, (snapshot) => {
      const registeredPatients = snapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          name: data.fullName,
          fullName: data.fullName,
          age: data.dateOfBirth ? (() => {
            const today = new Date()
            const birthDate = new Date(data.dateOfBirth)
            let age = today.getFullYear() - birthDate.getFullYear()
            const monthDiff = today.getMonth() - birthDate.getMonth()
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
              age--
            }
            return age.toString()
          })() : '',
          gender: data.gender,
          phone: data.phone,
          email: data.email,
          address: data.address || '',
          patientId: data.patientId,
          ...data
        }
      })
      
      // Also fetch from appointments for backward compatibility
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
              phone: appointment.patientPhone,
              email: appointment.patientEmail,
              address: appointment.patientAddress || '',
              age: appointment.patientAge || '',
              gender: appointment.patientGender || '',
              lastVisit: appointment.appointmentDate
            })
            uniquePatients.push(patientMap.get(appointment.patientPhone))
          }
        })
        
        setPatients(uniquePatients)
        setFilteredPatients(uniquePatients)
      })
    }, (error) => {
      console.error('Error fetching patients:', error)
    })

    return () => unsubscribePatients()
  }, [])

  // Filter patients based on search
  useEffect(() => {
    if (patientSearchTerm) {
      const filtered = patients.filter(patient =>
        (patient.name || patient.fullName)?.toLowerCase().includes(patientSearchTerm.toLowerCase()) ||
        patient.phone?.includes(patientSearchTerm) ||
        patient.email?.toLowerCase().includes(patientSearchTerm.toLowerCase()) ||
        patient.patientId?.toLowerCase().includes(patientSearchTerm.toLowerCase())
      )
      setFilteredPatients(filtered)
    } else {
      setFilteredPatients(patients)
    }
  }, [patientSearchTerm, patients])

  // Handle click outside patient modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (patientDropdownRef.current && !patientDropdownRef.current.contains(event.target)) {
        setShowPatientModal(false)
        setPatientSearchTerm('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Load existing invoice data for editing
  const loadInvoiceData = useCallback(async () => {
    try {
      const invoiceDoc = await getDoc(doc(db, 'invoices', id))
      if (invoiceDoc.exists()) {
        const invoiceData = invoiceDoc.data()
        
        // Set invoice data
        setInvoiceData({
          ...invoiceData,
          invoiceDate: invoiceData.invoiceDate ? new Date(invoiceData.invoiceDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          dueDate: invoiceData.dueDate ? new Date(invoiceData.dueDate).toISOString().split('T')[0] : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        })
        
        // Set selected patient
        if (invoiceData.patientId) {
          setSelectedPatient({
            id: invoiceData.patientId,
            name: invoiceData.patientName,
            phone: invoiceData.patientPhone,
            email: invoiceData.patientEmail,
            address: invoiceData.patientAddress,
            age: invoiceData.patientAge || '',
            gender: invoiceData.patientGender || ''
          })
        }
      }
    } catch (error) {
      console.error('Error loading invoice data:', error)
      alert('Error loading invoice data. Please try again.')
    }
  }, [id])

  useEffect(() => {
    // If we have an ID, we're editing an existing invoice
    if (id) {
      setIsEditing(true)
      loadInvoiceData()
    }
  }, [id, loadInvoiceData])

  // Calculate invoice totals
  useEffect(() => {
    const subtotal = invoiceData.items.reduce((sum, item) => sum + (item.amount || 0), 0)
    const taxAmount = (subtotal * invoiceData.taxRate) / 100
    const totalAmount = subtotal + taxAmount - invoiceData.discount

    setInvoiceData(prev => ({
      ...prev,
      subtotal,
      taxAmount,
      totalAmount
    }))
  }, [invoiceData.items, invoiceData.taxRate, invoiceData.discount])

  // Handle patient selection from modal
  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient)
    setInvoiceData(prev => ({
      ...prev,
      patientId: patient.id,
      patientName: patient.name || patient.fullName || '',
      patientPhone: patient.phone || '',
      patientEmail: patient.email || '',
      patientAddress: patient.address || ''
    }))
    setErrors(prev => ({ ...prev, patientName: '', patientPhone: '' }))
    setShowPatientModal(false)
    setPatientSearchTerm('')
  }

  // Quick add service from predefined list
  const quickAddService = (service) => {
    const newItem = {
      description: service.description,
      quantity: 1,
      unitPrice: service.unitPrice,
      amount: service.unitPrice
    }
    
    setInvoiceData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }))
    
    setShowQuickServices(false)
  }

  // Add multiple common services at once
  const addCommonServices = (category) => {
    const categoryServices = commonServices.filter(service => service.category === category)
    const newItems = categoryServices.map(service => ({
      description: service.description,
      quantity: 1,
      unitPrice: service.unitPrice,
      amount: service.unitPrice
    }))
    
    setInvoiceData(prev => ({
      ...prev,
      items: [...prev.items, ...newItems]
    }))
  }

  // Auto-fill based on appointment type (if available)
  const autoFillFromAppointment = () => {
    // This could be enhanced to pull from actual appointments
    const appointmentServices = [
      { description: 'Consultation Fee', unitPrice: 500, quantity: 1 },
      { description: 'Blood Test', unitPrice: 400, quantity: 1 },
      { description: 'Medicine Dispensing', unitPrice: 200, quantity: 1 }
    ]
    
    const newItems = appointmentServices.map(service => ({
      ...service,
      amount: service.unitPrice * service.quantity
    }))
    
    setInvoiceData(prev => ({
      ...prev,
      items: newItems
    }))
  }

  // Handle item changes
  const handleItemChange = (index, field, value) => {
    const newItems = [...invoiceData.items]
    newItems[index] = { ...newItems[index], [field]: value }
    
    // Calculate amount for this item
    if (field === 'quantity' || field === 'unitPrice') {
      const quantity = field === 'quantity' ? value : newItems[index].quantity
      const unitPrice = field === 'unitPrice' ? value : newItems[index].unitPrice
      newItems[index].amount = quantity * unitPrice
    }
    
    setInvoiceData(prev => ({ ...prev, items: newItems }))
  }

  // Add new item
  const addItem = () => {
    setInvoiceData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          description: '',
          quantity: 1,
          unitPrice: 0,
          amount: 0
        }
      ]
    }))
  }

  // Remove item
  const removeItem = (index) => {
    if (invoiceData.items.length > 1) {
      const newItems = invoiceData.items.filter((_, i) => i !== index)
      setInvoiceData(prev => ({ ...prev, items: newItems }))
    }
  }

  // Clear all items
  const clearAllItems = () => {
    setInvoiceData(prev => ({
      ...prev,
      items: [{
        description: '',
        quantity: 1,
        unitPrice: 0,
        amount: 0
      }]
    }))
  }

  // Clear individual error
  const clearError = (field, value) => {
    setInvoiceData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  // Handle form submission
  const validateForm = () => {
    const newErrors = {}
    
    if (!invoiceData.patientName?.trim()) {
      newErrors.patientName = 'Patient name is required'
    }
    
    if (!invoiceData.patientPhone?.trim()) {
      newErrors.patientPhone = 'Phone number is required'
    }

    if (invoiceData.items.some(item => !item.description?.trim())) {
      newErrors.items = 'All items must have a description'
    }

    if (invoiceData.items.some(item => item.amount <= 0)) {
      newErrors.items = 'All items must have an amount greater than zero'
    }

    if (invoiceData.dueDate < invoiceData.invoiceDate) {
      newErrors.dueDate = 'Due date cannot be before invoice date'
    }

    if (invoiceData.taxRate < 0) {
      newErrors.taxRate = 'Tax rate cannot be negative'
    }

    if (invoiceData.discount < 0) {
      newErrors.discount = 'Discount cannot be negative'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      const firstError = Object.values(errors)[0]
      if (typeof firstError === 'string') {
        // Just a fallback, validation UI will handle individual messages
      }
      return
    }

    setLoading(true)
    try {
      if (isEditing) {
        // Update existing invoice
        const invoiceToUpdate = {
          ...invoiceData,
          patientId: selectedPatient?.id || invoiceData.patientId || '',
          updatedAt: serverTimestamp()
        }
        
        await updateDoc(doc(db, 'invoices', id), invoiceToUpdate)
        alert('Invoice updated successfully!')
      } else {
        // Create new invoice
        const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`
        
        const invoiceToSave = {
          ...invoiceData,
          invoiceNumber,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }

        await addDoc(collection(db, 'invoices'), invoiceToSave)
        alert('Invoice created successfully!')
      }
      
      navigate('/receptionist/billing')
    } catch (error) {
      console.error('Error saving invoice:', error)
      alert(`Error ${isEditing ? 'updating' : 'creating'} invoice. Please try again.`)
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
              <h1 className="nav-bar-title">{isEditing ? 'Edit Invoice' : 'Create New Invoice'}</h1>
              <p className="text-sm text-slate-400">
                {isEditing ? 'Modify existing invoice details' : 'Generate invoice for patient services'}
              </p>
            </div>
          </div>
          <div className='flex items-center gap-2'>
          <Link 
              to="/receptionist/billing"
              className="btn-outline-primary btn-md  rounded-lg flex items-center gap-2"
            >
              <ArrowLeft className="icon-sm" />
              <span>Back to Billing</span>
            </Link>
          <LogoutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="page-container">
        <form onSubmit={handleSubmit} className="form-container">
          {/* Patient Information */}
          <div className="card">
            <h2 className="text-heading text-lg mb-4 flex items-center gap-2">
              <User className="icon-md text-primary-500" />
              <span>Patient Information</span>
            </h2>
            
            <div className="mb-6 p-4 bg-primary-50/50 border border-primary-100 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <label className="form-label font-semibold">Select Registered Patient</label>
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
                <div className="flex-1 relative" ref={patientDropdownRef}>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 icon-sm text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search by name, phone, or patient ID..."
                      value={selectedPatient ? (selectedPatient.name || selectedPatient.fullName) : patientSearchTerm}
                      onChange={(e) => {
                        setPatientSearchTerm(e.target.value)
                        if (selectedPatient) setSelectedPatient(null)
                      }}
                      onFocus={() => setShowPatientModal(true)}
                      className="form-input pl-10"
                    />
                  </div>
                  {selectedPatient && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPatient(null)
                        setInvoiceData(prev => ({
                          ...prev,
                          patientId: '',
                          patientName: '',
                          patientPhone: '',
                          patientEmail: '',
                          patientAddress: ''
                        }))
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 btn-icon btn-ghost"
                    >
                      <X className="icon-sm" />
                    </button>
                  )}
                  {showPatientModal && (
                    <div className="absolute z-50 w-full mt-2 max-h-60 overflow-y-auto card border-2 border-primary-100 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
                      {filteredPatients.length > 0 ? (
                        filteredPatients.map((patient) => (
                          <button
                            key={patient.id}
                            type="button"
                            onClick={() => handlePatientSelect(patient)}
                            className="w-full px-4 py-3 text-left hover:bg-primary-50 border-b border-slate-100 last:border-b-0 transition-colors group"
                          >
                            <div className="font-medium text-heading group-hover:text-primary-600">{patient.name || patient.fullName}</div>
                            <div className="text-sm text-muted">
                              {patient.phone} • {patient.patientId || patient.id.slice(0, 8).toUpperCase()}
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-8 text-center">
                          <p className="text-muted mb-2">{patientSearchTerm ? 'No patients found.' : 'No registered patients.'}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-2 italic px-1">Tip: Search and select a patient to auto-fill registration data</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group">
                <label className="form-label form-label-required">Patient Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 icon-sm text-slate-400" />
                  <input
                    type="text"
                    required
                    value={invoiceData.patientName}
                    onChange={(e) => clearError('patientName', e.target.value)}
                    className={`form-input pl-11 ${errors.patientName ? '-error form-input-error' : ''}`}
                    placeholder="Enter patient name"
                  />
                </div>
                {errors.patientName && <p className="form-error">{errors.patientName}</p>}
              </div>

              <div className="form-group">
                <label className="form-label form-label-required">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 icon-sm text-slate-400" />
                  <input
                    type="tel"
                    required
                    value={invoiceData.patientPhone}
                    onChange={(e) => clearError('patientPhone', e.target.value)}
                    className={`form-input pl-11 ${errors.patientPhone ? '-error form-input-error' : ''}`}
                    placeholder="Enter phone number"
                  />
                </div>
                {errors.patientPhone && <p className="form-error">{errors.patientPhone}</p>}
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 icon-sm text-slate-400" />
                  <input
                    type="email"
                    value={invoiceData.patientEmail}
                    onChange={(e) => clearError('patientEmail', e.target.value)}
                    className={`form-input pl-11 ${errors.email ? '-error form-input-error' : ''}`}
                    placeholder="Enter email address"
                  />
                </div>
                {errors.email && <p className="form-error">{errors.email}</p>}
              </div>

              <div className="form-group">
                <label className="form-label">Address</label>
                <div className="relative">
                  <FileText className="absolute left-3.5 top-3 icon-sm text-slate-400" />
                  <textarea
                    value={invoiceData.patientAddress}
                    onChange={(e) => clearError('patientAddress', e.target.value)}
                    className={`form-input pl-11 ${errors.address ? '-error form-input-error' : ''}`}
                    rows="1"
                    placeholder="Enter patient address"
                  />
                </div>
                {errors.address && <p className="form-error">{errors.address}</p>}
              </div>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="card">
            <h2 className="text-heading text-lg mb-4 flex items-center gap-2">
              <Calendar className="icon-md text-indigo-500" />
              <span>Invoice Settings</span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group">
                <label className="form-label">Invoice Date</label>
                <input
                  type="date"
                  value={invoiceData.invoiceDate}
                  onChange={(e) => clearError('invoiceDate', e.target.value)}
                  className={`form-input ${errors.invoiceDate ? '-error form-input-error' : ''}`}
                />
                {errors.invoiceDate && <p className="form-error">{errors.invoiceDate}</p>}
              </div>

              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input
                  type="date"
                  value={invoiceData.dueDate}
                  onChange={(e) => clearError('dueDate', e.target.value)}
                  className={`form-input ${errors.dueDate ? '-error form-input-error' : ''}`}
                />
                {errors.dueDate && <p className="form-error">{errors.dueDate}</p>}
              </div>
            </div>
          </div>

          {/* Quick Service Selection */}
          <div className="card">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-heading text-lg flex items-center gap-2">
                <Zap className="icon-md text-accent-amber-500" />
                <span>Quick Services</span>
              </h2>
              <button
                type="button"
                onClick={() => setShowQuickServices(!showQuickServices)}
                className="btn-outline-primary btn-sm rounded-lg flex items-center gap-2"
              >
                <Filter className="icon-sm" />
                <span>{showQuickServices ? 'Hide Library' : 'Open Library'}</span>
              </button>
            </div>

            {showQuickServices && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Category-based quick add buttons */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button
                    type="button"
                    onClick={() => addCommonServices('consultation')}
                    className="btn-outline-primary text-xs py-2 rounded-lg"
                  >
                    + Consultation
                  </button>
                  <button
                    type="button"
                    onClick={() => addCommonServices('lab')}
                    className="btn-outline-secondary text-xs py-2 rounded-lg"
                  >
                    + Lab Tests
                  </button>
                  <button
                    type="button"
                    onClick={() => addCommonServices('imaging')}
                    className="btn-outline-indigo text-xs py-2 rounded-lg"
                  >
                    + Imaging
                  </button>
                  <button
                    type="button"
                    onClick={() => addCommonServices('dental')}
                    className="btn-outline-primary text-xs py-2 rounded-lg"
                  >
                    + Dental
                  </button>
                </div>

                {/* Auto-fill from appointment */}
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={autoFillFromAppointment}
                    className="btn-secondary px-8 py-3 rounded-xl flex items-center gap-3 shadow-lg shadow-primary-100 hover:shadow-primary-200 transition-all active:scale-95"
                  >
                    <Clock className="icon-sm" />
                    <span className="font-semibold">Auto-fill from Appointment</span>
                  </button>
                </div>

                {/* Individual service selection */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 max-h-60 overflow-y-auto p-1">
                  {commonServices.map((service, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => quickAddService(service)}
                      className="flex flex-col items-start p-3 bg-white border border-slate-200 rounded-xl hover:border-primary-400 hover:shadow-md transition-all text-left"
                    >
                      <span className="font-medium text-sm text-heading truncate w-full">{service.description}</span>
                      <span className="text-xs text-primary-600 font-bold mt-1">Rs.{service.unitPrice}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {!showQuickServices && (
              <div className="text-center py-4 text-slate-400 text-sm italic">
                Open library to quickly add predefined services
              </div>
            )}
          </div>

          {/* Invoice Items */}
          <div className="card">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-heading text-lg flex items-center gap-2">
                <DollarSign className="icon-md text-emerald-500" />
                <span>Invoice Items</span>
              </h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={clearAllItems}
                  className="btn-ghost text-error btn-sm rounded-lg"
                >
                  Clear All
                </button>
                <button
                  type="button"
                  onClick={addItem}
                  className="btn-primary btn-sm rounded-lg flex items-center gap-2"
                >
                  <Plus className="icon-sm" />
                  <span>Add Manual Item</span>
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {errors.items && <p className="form-error bg-error/5 p-3 rounded-lg flex items-center gap-2 mb-4 animate-in fade-in slide-in-from-top-1 duration-300">
                <AlertCircle className="icon-sm" />
                <span>{errors.items}</span>
              </p>}
              {invoiceData.items.map((item, index) => (
                <div key={index} className={`grid grid-cols-1 md:grid-cols-12 gap-4 items-end p-5 rounded-2xl border ${errors.items && (!item.description?.trim() || item.amount <= 0) ? 'border-error/30 bg-error/5' : 'border-slate-100 bg-slate-50/50'} hover:bg-white hover:shadow-sm transition-all group`}>
                  <div className="md:col-span-6 form-group">
                    <label className="form-label text-xs">Description *</label>
                    <input
                      type="text"
                      required
                      value={item.description}
                      onChange={(e) => {
                        handleItemChange(index, 'description', e.target.value)
                        if (errors.items) setErrors(prev => ({ ...prev, items: '' }))
                      }}
                      className={`form-input bg-white ${errors.items && !item.description?.trim() ? '-error form-input-error' : ''}`}
                      placeholder="Service or item description"
                    />
                  </div>

                  <div className="md:col-span-2 form-group">
                    <label className="form-label text-xs">Qty</label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                      className="form-input bg-white text-center"
                    />
                  </div>

                  <div className="md:col-span-2 form-group">
                    <label className="form-label text-xs">Unit Price</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">Rs.</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="form-input bg-white pl-8 text-right"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-1 form-group">
                    <label className="form-label text-xs">Amount</label>
                    <div className="h-[42px] flex items-center justify-end px-2 font-bold text-heading">
                      {item.amount?.toLocaleString()}
                    </div>
                  </div>

                  <div className="md:col-span-1 flex justify-center pb-1">
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      disabled={invoiceData.items.length === 1}
                      className="p-2 text-slate-300 hover:text-error hover:bg-error/10 rounded-xl transition-all disabled:opacity-0 group-hover:opacity-100"
                      title="Remove item"
                    >
                      <Trash2 className="icon-sm" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Invoice Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 card">
              <h2 className="text-heading text-lg mb-4">Notes & Terms</h2>
              <div className="space-y-4">
                <div className="form-group">
                  <label className="form-label">Invoice Notes</label>
                  <textarea
                    value={invoiceData.notes}
                    onChange={(e) => clearError('notes', e.target.value)}
                    rows="3"
                    className={`form-input ${errors.notes ? '-error form-input-error' : ''}`}
                    placeholder="Additional notes for the client..."
                  />
                  {errors.notes && <p className="form-error">{errors.notes}</p>}
                </div>
                <div className="form-group">
                  <label className="form-label">Terms & Conditions</label>
                  <textarea
                    value={invoiceData.terms}
                    onChange={(e) => clearError('terms', e.target.value)}
                    rows="2"
                    className={`form-input text-xs ${errors.terms ? '-error form-input-error' : ''}`}
                    placeholder="Terms of payment..."
                  />
                  {errors.terms && <p className="form-error">{errors.terms}</p>}
                </div>
              </div>
            </div>

            <div className="card border-primary-100 bg-primary-50/20">
              <h2 className="text-heading text-lg mb-6 pb-2 border-b border-white">Summary</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Subtotal</span>
                  <span className="font-semibold text-heading">Rs.{invoiceData.subtotal.toLocaleString()}</span>
                </div>

                <div className="form-group">
                  <div className="flex justify-between mb-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tax Rate (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={invoiceData.taxRate}
                      onChange={(e) => clearError('taxRate', parseFloat(e.target.value) || 0)}
                      className={`w-16 text-right font-bold transition-colors ${errors.taxRate ? 'text-error' : 'text-primary-600'} bg-transparent focus:outline-none`}
                    />
                  </div>
                  {errors.taxRate && <p className="text-[10px] text-error text-right font-medium -mt-1">{errors.taxRate}</p>}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted italic">Tax Amount</span>
                    <span className="text-heading">Rs.{invoiceData.taxAmount.toLocaleString()}</span>
                  </div>
                </div>

                <div className="form-group">
                  <div className="flex justify-between mb-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Discount (Rs.)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={invoiceData.discount}
                      onChange={(e) => clearError('discount', parseFloat(e.target.value) || 0)}
                      className={`w-24 text-right font-bold transition-colors ${errors.discount ? 'text-error' : 'text-error'} bg-transparent focus:outline-none`}
                    />
                  </div>
                  {errors.discount && <p className="text-[10px] text-error text-right font-medium -mt-1">{errors.discount}</p>}
                </div>

                <div className="pt-6 mt-6 border-t border-slate-200">
                  <div className="flex justify-between items-center">
                    <span className="text-heading font-bold text-lg">Total</span>
                    <span className="text-primary-600 font-black text-2xl">Rs.{invoiceData.totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-4 mt-8 pb-12">
            <button
              type="button"
              onClick={() => navigate('/receptionist/billing')}
              className="btn-outline btn-lg rounded-xl px-10"
            >
              Discard
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary btn-lg rounded-xl px-12 flex items-center gap-3 shadow-lg shadow-primary-500/20"
            >
              {loading ? (
                <>
                  <div className="spinner w-5 h-5 border-white"></div>
                  <span>{isEditing ? 'Updating...' : 'Creating...'}</span>
                </>
              ) : (
                <>
                  <Save className="icon-sm" />
                  <span>{isEditing ? 'Update Invoice' : 'Issue Invoice'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
