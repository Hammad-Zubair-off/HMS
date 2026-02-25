import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from '../../../firebase/config'
import LogoutButton from '../../../components/LogoutButton'
import { 
  DollarSign, 
  FileText, 
  CreditCard, 
  Banknote, 
  Globe, 
  TrendingUp, 
  Calendar,
  Plus,
  Eye,
  Download
} from 'lucide-react'

export default function BillingDashboard() {
  const [stats, setStats] = useState({
    totalInvoices: 0,
    pendingPayments: 0,
    totalRevenue: 0,
    todayRevenue: 0,
    cashPayments: 0,
    cardPayments: 0,
    onlinePayments: 0
  })
  const [recentInvoices, setRecentInvoices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBillingData = async () => {
      try {
        const invoicesRef = collection(db, 'invoices')
        const invoicesQuery = query(invoicesRef, orderBy('createdAt', 'desc'))
        
        const unsubscribe = onSnapshot(invoicesQuery, (snapshot) => {
          const invoicesData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          
          const totalInvoices = invoicesData.length
          const pendingPayments = invoicesData.filter(inv => inv.status === 'pending').length
          const totalRevenue = invoicesData.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0)
          
          const today = new Date().toISOString().split('T')[0]
          const todayRevenue = invoicesData
            .filter(inv => inv.createdAt?.toDate?.()?.toISOString?.()?.split('T')[0] === today)
            .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0)
          
          const cashPayments = invoicesData
            .filter(inv => inv.paymentMethod === 'cash' && inv.status === 'paid')
            .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0)
          
          const cardPayments = invoicesData
            .filter(inv => inv.paymentMethod === 'card' && inv.status === 'paid')
            .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0)
          
          const onlinePayments = invoicesData
            .filter(inv => inv.paymentMethod === 'online' && inv.status === 'paid')
            .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0)
          
          setStats({
            totalInvoices,
            pendingPayments,
            totalRevenue,
            todayRevenue,
            cashPayments,
            cardPayments,
            onlinePayments
          })
          
          setRecentInvoices(invoicesData.slice(0, 5))
          setLoading(false)
        })
        
        return unsubscribe
      } catch (error) {
        console.error('Error fetching billing data:', error)
        setLoading(false)
      }
    }
    
    fetchBillingData()
  }, [])

  if (loading) {
    return (
      <div className="dashboard-container flex items-center justify-center">
        <div className="text-center">
          <div className="spinner w-12 h-12 mx-auto mb-4"></div>
          <p className="text-muted">Loading billing data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      {/* Premium Navigation Bar */}
      <header className="nav-bar">
        <div className="nav-bar-content">
          <div className="flex items-center space-x-4">
            <div className="stat-card-icon stat-card-icon-success">
              <DollarSign className="icon-lg" />
            </div>
            <div>
              <h1 className="nav-bar-title">Billing & Payment Dashboard</h1>
              <p className="text-sm text-slate-300">Manage invoices, payments, and billing</p>
            </div>
          </div>
          <div className="nav-bar-user flex items-center gap-2">
            <Link to="/receptionist/billing/create" className="btn btn-primary btn-md inline-flex items-center gap-2">
              <Plus className="icon-sm" />
              Create Invoice
            </Link>
            <Link to="/receptionist/billing/reports" className="btn btn-secondary btn-md inline-flex items-center gap-2">
              <Download className="icon-sm" />
              Reports
            </Link>
            <Link to="/receptionist" className="btn btn-outline btn-md">
              Back to Dashboard
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="page-container">
        {/* Page Header */}
        <div className="page-header">
          <h1 className="page-title">Financial Overview</h1>
          <p className="page-description">Monitor revenue, payments, and billing operations</p>
        </div>

        {/* Premium Stat Cards */}
        <div className="grid-stats mb-8">
          <div className="stat-card">
            <div className="stat-card-header">
              <div className="stat-card-icon stat-card-icon-primary">
                <FileText className="icon-lg" />
              </div>
            </div>
            <p className="stat-card-title">Total Invoices</p>
            <p className="stat-card-value">{stats.totalInvoices}</p>
            <p className="text-muted text-sm mt-1">All time</p>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <div className="stat-card-icon stat-card-icon-amber">
                <DollarSign className="icon-lg" />
              </div>
            </div>
            <p className="stat-card-title">Pending Payments</p>
            <p className="stat-card-value">{stats.pendingPayments}</p>
            <p className="text-muted text-sm mt-1">Awaiting payment</p>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <div className="stat-card-icon stat-card-icon-secondary">
                <TrendingUp className="icon-lg" />
              </div>
            </div>
            <p className="stat-card-title">Total Revenue</p>
            <p className="stat-card-value">Rs.{stats.totalRevenue.toLocaleString()}</p>
            <p className="text-muted text-sm mt-1">All time</p>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <div className="stat-card-icon stat-card-icon-success">
                <Calendar className="icon-lg" />
              </div>
            </div>
            <p className="stat-card-title">Today's Revenue</p>
            <p className="stat-card-value">Rs.{stats.todayRevenue.toLocaleString()}</p>
            <p className="text-muted text-sm mt-1">Today</p>
          </div>
        </div>

        {/* Payment Methods Breakdown */}
        <div className="section-container mb-8">
          <div className="section-header">
            <div>
              <h2 className="section-title">Payment Methods</h2>
              <p className="section-subtitle">Breakdown by payment type</p>
            </div>
          </div>

          <div className="grid-cards">
            <div className="stat-card">
              <div className="stat-card-header">
                <div className="stat-card-icon stat-card-icon-secondary">
                  <Banknote className="icon-lg" />
                </div>
              </div>
              <p className="stat-card-title">Cash Payments</p>
              <p className="stat-card-value">Rs.{stats.cashPayments.toLocaleString()}</p>
              <p className="text-muted text-sm mt-1">Total cash received</p>
            </div>

            <div className="stat-card">
              <div className="stat-card-header">
                <div className="stat-card-icon stat-card-icon-primary">
                  <CreditCard className="icon-lg" />
                </div>
              </div>
              <p className="stat-card-title">Card Payments</p>
              <p className="stat-card-value">Rs.{stats.cardPayments.toLocaleString()}</p>
              <p className="text-muted text-sm mt-1">Total card payments</p>
            </div>

            <div className="stat-card">
              <div className="stat-card-header">
                <div className="stat-card-icon stat-card-icon-secondary">
                  <Globe className="icon-lg" />
                </div>
              </div>
              <p className="stat-card-title">Online Payments</p>
              <p className="stat-card-value">Rs.{stats.onlinePayments.toLocaleString()}</p>
              <p className="text-muted text-sm mt-1">Total online payments</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="section-container mb-8">
          <div className="section-header">
            <div>
              <h2 className="section-title">Quick Actions</h2>
              <p className="section-subtitle">Access frequently used features</p>
            </div>
          </div>

          <div className="grid-cards">
            <Link to="/receptionist/billing/create" className="card action-card p-4">
              <div className="flex items-start space-x-4">
                <div className="stat-card-icon stat-card-icon-secondary shrink-0">
                  <Plus className="icon-lg" />
                </div>
                <div className="flex-1">
                  <h3 className="text-heading text-lg mb-1">Create Invoice</h3>
                  <p className="text-muted text-sm leading-relaxed">Generate new invoice</p>
                </div>
              </div>
            </Link>

            <Link to="/receptionist/billing/invoices" className="card action-card p-4">
              <div className="flex items-start space-x-4">
                <div className="stat-card-icon stat-card-icon-primary shrink-0">
                  <FileText className="icon-lg" />
                </div>
                <div className="flex-1">
                  <h3 className="text-heading text-lg mb-1">View Invoices</h3>
                  <p className="text-muted text-sm leading-relaxed">Manage all invoices</p>
                </div>
              </div>
            </Link>

            <Link to="/receptionist/billing/payments" className="card action-card p-4">
              <div className="flex items-start space-x-4">
                <div className="stat-card-icon stat-card-icon-primary shrink-0">
                  <CreditCard className="icon-lg" />
                </div>
                <div className="flex-1">
                  <h3 className="text-heading text-lg mb-1">Process Payments</h3>
                  <p className="text-muted text-sm leading-relaxed">Handle payments</p>
                </div>
              </div>
            </Link>

            <Link to="/receptionist/billing/reports" className="card action-card p-4">
              <div className="flex items-start space-x-4">
                <div className="stat-card-icon stat-card-icon-success shrink-0">
                  <Download className="icon-lg" />
                </div>
                <div className="flex-1">
                  <h3 className="text-heading text-lg mb-1">Download Reports</h3>
                  <p className="text-muted text-sm leading-relaxed">Generate reports</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Invoices Table */}
        <div className="card">
          <div className="section-header mb-6">
            <div>
              <h2 className="section-title">Recent Invoices</h2>
              <p className="section-subtitle">Latest billing transactions</p>
            </div>
            <Link to="/receptionist/billing/invoices" className="btn btn-outline-primary btn-sm">
              View All →
            </Link>
          </div>
          
          {recentInvoices.length === 0 ? (
            <div className="table-empty ">
              <p className="table-empty-text">No invoices found</p>
            </div>
          ) : (
            <div className="table-container">
              <div className="table-wrapper">
                <table className="table">
                  <thead className="table-header">
                    <tr className="table-header-row">
                      <th className="table-header-cell">Invoice #</th>
                      <th className="table-header-cell">Patient</th>
                      <th className="table-header-cell">Amount</th>
                      <th className="table-header-cell">Status</th>
                      <th className="table-header-cell">Date</th>
                      <th className="table-header-cell text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="table-body">
                    {recentInvoices.map((invoice) => (
                      <tr key={invoice.id} className="table-row">
                        <td className="table-cell">
                          <span className="font-mono font-semibold text-primary-600">#{invoice.invoiceNumber}</span>
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
                        <td className="table-cell text-muted">
                          {invoice.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                        </td>
                        <td className="table-cell text-right">
                          <div className="flex justify-end gap-2">
                            <Link to={`/receptionist/billing/invoices/${invoice.id}`} className="btn btn-ghost btn-icon btn-sm" title="View Invoice">
                              <Eye className="icon-sm" />
                            </Link>
                            <Link to={`/receptionist/billing/invoices/${invoice.id}/download`} className="btn btn-ghost btn-icon btn-sm" title="Download PDF">
                              <Download className="icon-sm" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
