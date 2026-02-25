import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from '../../../firebase/config'
import { 
  ArrowLeft, 
  Download, 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  FileText, 
  Calendar, 
  User, 
  CreditCard, 
  Banknote, 
  Globe,
  CheckCircle,
  Clock,
  AlertCircle,
  Filter,
  Search,
  PieChart,
  Activity
} from 'lucide-react'

export default function Reports() {
  const [loading, setLoading] = useState(true)
  const [invoices, setInvoices] = useState([])
  const [payments, setPayments] = useState([])
  const [dateRange, setDateRange] = useState('month')
  const [statusFilter, setStatusFilter] = useState('all')
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch invoices
      const invoicesRef = collection(db, 'invoices')
      const invoicesQuery = query(invoicesRef, orderBy('createdAt', 'desc'))
      
      const invoicesUnsubscribe = onSnapshot(invoicesQuery, (snapshot) => {
        const invoicesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        setInvoices(invoicesData)
      })

      // Fetch payments
      const paymentsRef = collection(db, 'payments')
      const paymentsQuery = query(paymentsRef, orderBy('processedAt', 'desc'))
      
      const paymentsUnsubscribe = onSnapshot(paymentsQuery, (snapshot) => {
        const paymentsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        setPayments(paymentsData)
        setLoading(false)
      })

      return () => {
        invoicesUnsubscribe()
        paymentsUnsubscribe()
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      setLoading(false)
    }
  }

  // Filter data based on date range
  const getFilteredData = () => {
    let filteredInvoices = [...invoices]
    let filteredPayments = [...payments]

    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())

    // Date filtering
    switch (dateRange) {
      case 'today':
        filteredInvoices = filteredInvoices.filter(invoice => {
          const invoiceDate = invoice.createdAt?.toDate?.() || new Date(invoice.createdAt)
          return invoiceDate >= startOfDay
        })
        filteredPayments = filteredPayments.filter(payment => {
          const paymentDate = payment.processedAt?.toDate?.() || new Date(payment.processedAt)
          return paymentDate >= startOfDay
        })
        break
      case 'week': {
        const weekAgo = new Date(startOfDay.getTime() - 7 * 24 * 60 * 60 * 1000)
        filteredInvoices = filteredInvoices.filter(invoice => {
          const invoiceDate = invoice.createdAt?.toDate?.() || new Date(invoice.createdAt)
          return invoiceDate >= weekAgo
        })
        filteredPayments = filteredPayments.filter(payment => {
          const paymentDate = payment.processedAt?.toDate?.() || new Date(payment.processedAt)
          return paymentDate >= weekAgo
        })
        break
      }
      case 'month': {
        const monthAgo = new Date(startOfDay.getTime() - 30 * 24 * 60 * 60 * 1000)
        filteredInvoices = filteredInvoices.filter(invoice => {
          const invoiceDate = invoice.createdAt?.toDate?.() || new Date(invoice.createdAt)
          return invoiceDate >= monthAgo
        })
        filteredPayments = filteredPayments.filter(payment => {
          const paymentDate = payment.processedAt?.toDate?.() || new Date(payment.processedAt)
          return paymentDate >= monthAgo
        })
        break
      }
      case 'quarter': {
        const quarterAgo = new Date(startOfDay.getTime() - 90 * 24 * 60 * 60 * 1000)
        filteredInvoices = filteredInvoices.filter(invoice => {
          const invoiceDate = invoice.createdAt?.toDate?.() || new Date(invoice.createdAt)
          return invoiceDate >= quarterAgo
        })
        filteredPayments = filteredPayments.filter(payment => {
          const paymentDate = payment.processedAt?.toDate?.() || new Date(payment.processedAt)
          return paymentDate >= quarterAgo
        })
        break
      }
      case 'year': {
        const yearAgo = new Date(startOfDay.getTime() - 365 * 24 * 60 * 60 * 1000)
        filteredInvoices = filteredInvoices.filter(invoice => {
          const invoiceDate = invoice.createdAt?.toDate?.() || new Date(invoice.createdAt)
          return invoiceDate >= yearAgo
        })
        filteredPayments = filteredPayments.filter(payment => {
          const paymentDate = payment.processedAt?.toDate?.() || new Date(payment.processedAt)
          return paymentDate >= yearAgo
        })
        break
      }
    }

    // Status filtering
    if (statusFilter !== 'all') {
      filteredInvoices = filteredInvoices.filter(invoice => invoice.status === statusFilter)
    }

    // Payment method filtering
    if (paymentMethodFilter !== 'all') {
      filteredPayments = filteredPayments.filter(payment => payment.method === paymentMethodFilter)
    }

    // Search filtering
    if (searchQuery) {
      filteredInvoices = filteredInvoices.filter(invoice =>
        invoice.patientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      filteredPayments = filteredPayments.filter(payment =>
        payment.patientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    return { filteredInvoices, filteredPayments }
  }

  // Calculate statistics
  const calculateStats = () => {
    const { filteredInvoices, filteredPayments } = getFilteredData()
    
    const totalInvoices = filteredInvoices.length
    const totalAmount = filteredInvoices.reduce((sum, invoice) => sum + (invoice.totalAmount || 0), 0)
    const paidInvoices = filteredInvoices.filter(invoice => invoice.status === 'paid').length
    const pendingInvoices = filteredInvoices.filter(invoice => invoice.status === 'pending').length
    const overdueInvoices = filteredInvoices.filter(invoice => invoice.status === 'overdue').length
    
    const totalPayments = filteredPayments.length
    const totalPaymentAmount = filteredPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0)
    
    // Payment method breakdown
    const paymentMethods = filteredPayments.reduce((acc, payment) => {
      acc[payment.method] = (acc[payment.method] || 0) + (payment.amount || 0)
      return acc
    }, {})
    
    // Monthly trends
    const monthlyData = {}
    filteredInvoices.forEach(invoice => {
      const date = invoice.createdAt?.toDate?.() || new Date(invoice.createdAt)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + (invoice.totalAmount || 0)
    })

    return {
      totalInvoices,
      totalAmount,
      paidInvoices,
      pendingInvoices,
      overdueInvoices,
      totalPayments,
      totalPaymentAmount,
      paymentMethods,
      monthlyData,
      collectionRate: totalInvoices > 0 ? (paidInvoices / totalInvoices) * 100 : 0
    }
  }

  // Generate and download report
  const downloadReport = () => {
    const stats = calculateStats()
    const { filteredInvoices, filteredPayments } = getFilteredData()
    
    const reportData = {
      reportGenerated: new Date().toLocaleString(),
      dateRange: dateRange,
      filters: {
        status: statusFilter,
        paymentMethod: paymentMethodFilter,
        search: searchQuery
      },
      summary: stats,
      invoices: filteredInvoices,
      payments: filteredPayments
    }
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `billing-report-${dateRange}-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Export to CSV
  const exportToCSV = () => {
    const { filteredInvoices, filteredPayments } = getFilteredData()
    
    // Invoices CSV
    const invoicesCSV = [
      ['Invoice Number', 'Patient Name', 'Patient Phone', 'Total Amount', 'Status', 'Created Date', 'Due Date'],
      ...filteredInvoices.map(invoice => [
        invoice.invoiceNumber || '',
        invoice.patientName || '',
        invoice.patientPhone || '',
        invoice.totalAmount || 0,
        invoice.status || '',
        invoice.createdAt?.toDate?.()?.toLocaleDateString() || '',
        invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : ''
      ])
    ].map(row => row.join(',')).join('\n')
    
    // Payments CSV
    const paymentsCSV = [
      ['Invoice Number', 'Patient Name', 'Amount', 'Payment Method', 'Reference', 'Processed Date'],
      ...filteredPayments.map(payment => [
        payment.invoiceNumber || '',
        payment.patientName || '',
        payment.amount || 0,
        payment.method || '',
        payment.reference || '',
        payment.processedAt?.toDate?.()?.toLocaleDateString() || ''
      ])
    ].map(row => row.join(',')).join('\n')
    
    // Download both files
    const invoicesBlob = new Blob([invoicesCSV], { type: 'text/csv' })
    const paymentsBlob = new Blob([paymentsCSV], { type: 'text/csv' })
    
    const invoicesUrl = URL.createObjectURL(invoicesBlob)
    const paymentsUrl = URL.createObjectURL(paymentsBlob)
    
    const invoicesLink = document.createElement('a')
    invoicesLink.href = invoicesUrl
    invoicesLink.download = `invoices-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(invoicesLink)
    invoicesLink.click()
    document.body.removeChild(invoicesLink)
    
    const paymentsLink = document.createElement('a')
    paymentsLink.href = paymentsUrl
    paymentsLink.download = `payments-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(paymentsLink)
    paymentsLink.click()
    document.body.removeChild(paymentsLink)
    
    URL.revokeObjectURL(invoicesUrl)
    URL.revokeObjectURL(paymentsUrl)
  }

  if (loading) {
    return (
      <div className="dashboard-container flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4" />
          <p className="text-muted">Loading reports...</p>
        </div>
      </div>
    )
  }

  const stats = calculateStats()

  return (
    <div className="dashboard-container">
      <nav className="nav-bar">
        <div className="nav-bar-content">
          <div className="flex items-center gap-3">
            <div className="stat-card-icon stat-card-icon-secondary w-10 h-10 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="nav-bar-title">Billing Reports</h1>
              <p className="text-sm text-slate-300">Financial analytics and insights</p>
            </div>
          </div>
          <div className="nav-bar-user flex gap-2">
            <Link to="/receptionist/billing" className="btn btn-secondary btn-md inline-flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </Link>
            <button type="button" onClick={exportToCSV} className="btn btn-secondary btn-md inline-flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <button type="button" onClick={downloadReport} className="btn btn-primary btn-md inline-flex items-center gap-2">
              <Download className="w-4 h-4" />
              Download Report
            </button>
          </div>
        </div>
      </nav>

      <main className="page-container">
        <div className="card mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="form-group">
              <label className="form-label">Date Range</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="form-input "
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
                <option value="all">All Time</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="form-input"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Payment Method</label>
              <select
                value={paymentMethodFilter}
                onChange={(e) => setPaymentMethodFilter(e.target.value)}
                className="form-input"
              >
                <option value="all">All Methods</option>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="online">Online</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Search</label>
              <input
                type="text"
                placeholder="Patient or Invoice #"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input form-input"
              />
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="card">
            <div className="flex items-center space-x-3 mb-4">
              <FileText className="w-6 h-6 text-primary-500" />
              <h3 className="text-lg font-semibold text-heading">Total Invoices</h3>
            </div>
            <p className="text-3xl font-bold text-heading">{stats.totalInvoices}</p>
            <p className="text-sm text-muted mt-2">In selected period</p>
          </div>

          <div className="card">
            <div className="flex items-center space-x-3 mb-4">
              <DollarSign className="w-6 h-6 text-secondary-500" />
              <h3 className="text-lg font-semibold text-heading">Total Amount</h3>
            </div>
            <p className="text-3xl font-bold text-heading">Rs.{stats.totalAmount.toLocaleString()}</p>
            <p className="text-sm text-muted mt-2">Invoice value</p>
          </div>

          <div className="card">
            <div className="flex items-center space-x-3 mb-4">
              <TrendingUp className="w-6 h-6 text-primary-500" />
              <h3 className="text-lg font-semibold text-heading">Collection Rate</h3>
            </div>
            <p className="text-3xl font-bold text-heading">{stats.collectionRate.toFixed(1)}%</p>
            <p className="text-sm text-muted mt-2">Paid invoices</p>
          </div>

          <div className="card">
            <div className="flex items-center space-x-3 mb-4">
              <CheckCircle className="w-6 h-6 text-primary-500" />
              <h3 className="text-lg font-semibold text-heading">Total Payments</h3>
            </div>
            <p className="text-3xl font-bold text-heading">Rs.{stats.totalPaymentAmount.toLocaleString()}</p>
            <p className="text-sm text-muted mt-2">Received amount</p>
          </div>
        </div>

        {/* Detailed Statistics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Invoice Status Breakdown */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              <PieChart className="w-5 h-5 text-primary-400" />
              <span>Invoice Status Breakdown</span>
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-secondary-400" />
                  <span>Paid</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{stats.paidInvoices}</span>
                  <span className="text-sm text-muted">({stats.totalInvoices > 0 ? ((stats.paidInvoices / stats.totalInvoices) * 100).toFixed(1) : 0}%)</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-accent-400" />
                  <span>Pending</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{stats.pendingInvoices}</span>
                  <span className="text-sm text-muted">({stats.totalInvoices > 0 ? ((stats.pendingInvoices / stats.totalInvoices) * 100).toFixed(1) : 0}%)</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <span>Overdue</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{stats.overdueInvoices}</span>
                  <span className="text-sm text-muted">({stats.totalInvoices > 0 ? ((stats.overdueInvoices / stats.totalInvoices) * 100).toFixed(1) : 0}%)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method Breakdown */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              <Activity className="w-5 h-5 text-indigo-400" />
              <span>Payment Methods</span>
            </h3>
            <div className="space-y-3">
              {Object.entries(stats.paymentMethods).map(([method, amount]) => (
                <div key={method} className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    {method === 'cash' && <Banknote className="w-4 h-4 text-secondary-400" />}
                    {method === 'card' && <CreditCard className="w-4 h-4 text-primary-400" />}
                    {method === 'online' && <Globe className="w-4 h-4 text-indigo-400" />}
                    <span className="capitalize">{method}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">Rs.{amount.toLocaleString()}</span>
                    <span className="text-sm text-muted">({stats.totalPaymentAmount > 0 ? ((amount / stats.totalPaymentAmount) * 100).toFixed(1) : 0}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {getFilteredData().filteredPayments.slice(0, 10).map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-4 rounded-xl border border-neutral-200 bg-neutral-50/80">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-secondary-500 text-white/20 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-secondary-400" />
                  </div>
                  <div>
                    <p className="font-medium">{payment.patientName}</p>
                    <p className="text-sm text-slate-500">Invoice #{payment.invoiceNumber}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-secondary-400">Rs.{payment.amount?.toLocaleString()}</p>
                  <p className="text-sm text-muted capitalize">{payment.method}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
