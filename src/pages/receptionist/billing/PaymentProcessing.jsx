import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { collection, onSnapshot, query, orderBy, where, updateDoc, doc, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../../firebase/config'
import LogoutButton from '../../../components/LogoutButton'
import { 
  ArrowLeft, 
  Search, 
  DollarSign, 
  CreditCard, 
  Banknote, 
  Globe, 
  Receipt,
  CheckCircle,
  Clock,
  AlertCircle,
  User,
  Phone,
  Calendar,
  FileText,
  Download,
  Printer
} from 'lucide-react'

export default function PaymentProcessing() {
  const [invoices, setInvoices] = useState([])
  const [filteredInvoices, setFilteredInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [paymentModal, setPaymentModal] = useState(false)
  const [paymentData, setPaymentData] = useState({
    method: 'cash',
    amount: 0,
    reference: '',
    notes: ''
  })
  const [processingPayment, setProcessingPayment] = useState(false)

  useEffect(() => {
    let unsubscribe
    
    const fetchInvoices = () => {
      try {
        const invoicesRef = collection(db, 'invoices')
        const q = query(invoicesRef, where('status', 'in', ['pending', 'overdue']), orderBy('createdAt', 'desc'))
        
        unsubscribe = onSnapshot(q, (snapshot) => {
          const invoicesData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          setInvoices(invoicesData)
          setFilteredInvoices(invoicesData)
          setLoading(false)
        }, (error) => {
          console.error('Error fetching invoices:', error)
          setLoading(false)
        })
      } catch (error) {
        console.error('Error fetching invoices:', error)
        setLoading(false)
      }
    }
    
    fetchInvoices()
    
    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [])

  // Filter invoices based on search
  useEffect(() => {
    if (searchQuery) {
      const filtered = invoices.filter(invoice =>
        invoice.patientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.patientPhone?.includes(searchQuery) ||
        invoice.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredInvoices(filtered)
    } else {
      setFilteredInvoices(invoices)
    }
  }, [invoices, searchQuery])

  // Open payment modal
  const openPaymentModal = (invoice) => {
    setSelectedInvoice(invoice)
    setPaymentData({
      method: 'cash',
      amount: invoice.totalAmount || 0,
      reference: '',
      notes: ''
    })
    setPaymentModal(true)
  }

  // Process payment
  const processPayment = async () => {
    if (!selectedInvoice || !paymentData.amount || paymentData.amount <= 0) {
      alert('Please enter a valid payment amount')
      return
    }

    setProcessingPayment(true)
    try {
      // Update invoice status
      await updateDoc(doc(db, 'invoices', selectedInvoice.id), {
        status: 'paid',
        paymentMethod: paymentData.method,
        paymentDate: serverTimestamp(),
        paymentReference: paymentData.reference,
        paymentNotes: paymentData.notes,
        updatedAt: serverTimestamp()
      })

      // Create payment record
      await addDoc(collection(db, 'payments'), {
        invoiceId: selectedInvoice.id,
        invoiceNumber: selectedInvoice.invoiceNumber,
        patientName: selectedInvoice.patientName,
        patientPhone: selectedInvoice.patientPhone,
        amount: paymentData.amount,
        method: paymentData.method,
        reference: paymentData.reference,
        notes: paymentData.notes,
        processedBy: 'receptionist', // You can get actual user ID here
        processedAt: serverTimestamp(),
        status: 'completed'
      })

      alert('Payment processed successfully!')
      setPaymentModal(false)
      setSelectedInvoice(null)
      setPaymentData({
        method: 'cash',
        amount: 0,
        reference: '',
        notes: ''
      })
    } catch (error) {
      console.error('Error processing payment:', error)
      alert('Error processing payment. Please try again.')
    } finally {
      setProcessingPayment(false)
    }
  }

  // Get status icon and color
  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid':
        return { icon: CheckCircle, color: 'text-secondary-400', bgColor: 'bg-secondary-500 text-white/20' }
      case 'pending':
        return { icon: Clock, color: 'text-accent-400', bgColor: 'bg-accent-500/20' }
      case 'overdue':
        return { icon: AlertCircle, color: 'text-red-400', bgColor: 'bg-red-500/20' }
      default:
        return { icon: Clock, color: 'text-slate-500', bgColor: 'bg-slate-500/20' }
    }
  }

  // Calculate days overdue
  const getDaysOverdue = (invoice) => {
    if (invoice.status === 'paid') return 0
    
    const dueDate = new Date(invoice.dueDate)
    const today = new Date()
    const diffTime = today - dueDate
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return diffDays > 0 ? diffDays : 0
  }

  if (loading) {
    return (
      <div className="dashboard-container flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4" />
          <p className="text-muted">Loading invoices...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      
      <header className="nav-bar ">
        <div className="nav-bar-content">
          <div className="flex items-center justify-between gap-4">
              <div className='flex  gap-4'>
                <div className="stat-card-icon stat-card-icon-secondary w-10 h-10 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="nav-bar-title">Payment Processing</h1>
                  <p className="text-sm text-slate-300">Process payments for pending invoices</p>
                </div>
              </div>
              <div className="flex items-end gap-4">
                  <Link to="/receptionist/billing" className="btn btn-secondary btn-md inline-flex items-center gap-2">
                  <ArrowLeft className="w-5 h-5" />
                  <span>Back</span>
                  </Link>
                  <LogoutButton />
              </div>
          </div>
        </div>
      </header>
      

      <main className="page-container">
        <div className="card mb-6">
          <div className="form-group max-w-md">
            <label className="form-label">Search Invoices</label>
            <input
              type="text"
              placeholder="Search by patient name, phone, or invoice number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input form-input"
            />
          </div>
        </div>

        <div className="mb-4">
          <p className="text-muted">Found {filteredInvoices.length} pending invoices</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredInvoices.length === 0 ? (
            <div className="col-span-full card p-12 text-center">
              <DollarSign className="w-16 h-16 text-muted mx-auto mb-4 icon-lg" />
              <p className="text-muted text-lg">No pending invoices found</p>
              <p className="text-muted text-sm">All invoices have been paid</p>
            </div>
          ) : (
            filteredInvoices.map((invoice) => {
              const statusInfo = getStatusIcon(invoice.status)
              const StatusIcon = statusInfo.icon
              const daysOverdue = getDaysOverdue(invoice)
              const statusBadgeClass = invoice.status === 'overdue' ? 'badge badge-error' : 'badge badge-pending'

              return (
                <div key={invoice.id} className="card">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-mono text-primary-600 text-lg">#{invoice.invoiceNumber}</h3>
                      <p className="text-sm text-muted">Due: {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}</p>
                    </div>
                    <span className={`${statusBadgeClass} inline-flex items-center gap-1`}>
                      <StatusIcon className="w-4 h-4" />
                      {invoice.status?.charAt(0).toUpperCase() + invoice.status?.slice(1)}
                    </span>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-muted icon-sm" />
                      <span className="font-medium text-heading">{invoice.patientName}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <Phone className="w-4 h-4 text-muted icon-sm" />
                      <span className="text-sm text-muted">{invoice.patientPhone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted icon-sm" />
                      <span className="text-sm text-muted">Created: {invoice.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="text-2xl font-bold text-heading mb-2">Rs.{invoice.totalAmount?.toLocaleString()}</div>
                    {daysOverdue > 0 && (
                      <div className="text-error text-sm">{daysOverdue} day{daysOverdue > 1 ? 's' : ''} overdue</div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button type="button" onClick={() => openPaymentModal(invoice)} className="btn btn-secondary btn-sm flex-1 inline-flex items-center justify-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      <span>Process Payment</span>
                    </button>
                    <Link to={`/receptionist/billing/invoices/${invoice.id}`} className="btn btn-primary btn-icon btn-sm" title="View Invoice">
                      <FileText className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <div className="mt-8 flex justify-center">
          <Link to="/receptionist/billing" className="btn btn-primary btn-lg rounded-xl px-10">
            Back to Billing Dashboard
          </Link>
        </div>
      </main>

      {paymentModal && selectedInvoice && (
        <div className="modal-overlay">
          <div className="modal-container max-w-md w-full">
            <div className="modal-header">
              <h2 className="modal-title">Process Payment</h2>
            </div>
            <div className="modal-body">
            <div className="rounded-xl border border-neutral-200 bg-neutral-50/80 p-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-muted">Invoice:</span>
                <span className="font-mono text-primary-600">#{selectedInvoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-muted">Patient:</span>
                <span className="font-medium text-heading">{selectedInvoice.patientName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted">Total Amount:</span>
                <span className="text-xl font-bold text-heading">Rs.{selectedInvoice.totalAmount?.toLocaleString()}</span>
              </div>
            </div>

            <div className="form-group mb-4">
              <label className="form-label">Payment Method</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'cash', label: 'Cash', icon: Banknote, color: 'text-secondary-500' },
                  { value: 'card', label: 'Card', icon: CreditCard, color: 'text-primary-500' },
                  { value: 'online', label: 'Online', icon: Globe, color: 'text-indigo-500' }
                ].map((method) => {
                  const Icon = method.icon
                  return (
                    <button
                      key={method.value}
                      type="button"
                      onClick={() => setPaymentData(prev => ({ ...prev, method: method.value }))}
                      className={`btn p-3 rounded-lg border transition-colors ${
                        paymentData.method === method.value ? 'btn-primary' : 'btn-outline'
                      }`}
                    >
                      <Icon className={`w-5 h-5 mx-auto mb-1 ${paymentData.method === method.value ? 'text-white' : method.color}`} />
                      <span className="text-xs block">{method.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="form-group mb-4">
              <label className="form-label">Payment Amount (Rs.)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={paymentData.amount}
                onChange={(e) => setPaymentData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                className="form-input"
              />
            </div>

            <div className="form-group mb-4">
              <label className="form-label">Reference Number</label>
              <input
                type="text"
                value={paymentData.reference}
                onChange={(e) => setPaymentData(prev => ({ ...prev, reference: e.target.value }))}
                className="form-input"
                placeholder="Transaction ID, receipt number, etc."
              />
            </div>

            <div className="form-group mb-4">
              <label className="form-label">Notes</label>
              <textarea
                value={paymentData.notes}
                onChange={(e) => setPaymentData(prev => ({ ...prev, notes: e.target.value }))}
                rows={2}
                className="form-textarea form-input"
                placeholder="Additional payment notes..."
              />
            </div>
            </div>
            <div className="modal-footer">
              <button type="button" onClick={() => setPaymentModal(false)} className="btn-outline btn-lg rounded-xl px-10">
                Cancel
              </button>
              <button
                type="button"
                onClick={processPayment}
                disabled={processingPayment}
                className="btn btn-primary btn-lg rounded-xl px-10 flex items-center gap-2"
              >
                {processingPayment ? <div className="spinner w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                <span>{processingPayment ? 'Processing...' : 'Complete Payment'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
