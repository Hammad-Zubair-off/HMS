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
  Save,
  X,
  AlertTriangle,
  CheckCircle,
  Package,
  Activity
} from 'lucide-react'
import { collection, onSnapshot, query, orderBy, doc, deleteDoc, addDoc, updateDoc } from 'firebase/firestore'
import { db } from '../../../firebase/config'

export default function Medicines() {
  const { currentUser } = useAuth()
  const [medicines, setMedicines] = useState([])
  const [filteredMedicines, setFilteredMedicines] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [loading, setLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedMedicine, setSelectedMedicine] = useState(null)

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    strength: '',
    form: '',
    manufacturer: '',
    description: '',
    sideEffects: '',
    contraindications: '',
    dosageInstructions: '',
    storageInstructions: '',
    price: '',
    stockQuantity: '',
    reorderLevel: '',
    isActive: true
  })

  // Fetch medicines
  useEffect(() => {
    if (!currentUser) return

    setLoading(true)

    const medicinesRef = collection(db, 'medicines')
    const q = query(medicinesRef, orderBy('name', 'asc'))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const medicinesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setMedicines(medicinesData)
      setFilteredMedicines(medicinesData)
      setLoading(false)

      if (medicinesData.length > 0) {
        toast.success(`Loaded ${medicinesData.length} medicines`)
      } else {
        toast.success('No medicines found')
      }
    }, (error) => {
      console.error('Error fetching medicines:', error)
      toast.error('Error loading medicines')
      setLoading(false)
    })

    return () => unsubscribe()
  }, [currentUser])

  useEffect(() => {
    let filtered = medicines

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(medicine =>
        medicine.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        medicine.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        medicine.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by category
    if (filterCategory !== 'all') {
      filtered = filtered.filter(medicine => medicine.category === filterCategory)
    }

    setFilteredMedicines(filtered)
  }, [medicines, searchTerm, filterCategory])

  const handleCreateMedicine = () => {
    setFormData({
      name: '',
      category: '',
      strength: '',
      form: '',
      manufacturer: '',
      description: '',
      sideEffects: '',
      contraindications: '',
      dosageInstructions: '',
      storageInstructions: '',
      price: '',
      stockQuantity: '',
      reorderLevel: '',
      isActive: true
    })
    setShowCreateModal(true)
  }

  const handleEditMedicine = (medicine) => {
    setSelectedMedicine(medicine)
    setFormData({
      name: medicine.name || '',
      category: medicine.category || '',
      strength: medicine.strength || '',
      form: medicine.form || '',
      manufacturer: medicine.manufacturer || '',
      description: medicine.description || '',
      sideEffects: medicine.sideEffects || '',
      contraindications: medicine.contraindications || '',
      dosageInstructions: medicine.dosageInstructions || '',
      storageInstructions: medicine.storageInstructions || '',
      price: medicine.price || '',
      stockQuantity: medicine.stockQuantity || '',
      reorderLevel: medicine.reorderLevel || '',
      isActive: medicine.isActive !== false
    })
    setShowEditModal(true)
  }

  const handleDeleteMedicine = async (medicineId) => {
    if (window.confirm('Are you sure you want to delete this medicine? This action cannot be undone.')) {
      try {
        await deleteDoc(doc(db, 'medicines', medicineId))
        toast.success('Medicine deleted successfully!')
      } catch (error) {
        console.error('Error deleting medicine:', error)
        toast.error(`Error deleting medicine: ${error.message}`)
      }
    }
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error('Please enter medicine name')
      return false
    }
    if (!formData.category.trim()) {
      toast.error('Please select category')
      return false
    }
    if (!formData.strength.trim()) {
      toast.error('Please enter strength')
      return false
    }
    if (!formData.form.trim()) {
      toast.error('Please select form')
      return false
    }
    if (!formData.manufacturer.trim()) {
      toast.error('Please enter manufacturer')
      return false
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
      const medicineData = {
        ...formData,
        price: parseFloat(formData.price) || 0,
        stockQuantity: parseInt(formData.stockQuantity) || 0,
        reorderLevel: parseInt(formData.reorderLevel) || 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: currentUser.uid
      }

      if (showEditModal) {
        // Update existing medicine
        await updateDoc(doc(db, 'medicines', selectedMedicine.id), {
          ...medicineData,
          updatedAt: new Date().toISOString()
        })
        toast.success('Medicine updated successfully!')
        setShowEditModal(false)
      } else {
        // Create new medicine
        await addDoc(collection(db, 'medicines'), medicineData)
        toast.success('Medicine created successfully!')
        setShowCreateModal(false)
      }
    } catch (error) {
      console.error('Error saving medicine:', error)
      toast.error(`Error saving medicine: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const getCategoryColor = (category) => {
    switch (category) {
      case 'antibiotics': return 'text-red-400 bg-red-400/10'
      case 'painkillers': return 'text-orange-400 bg-orange-400/10'
      case 'vitamins': return 'text-accent-400 bg-accent-400/10'
      case 'diabetes': return 'text-primary-400 bg-primary-400/10'
      case 'cardiology': return 'text-purple-400 bg-purple-400/10'
      case 'dermatology': return 'text-secondary-400 bg-secondary-400/10'
      case 'psychiatry': return 'text-pink-400 bg-pink-400/10'
      default: return 'text-gray-400 bg-gray-400/10'
    }
  }

  const getStockStatus = (quantity, reorderLevel) => {
    if (quantity <= 0) return { status: 'out_of_stock', color: 'text-red-400 bg-red-400/10', text: 'Out of Stock' }
    if (quantity <= reorderLevel) return { status: 'low_stock', color: 'text-accent-400 bg-accent-400/10', text: 'Low Stock' }
    return { status: 'in_stock', color: 'text-secondary-400 bg-secondary-400/10', text: 'In Stock' }
  }

  const categories = [
    'antibiotics', 'painkillers', 'vitamins', 'diabetes', 'cardiology',
    'dermatology', 'psychiatry', 'respiratory', 'gastroenterology', 'neurology'
  ]

  const forms = [
    'tablet', 'capsule', 'syrup', 'injection', 'cream', 'ointment',
    'drops', 'inhaler', 'suppository', 'powder'
  ]

  const getStockBadgeClass = (quantity, reorderLevel) => {
    if (quantity <= 0) return 'badge badge-error'
    if (quantity <= reorderLevel) return 'badge badge-warning'
    return 'badge badge-success'
  }

  return (
    <div className="dashboard-container">
      <nav className="nav-bar">
        <div className="nav-bar-content">
          <div className="flex items-center gap-3">
            <div className="stat-card-icon stat-card-icon-primary w-10 h-10 rounded-xl flex items-center justify-center">
              <Pill className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="nav-bar-title">Manage Medicines</h1>
              <p className="text-sm text-slate-300">Add, edit, and manage medicine inventory</p>
            </div>
          </div>
          <div className="nav-bar-user flex items-center gap-2">
            <Link to="/doctor/prescriptions" className="btn btn-outline btn-md inline-flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Prescriptions</span>
            </Link>
            <button type="button" onClick={handleCreateMedicine} className="btn btn-secondary btn-md inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span>Add Medicine</span>
            </button>
            <LogoutButton />
          </div>
        </div>
      </nav>

      <main className="page-container">
        <div className="filter-container flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 w-full lg:w-auto">
            <input
              type="text"
              placeholder="Search medicines..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input w-full md:w-auto form-input"
            />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="form-input"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div className="text-sm text-muted">
            {filteredMedicines.length} of {medicines.length} medicines
          </div>
        </div>

        {loading ? (
          <div className="card p-8 text-center">
            <div className="spinner mx-auto" />
            <p className="text-muted mt-4">Loading medicines...</p>
          </div>
        ) : filteredMedicines.length === 0 ? (
          <div className="card p-8 text-center">
            <Pill className="w-16 h-16 text-muted mx-auto mb-4 icon-lg" />
            <p className="text-muted">No medicines found</p>
          </div>
        ) : (
          <div className="grid-cards grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMedicines.map((medicine) => {
              const stockStatus = getStockStatus(medicine.stockQuantity, medicine.reorderLevel)
              const stockBadgeClass = getStockBadgeClass(medicine.stockQuantity, medicine.reorderLevel)
              return (
                <div key={medicine.id} className="card">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-heading text-lg font-semibold">{medicine.name}</h3>
                      <p className="text-muted">{medicine.strength} • {medicine.form}</p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <span className={`badge ${getCategoryColor(medicine.category)}`}>
                        {medicine.category}
                      </span>
                      <span className={stockBadgeClass}>{stockStatus.text}</span>
                    </div>
                  </div>
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-muted icon-sm" />
                      <span className="text-body">{medicine.manufacturer}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-muted icon-sm" />
                      <span className="text-body">Stock: {medicine.stockQuantity || 0}</span>
                    </div>
                    {medicine.price != null && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted">Rs.</span>
                        <span className="text-body">{medicine.price}</span>
                      </div>
                    )}
                  </div>
                  {medicine.description && (
                    <div className="mb-4">
                      <p className="text-sm text-muted line-clamp-2">{medicine.description}</p>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleEditMedicine(medicine)}
                      className="btn btn-primary btn-sm flex-1 inline-flex items-center justify-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteMedicine(medicine.id)}
                      className="btn btn-danger btn-icon btn-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {(showCreateModal || showEditModal) && (
        <div className="modal-overlay">
          <div className="modal-container max-w-4xl max-h-[90vh]">
            <div className="modal-header">
              <h2 className="modal-title">{showEditModal ? 'Edit Medicine' : 'Add New Medicine'}</h2>
              <button
                type="button"
                onClick={() => { setShowCreateModal(false); setShowEditModal(false) }}
                className="btn btn-ghost btn-icon btn-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="form-container flex flex-col flex-1 overflow-hidden">
              <div className="modal-body flex-1 overflow-y-auto space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label form-label-required">Medicine Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="form-input"
                      placeholder="Enter medicine name"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label form-label-required">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="form-input"
                    >
                      <option value="">Select Category</option>
                      {categories.map(category => (
                        <option key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label form-label-required">Strength</label>
                    <input
                      type="text"
                      value={formData.strength}
                      onChange={(e) => setFormData(prev => ({ ...prev, strength: e.target.value }))}
                      className="form-input"
                      placeholder="e.g., 500mg, 10ml"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label form-label-required">Form</label>
                    <select
                      value={formData.form}
                      onChange={(e) => setFormData(prev => ({ ...prev, form: e.target.value }))}
                      className="form-input"
                    >
                      <option value="">Select Form</option>
                      {forms.map(f => (
                        <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label form-label-required">Manufacturer</label>
                    <input
                      type="text"
                      value={formData.manufacturer}
                      onChange={(e) => setFormData(prev => ({ ...prev, manufacturer: e.target.value }))}
                      className="form-input"
                      placeholder="Enter manufacturer name"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Price (Rs.)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                      className="form-input"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Stock Quantity</label>
                    <input
                      type="number"
                      value={formData.stockQuantity}
                      onChange={(e) => setFormData(prev => ({ ...prev, stockQuantity: e.target.value }))}
                      className="form-input"
                      placeholder="0"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Reorder Level</label>
                    <input
                      type="number"
                      value={formData.reorderLevel}
                      onChange={(e) => setFormData(prev => ({ ...prev, reorderLevel: e.target.value }))}
                      className="form-input"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="form-textarea form-input"
                    rows={3}
                    placeholder="Enter medicine description..."
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Side Effects</label>
                    <textarea
                      value={formData.sideEffects}
                      onChange={(e) => setFormData(prev => ({ ...prev, sideEffects: e.target.value }))}
                      className="form-textarea form-input"
                      rows={3}
                      placeholder="Common side effects..."
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Contraindications</label>
                    <textarea
                      value={formData.contraindications}
                      onChange={(e) => setFormData(prev => ({ ...prev, contraindications: e.target.value }))}
                      className="form-textarea form-input"
                      rows={3}
                      placeholder="Contraindications..."
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Dosage Instructions</label>
                    <textarea
                      value={formData.dosageInstructions}
                      onChange={(e) => setFormData(prev => ({ ...prev, dosageInstructions: e.target.value }))}
                      className="form-textarea form-input"
                      rows={3}
                      placeholder="Dosage instructions..."
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Storage Instructions</label>
                    <textarea
                      value={formData.storageInstructions}
                      onChange={(e) => setFormData(prev => ({ ...prev, storageInstructions: e.target.value }))}
                      className="form-textarea form-input"
                      rows={3}
                      placeholder="Storage instructions..."
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="flex items-center justify-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                      className="form-checkbox"
                    />
                    <span className="form-label">Active Medicine</span>
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); setShowEditModal(false) }}
                  className="btn btn-outline btn-md"
                >
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="btn btn-primary btn-md inline-flex items-center gap-2">
                  {loading ? <div className="spinner w-4 h-4" /> : <Save className="w-4 h-4" />}
                  <span>{loading ? 'Saving...' : (showEditModal ? 'Update Medicine' : 'Add Medicine')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
