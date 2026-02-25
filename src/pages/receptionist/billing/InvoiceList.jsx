import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from '../../../firebase/config'
import LogoutButton from '../../../components/LogoutButton'

import { 
  ArrowLeft, 
  Search, 
  Eye, 
  Download, 
  Edit, 
  DollarSign,
  FileText,
  CreditCard,
  Banknote, 
  Globe
} from 'lucide-react'

export default function InvoiceList() {
  const [invoices, setInvoices] = useState([])
  const [filteredInvoices, setFilteredInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [sortBy, setSortBy] = useState('date')
  const [sortOrder, setSortOrder] = useState('desc')

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const invoicesRef = collection(db, 'invoices')
        const q = query(invoicesRef, orderBy('createdAt', 'desc'))
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const invoicesData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          setInvoices(invoicesData)
          setFilteredInvoices(invoicesData)
          setLoading(false)
        })
        
        return unsubscribe
      } catch (error) {
        console.error('Error fetching invoices:', error)
        setLoading(false)
      }
    }
    
    fetchInvoices()
  }, [])

  // Filter and search invoices
  useEffect(() => {
    let filtered = [...invoices]

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(invoice =>
        invoice.patientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.patientPhone?.includes(searchQuery) ||
        invoice.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(invoice => invoice.status === statusFilter)
    }

    // Date filter
    if (dateFilter !== 'all') {
      const today = new Date()
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      
      switch (dateFilter) {
        case 'today': {
          filtered = filtered.filter(invoice => {
            const invoiceDate = invoice.createdAt?.toDate?.() || new Date(invoice.createdAt)
            return invoiceDate >= startOfDay
          })
          break
        }
        case 'week': {
          const weekAgo = new Date(startOfDay.getTime() - 7 * 24 * 60 * 60 * 1000)
          filtered = filtered.filter(invoice => {
            const invoiceDate = invoice.createdAt?.toDate?.() || new Date(invoice.createdAt)
            return invoiceDate >= weekAgo
          })
          break
        }
        case 'month': {
          const monthAgo = new Date(startOfDay.getTime() - 30 * 24 * 60 * 60 * 1000)
          filtered = filtered.filter(invoice => {
            const invoiceDate = invoice.createdAt?.toDate?.() || new Date(invoice.createdAt)
            return invoiceDate >= monthAgo
          })
          break
        }
      }
    }

    // Sort invoices
    filtered.sort((a, b) => {
      let aValue, bValue
      
      switch (sortBy) {
        case 'date':
          aValue = a.createdAt?.toDate?.() || new Date(a.createdAt)
          bValue = b.createdAt?.toDate?.() || new Date(b.createdAt)
          break
        case 'amount':
          aValue = a.totalAmount || 0
          bValue = b.totalAmount || 0
          break
        case 'name':
          aValue = a.patientName || ''
          bValue = b.patientName || ''
          break
        default:
          aValue = a.createdAt?.toDate?.() || new Date(a.createdAt)
          bValue = b.createdAt?.toDate?.() || new Date(b.createdAt)
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    setFilteredInvoices(filtered)
  }, [invoices, searchQuery, statusFilter, dateFilter, sortBy, sortOrder])

  // Get payment method icon
  const getPaymentMethodIcon = (method) => {
    switch (method) {
             case 'cash':
         return { icon: Banknote, color: 'text-secondary-400' }
      case 'card':
        return { icon: CreditCard, color: 'text-primary-400' }
      case 'online':
        return { icon: Globe, color: 'text-indigo-400' }
      default:
        return { icon: DollarSign, color: 'text-slate-500' }
    }
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
      <nav className="nav-bar">
        <div className="nav-bar-content">
          <div className="flex items-center gap-3">
            {/* <Link to="/receptionist/billing" className="btn btn-ghost btn-sm inline-flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </Link> */}
            <div className="stat-card-icon stat-card-icon-primary w-10 h-10 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="nav-bar-title">Invoice Management</h1>
              <p className="text-sm text-slate-300">View and manage all invoices</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/receptionist/billing/create" className="btn btn-secondary btn-md">
            Create New Invoice
          </Link>
                      <Link 
                        to="/receptionist/billing"
                        className="btn-outline rounded-lg btn-md flex"
                      >
                        {/* <ArrowLeft className="icon-sm" /> */}
                        <span>Back to Billing</span>
                      </Link>
                    <LogoutButton />
                    </div>
          
        </div>
      </nav>

      <main className="page-container">
        <div className="card mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2 form-group">
              <label className="form-label">Search</label>
              <input
                type="text"
                placeholder="Search by patient..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className=" form-input">
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Date Range</label>
              <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="form-input">
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Sort By</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="form-input">
                <option value="date">Date</option>
                <option value="amount">Amount</option>
                <option value="name">Patient Name</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-between items-center">
            <p className="text-sm text-muted font-medium">Showing {filteredInvoices.length} of {invoices.length} invoices</p>
            <button type="button" onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')} className="btn btn-outline btn-sm">
              {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
            </button>
          </div>
        </div>

        <div className="table-container card">
          {filteredInvoices.length === 0 ? (
            <div className="table-empty">
              <FileText className="w-16 h-16 text-muted mx-auto mb-4 icon-lg" />
              <p className="table-empty-text">No invoices found</p>
              <p className="text-muted text-sm mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead className="table-header">
                  <tr className="table-header-row">
                    <th className="table-header-cell">Invoice #</th>
                    <th className="table-header-cell">Patient</th>
                    <th className="table-header-cell">Amount</th>
                    <th className="table-header-cell">Status</th>
                    <th className="table-header-cell">Payment</th>
                    <th className="table-header-cell">Date</th>
                    <th className="table-header-cell text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {filteredInvoices.map((invoice) => {
                    const paymentMethodInfo = getPaymentMethodIcon(invoice.paymentMethod)
                    const PaymentMethodIcon = paymentMethodInfo.icon
                    return (
                      <tr key={invoice.id} className="table-row">
                        <td className="table-cell">
                          <span className="font-mono font-medium text-primary-600">#{invoice.invoiceNumber}</span>
                        </td>
                        <td className="table-cell">
                          <div>
                            <p className="table-cell-header">{invoice.patientName}</p>
                            <p className="text-xs text-muted">{invoice.patientPhone}</p>
                          </div>
                        </td>
                        <td className="table-cell">
                          <span className="font-bold text-heading">Rs.{invoice.totalAmount?.toLocaleString()}</span>
                        </td>
                        <td className="table-cell">
                          <span className={`badge ${
                            invoice.status === 'paid' ? 'badge-success' : invoice.status === 'pending' ? 'badge-pending' : 'badge-error'
                          }`}>
                            {invoice.status?.charAt(0).toUpperCase() + invoice.status?.slice(1)}
                          </span>
                        </td>
                        <td className="table-cell">
                          {invoice.paymentMethod ? (
                            <div className="flex items-center gap-2">
                              <PaymentMethodIcon className={`w-3.5 h-3.5 ${paymentMethodInfo.color}`} />
                              <span className="text-body text-sm capitalize">{invoice.paymentMethod}</span>
                            </div>
                          ) : (
                            <span className="text-muted text-xs italic">Not specified</span>
                          )}
                        </td>
                        <td className="table-cell text-muted font-medium">
                          {invoice.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                        </td>
                        <td className="table-cell text-right">
                          <div className="flex justify-end gap-1">
                            <Link to={`/receptionist/billing/invoices/${invoice.id}`} className="btn btn-ghost btn-icon btn-sm" title="View">
                              <Eye className="w-4 h-4" />
                            </Link>
                            <Link to={`/receptionist/billing/invoices/${invoice.id}/download`} className="btn btn-ghost btn-icon btn-sm" title="Download">
                              <Download className="w-4 h-4" />
                            </Link>
                            <Link to={`/receptionist/billing/invoices/${invoice.id}/edit`} className="btn btn-ghost btn-icon btn-sm" title="Edit">
                              <Edit className="w-4 h-4" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-8 flex justify-center gap-4">
          <button
            type="button"
            onClick={() => {
              setSearchQuery('')
              setStatusFilter('all')
              setDateFilter('all')
              setSortBy('date')
              setSortOrder('desc')
            }}
            className="btn-outline btn-lg rounded-xl px-10"
          >
            Clear All Filters
          </button>
          <Link to="/receptionist/billing" className="btn-secondary btn-lg rounded-xl px-10">
            Back to Dashboard
          </Link>
        </div>
      </main>
    </div>
  )
}
