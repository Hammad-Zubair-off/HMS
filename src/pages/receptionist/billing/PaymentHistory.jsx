import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from '../../../firebase/config'
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  DollarSign, 
  CreditCard, 
  Banknote, 
  Globe, 
  TrendingUp,
  Calendar,
  BarChart3,
  Download,
  Eye,
  Receipt,
  CheckCircle,
  Clock,
  AlertCircle,
  User,
  Phone
} from 'lucide-react'

export default function PaymentHistory() {
  const [payments, setPayments] = useState([])
  const [filteredPayments, setFilteredPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [methodFilter, setMethodFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [sortBy, setSortBy] = useState('date')
  const [sortOrder, setSortOrder] = useState('desc')

  // Analytics state
  const [analytics, setAnalytics] = useState({
    totalPayments: 0,
    totalAmount: 0,
    cashPayments: 0,
    cardPayments: 0,
    onlinePayments: 0,
    todayPayments: 0,
    todayAmount: 0,
    weekPayments: 0,
    weekAmount: 0,
    monthPayments: 0,
    monthAmount: 0
  })

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const paymentsRef = collection(db, 'payments')
        const q = query(paymentsRef, orderBy('processedAt', 'desc'))
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const paymentsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          setPayments(paymentsData)
          setFilteredPayments(paymentsData)
          setLoading(false)
          
          // Calculate analytics
          calculateAnalytics(paymentsData)
        })
        
        return unsubscribe
      } catch (error) {
        console.error('Error fetching payments:', error)
        setLoading(false)
      }
    }
    
    fetchPayments()
  }, [])

  // Calculate analytics
  const calculateAnalytics = (paymentsData) => {
    const totalPayments = paymentsData.length
    const totalAmount = paymentsData.reduce((sum, payment) => sum + (payment.amount || 0), 0)
    
    // Payment method breakdown
    const cashPayments = paymentsData
      .filter(payment => payment.method === 'cash')
      .reduce((sum, payment) => sum + (payment.amount || 0), 0)
    
    const cardPayments = paymentsData
      .filter(payment => payment.method === 'card')
      .reduce((sum, payment) => sum + (payment.amount || 0), 0)
    
    const onlinePayments = paymentsData
      .filter(payment => payment.method === 'online')
      .reduce((sum, payment) => sum + (payment.amount || 0), 0)
    
    // Date-based analytics
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const weekAgo = new Date(startOfDay.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(startOfDay.getTime() - 30 * 24 * 60 * 60 * 1000)
    
    const todayPayments = paymentsData.filter(payment => {
      const paymentDate = payment.processedAt?.toDate?.() || new Date(payment.processedAt)
      return paymentDate >= startOfDay
    })
    
    const weekPayments = paymentsData.filter(payment => {
      const paymentDate = payment.processedAt?.toDate?.() || new Date(payment.processedAt)
      return paymentDate >= weekAgo
    })
    
    const monthPayments = paymentsData.filter(payment => {
      const paymentDate = payment.processedAt?.toDate?.() || new Date(payment.processedAt)
      return paymentDate >= monthAgo
    })
    
    const todayAmount = todayPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0)
    const weekAmount = weekPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0)
    const monthAmount = monthPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0)
    
    setAnalytics({
      totalPayments,
      totalAmount,
      cashPayments,
      cardPayments,
      onlinePayments,
      todayPayments: todayPayments.length,
      todayAmount,
      weekPayments: weekPayments.length,
      weekAmount,
      monthPayments: monthPayments.length,
      monthAmount
    })
  }

  // Filter and search payments
  useEffect(() => {
    let filtered = [...payments]

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(payment =>
        payment.patientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.patientPhone?.includes(searchQuery) ||
        payment.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.reference?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Method filter
    if (methodFilter !== 'all') {
      filtered = filtered.filter(payment => payment.method === methodFilter)
    }

    // Date filter
    if (dateFilter !== 'all') {
      const today = new Date()
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      
      switch (dateFilter) {
        case 'today': {
          filtered = filtered.filter(payment => {
            const paymentDate = payment.processedAt?.toDate?.() || new Date(payment.processedAt)
            return paymentDate >= startOfDay
          })
          break
        }
        case 'week': {
          const weekAgo = new Date(startOfDay.getTime() - 7 * 24 * 60 * 60 * 1000)
          filtered = filtered.filter(payment => {
            const paymentDate = payment.processedAt?.toDate?.() || new Date(payment.processedAt)
            return paymentDate >= weekAgo
          })
          break
        }
        case 'month': {
          const monthAgo = new Date(startOfDay.getTime() - 30 * 24 * 60 * 60 * 1000)
          filtered = filtered.filter(payment => {
            const paymentDate = payment.processedAt?.toDate?.() || new Date(payment.processedAt)
            return paymentDate >= monthAgo
          })
          break
        }
      }
    }

    // Sort payments
    filtered.sort((a, b) => {
      let aValue, bValue
      
      switch (sortBy) {
        case 'date':
          aValue = a.processedAt?.toDate?.() || new Date(a.processedAt)
          bValue = b.processedAt?.toDate?.() || new Date(b.processedAt)
          break
        case 'amount':
          aValue = a.amount || 0
          bValue = b.amount || 0
          break
        case 'name':
          aValue = a.patientName || ''
          bValue = b.patientName || ''
          break
        default:
          aValue = a.processedAt?.toDate?.() || new Date(a.processedAt)
          bValue = b.processedAt?.toDate?.() || new Date(b.processedAt)
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    setFilteredPayments(filtered)
  }, [payments, searchQuery, methodFilter, dateFilter, sortBy, sortOrder])

  // Get payment method icon and color
  const getPaymentMethodIcon = (method) => {
    switch (method) {
             case 'cash':
         return { icon: Banknote, color: 'text-secondary-400', bgColor: 'bg-secondary-500 text-white/20' }
      case 'card':
        return { icon: CreditCard, color: 'text-primary-400', bgColor: 'bg-primary-500 text-white/20' }
      case 'online':
        return { icon: Globe, color: 'text-indigo-400', bgColor: 'bg-indigo-500 text-white/20' }
      default:
        return { icon: DollarSign, color: 'text-slate-500', bgColor: 'bg-slate-500/20' }
    }
  }

  if (loading) {
    return (
      <div className="dashboard-container flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4" />
          <p className="text-muted">Loading payment history...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      <nav className="nav-bar">
        <div className="nav-bar-content">
          <div className="flex items-center gap-3">
            <Link to="/receptionist/billing" className="btn btn-ghost btn-sm inline-flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </Link>
            <div className="stat-card-icon stat-card-icon-secondary w-10 h-10 rounded-xl flex items-center justify-center">
              <Receipt className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="nav-bar-title">Payment History</h1>
              <p className="text-sm text-slate-300">Track all payment transactions</p>
            </div>
          </div>
        </div>
      </nav>

      <main className="page-container">
        {/* Analytics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center space-x-3 mb-4">
              <DollarSign className="w-6 h-6 text-secondary-500" />
              <h3 className="text-lg font-semibold text-heading">Total Payments</h3>
            </div>
            <p className="text-3xl font-bold text-heading">{analytics.totalPayments}</p>
            <p className="text-sm text-muted mt-2">Rs.{analytics.totalAmount.toLocaleString()}</p>
          </div>

          <div className="card">
            <div className="flex items-center space-x-3 mb-4">
              <Calendar className="w-6 h-6 text-primary-500" />
              <h3 className="text-lg font-semibold text-heading">Today</h3>
            </div>
            <p className="text-3xl font-bold text-heading">{analytics.todayPayments}</p>
            <p className="text-sm text-muted mt-2">Rs.{analytics.todayAmount.toLocaleString()}</p>
          </div>

          <div className="card">
            <div className="flex items-center space-x-3 mb-4">
              <TrendingUp className="w-6 h-6 text-secondary-500" />
              <h3 className="text-lg font-semibold text-heading">This Week</h3>
            </div>
            <p className="text-3xl font-bold text-heading">{analytics.weekPayments}</p>
            <p className="text-sm text-muted mt-2">Rs.{analytics.weekAmount.toLocaleString()}</p>
          </div>

          <div className="card">
            <div className="flex items-center space-x-3 mb-4">
              <BarChart3 className="w-6 h-6 text-primary-500" />
              <h3 className="text-lg font-semibold text-heading">This Month</h3>
            </div>
            <p className="text-3xl font-bold text-heading">{analytics.monthPayments}</p>
            <p className="text-sm text-muted mt-2">Rs.{analytics.monthAmount.toLocaleString()}</p>
          </div>
        </div>

        {/* Payment Methods Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center space-x-3 mb-4">
              <Banknote className="w-6 h-6 text-secondary-500" />
              <h3 className="text-lg font-semibold text-heading">Cash Payments</h3>
            </div>
            <p className="text-2xl font-bold text-heading">Rs.{analytics.cashPayments.toLocaleString()}</p>
            <p className="text-sm text-muted mt-2">Total cash received</p>
          </div>

          <div className="card">
            <div className="flex items-center space-x-3 mb-4">
              <CreditCard className="w-6 h-6 text-primary-500" />
              <h3 className="text-lg font-semibold text-heading">Card Payments</h3>
            </div>
            <p className="text-2xl font-bold text-heading">Rs.{analytics.cardPayments.toLocaleString()}</p>
            <p className="text-sm text-muted mt-2">Total card payments</p>
          </div>

          <div className="card">
            <div className="flex items-center space-x-3 mb-4">
              <Globe className="w-6 h-6 text-secondary-500" />
              <h3 className="text-lg font-semibold text-heading">Online Payments</h3>
            </div>
            <p className="text-2xl font-bold text-heading">Rs.{analytics.onlinePayments.toLocaleString()}</p>
            <p className="text-sm text-muted mt-2">Total online payments</p>
          </div>
        </div>

        <div className="card mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2 form-group">
              <label className="form-label">Search</label>
              <input
                type="text"
                placeholder="Search by patient name, phone, invoice number, or reference..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Payment Method</label>
              <select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)} className="form-select">
                <option value="all">All Methods</option>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="online">Online</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Date Range</label>
              <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="form-select">
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Sort By</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="form-select">
                <option value="date">Date</option>
                <option value="amount">Amount</option>
                <option value="name">Patient Name</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button type="button" onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')} className="btn btn-outline btn-sm">
              {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
            </button>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-muted">Showing {filteredPayments.length} of {payments.length} payments</p>
        </div>

        <div className="table-container card">
          {filteredPayments.length === 0 ? (
            <div className="table-empty py-12">
              <Receipt className="w-16 h-16 text-muted mx-auto mb-4 icon-lg" />
              <p className="table-empty-text">No payments found</p>
              <p className="text-muted text-sm mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead className="table-header">
                  <tr className="table-header-row">
                    <th className="table-header-cell">Payment ID</th>
                    <th className="table-header-cell">Patient</th>
                    <th className="table-header-cell">Invoice #</th>
                    <th className="table-header-cell">Amount</th>
                    <th className="table-header-cell">Method</th>
                    <th className="table-header-cell">Reference</th>
                    <th className="table-header-cell">Date</th>
                    <th className="table-header-cell">Actions</th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {filteredPayments.map((payment) => {
                    const methodInfo = getPaymentMethodIcon(payment.method)
                    const MethodIcon = methodInfo.icon

                    return (
                      <tr key={payment.id} className="table-row">
                        <td className="table-cell">
                          <span className="font-mono text-primary-600">#{payment.id.slice(-8)}</span>
                        </td>
                        <td className="table-cell">
                          <div>
                            <p className="table-cell-header">{payment.patientName}</p>
                            <p className="text-sm text-muted">{payment.patientPhone}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono text-primary-400">#{payment.invoiceNumber}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-secondary-400">Rs.{payment.amount?.toLocaleString()}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <MethodIcon className={`w-4 h-4 ${methodInfo.color}`} />
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${methodInfo.bgColor} ${methodInfo.color}`}>
                              {payment.method?.charAt(0).toUpperCase() + payment.method?.slice(1)}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-slate-500">
                            {payment.reference || 'N/A'}
                          </span>
                        </td>
                        <td className="table-cell text-muted text-sm">
                          {payment.processedAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            <Link to={`/receptionist/billing/invoices/${payment.invoiceId}`} className="btn btn-ghost btn-icon btn-sm" title="View Invoice">
                              <Eye className="w-4 h-4" />
                            </Link>
                            <button type="button" onClick={() => window.print()} className="btn btn-ghost btn-icon btn-sm" title="Print Receipt">
                              <Receipt className="w-4 h-4" />
                            </button>
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

        <div className="mt-6 flex justify-center gap-4">
          <button
            type="button"
            onClick={() => {
              setSearchQuery('')
              setMethodFilter('all')
              setDateFilter('all')
              setSortBy('date')
              setSortOrder('desc')
            }}
            className="btn btn-ghost"
          >
            Clear Filters
          </button>
          <Link to="/receptionist/billing" className="btn btn-primary btn-lg rounded-xl px-10">
            Back to Billing Dashboard
          </Link>
        </div>
      </main>
    </div>
  )
}
