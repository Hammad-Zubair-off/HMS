import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../../firebase/config'
import { 
  ArrowLeft, 
  Download, 
  Printer, 
  FileText,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  Building,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react'

export default function InvoicePdfGenerator() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [invoice, setInvoice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generatingPdf, setGeneratingPdf] = useState(false)

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const invoiceDoc = await getDoc(doc(db, 'invoices', id))
        if (invoiceDoc.exists()) {
          setInvoice({ id: invoiceDoc.id, ...invoiceDoc.data() })
        } else {
          alert('Invoice not found')
          navigate('/receptionist/billing')
        }
        setLoading(false)
      } catch (error) {
        console.error('Error fetching invoice:', error)
        alert('Error fetching invoice')
        setLoading(false)
      }
    }

    if (id) {
      fetchInvoice()
    }
  }, [id, navigate])

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

  // Generate PDF
  const generatePDF = async () => {
    setGeneratingPdf(true)
    try {
      // Create a new window for printing
      const printWindow = window.open('', '_blank')
      
      // Generate HTML content for the invoice
      const invoiceHTML = generateInvoiceHTML()
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Invoice #${invoice.invoiceNumber}</title>
          <style>
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              color: #333;
              line-height: 1.6;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .clinic-name {
              font-size: 24px;
              font-weight: bold;
              color: #0d9488; /* Teal-600 */
              margin-bottom: 5px;
            }
            .clinic-info {
              font-size: 14px;
              color: #666;
            }
            .invoice-details {
              display: flex;
              justify-content: space-between;
              margin-bottom: 30px;
            }
            .patient-info, .invoice-info {
              flex: 1;
            }
            .section-title {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 10px;
              color: #0d9488; /* Teal-600 */
            }
            .info-row {
              margin-bottom: 8px;
            }
            .label {
              font-weight: bold;
              color: #555;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            .items-table th, .items-table td {
              border: 1px solid #ddd;
              padding: 12px;
              text-align: left;
            }
            .items-table th {
              background-color: #f8f9fa;
              font-weight: bold;
            }
            .amount-column {
              text-align: right;
            }
            .summary {
              margin-top: 30px;
              text-align: right;
            }
            .summary-row {
              margin-bottom: 10px;
            }
            .total {
              font-size: 18px;
              font-weight: bold;
              color: #10b981; /* Emerald-500 */
              border-top: 2px solid #333;
              padding-top: 10px;
            }
            .status-badge {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: bold;
              text-transform: uppercase;
            }
            .status-paid { background-color: #d1fae5; color: #047857; } /* Emerald-100/700 */
            .status-pending { background-color: #fef3c7; color: #b45309; } /* Amber-100/700 */
            .status-overdue { background-color: #fee2e2; color: #b91c1c; } /* Red-100/700 */
            .footer {
              margin-top: 40px;
              text-align: center;
              font-size: 12px;
              color: #666;
              border-top: 1px solid #ddd;
              padding-top: 20px;
            }
            .print-button {
              background-color: #0d9488;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 5px;
              cursor: pointer;
              font-size: 16px;
              margin: 20px 0;
            }
            .print-button:hover {
              background-color: #0f766e;
            }
          </style>
        </head>
        <body>
          ${invoiceHTML}
          <div class="no-print" style="text-align: center;">
            <button class="print-button" onclick="window.print()">Print Invoice</button>
          </div>
        </body>
        </html>
      `)
      
      printWindow.document.close()
      
      // Wait for content to load then print
      printWindow.onload = () => {
        printWindow.print()
      }
      
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Error generating PDF. Please try again.')
    } finally {
      setGeneratingPdf(false)
    }
  }

  // Generate invoice HTML content
  const generateInvoiceHTML = () => {
    if (!invoice) return ''

    return `
      <div class="header">
        <div class="clinic-name">City Medical Center</div>
        <div class="clinic-info">
          123 Healthcare Avenue, Medical District<br>
          Phone: +92 98765 43210 | Email: info@citymedical.com<br>
          GSTIN: 27ABCDE1234F1Z5
        </div>
      </div>

      <div class="invoice-details">
        <div class="patient-info">
          <div class="section-title">Bill To:</div>
          <div class="info-row">
            <span class="label">Name:</span> ${invoice.patientName || 'N/A'}
          </div>
          <div class="info-row">
            <span class="label">Phone:</span> ${invoice.patientPhone || 'N/A'}
          </div>
          <div class="info-row">
            <span class="label">Email:</span> ${invoice.patientEmail || 'N/A'}
          </div>
          <div class="info-row">
            <span class="label">Address:</span> ${invoice.patientAddress || 'N/A'}
          </div>
        </div>

        <div class="invoice-info">
          <div class="section-title">Invoice Details:</div>
          <div class="info-row">
            <span class="label">Invoice #:</span> ${invoice.invoiceNumber}
          </div>
          <div class="info-row">
            <span class="label">Date:</span> ${invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString() : 'N/A'}
          </div>
          <div class="info-row">
            <span class="label">Due Date:</span> ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}
          </div>
          <div class="info-row">
            <span class="label">Status:</span> 
            <span class="status-badge status-${invoice.status}">${invoice.status?.charAt(0).toUpperCase() + invoice.status?.slice(1)}</span>
          </div>
        </div>
      </div>

      <table class="items-table">
        <thead>
          <tr>
            <th>Description</th>
            <th class="amount-column">Quantity</th>
            <th class="amount-column">Unit Price (Rs.)</th>
            <th class="amount-column">Amount (Rs.)</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.items?.map(item => `
            <tr>
              <td>${item.description || 'N/A'}</td>
              <td class="amount-column">${item.quantity || 0}</td>
              <td class="amount-column">${item.unitPrice?.toLocaleString() || '0'}</td>
              <td class="amount-column">${item.amount?.toLocaleString() || '0'}</td>
            </tr>
          `).join('') || '<tr><td colspan="4" style="text-align: center;">No items</td></tr>'}
        </tbody>
      </table>

      <div class="summary">
        <div class="summary-row">
          <span class="label">Subtotal:</span> Rs.${invoice.subtotal?.toLocaleString() || '0'}
        </div>
        <div class="summary-row">
          <span class="label">Tax (${invoice.taxRate || 0}%):</span> Rs.${invoice.taxAmount?.toLocaleString() || '0'}
        </div>
        ${invoice.discount > 0 ? `
          <div class="summary-row">
            <span class="label">Discount:</span> -Rs.${invoice.discount?.toLocaleString() || '0'}
          </div>
        ` : ''}
        <div class="summary-row total">
          <span class="label">Total Amount:</span> Rs.${invoice.totalAmount?.toLocaleString() || '0'}
        </div>
      </div>

      ${invoice.notes ? `
        <div style="margin-top: 30px;">
          <div class="section-title">Notes:</div>
          <p>${invoice.notes}</p>
        </div>
      ` : ''}

      <div class="footer">
        <p>Thank you for choosing City Medical Center!</p>
        <p>For any queries, please contact us at +92 98765 43210</p>
        <p>This is a computer generated invoice and does not require a signature.</p>
      </div>
    `
  }

  if (loading) {
    return (
      <div className="dashboard-container flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4" />
          <p className="text-muted">Loading invoice...</p>
        </div>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="dashboard-container flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted">Invoice not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      <nav className="nav-bar">
        <div className="nav-bar-content">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => navigate('/receptionist/billing')} className="btn btn-ghost btn-sm inline-flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <div className="stat-card-icon stat-card-icon-secondary w-10 h-10 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="nav-bar-title">Invoice Preview</h1>
              <p className="text-sm text-slate-300">#{invoice.invoiceNumber}</p>
            </div>
          </div>
          <div className="nav-bar-user flex gap-2">
            <button
              type="button"
              onClick={generatePDF}
              disabled={generatingPdf}
              className="btn btn-secondary btn-md inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generatingPdf ? <div className="spinner w-4 h-4" /> : <Download className="w-4 h-4" />}
              <span>{generatingPdf ? 'Generating...' : 'Generate PDF'}</span>
            </button>
            <button type="button" onClick={() => window.print()} className="btn btn-primary btn-md inline-flex items-center gap-2">
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="page-container max-w-4xl mx-auto">
        {/* Invoice Preview */}
        <div className="bg-white text-gray-900 rounded-2xl shadow-2xl overflow-hidden">
          {/* Invoice Header */}
          <div className="bg-gradient-to-r from-teal-600 to-teal-800 text-slate-900 p-8 text-center">
            <h1 className="text-3xl font-bold mb-2">City Medical Center</h1>
            <p className="text-teal-100">123 Healthcare Avenue, Medical District</p>
            <p className="text-teal-100">Phone: +92 98765 43210 | Email: info@citymedical.com</p>
            <p className="text-teal-100 text-sm">GSTIN: 27ABCDE1234F1Z5</p>
          </div>

          {/* Invoice Content */}
          <div className="p-8">
            {/* Invoice Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <h2 className="text-lg font-semibold text-teal-600 mb-4 flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Bill To</span>
                </h2>
                <div className="space-y-2">
                  <p><span className="font-medium">Name:</span> {invoice.patientName || 'N/A'}</p>
                  <p><span className="font-medium">Phone:</span> {invoice.patientPhone || 'N/A'}</p>
                  <p><span className="font-medium">Email:</span> {invoice.patientEmail || 'N/A'}</p>
                  <p><span className="font-medium">Address:</span> {invoice.patientAddress || 'N/A'}</p>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-teal-600 mb-4 flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>Invoice Details</span>
                </h2>
                <div className="space-y-2">
                  <p><span className="font-medium">Invoice #:</span> <span className="font-mono text-teal-600">{invoice.invoiceNumber}</span></p>
                  <p><span className="font-medium">Date:</span> {invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString() : 'N/A'}</p>
                  <p><span className="font-medium">Due Date:</span> {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}</p>
                  <p>
                    <span className="font-medium">Status:</span> 
                    <span className={`ml-2 px-3 py-1 rounded-full text-xs font-medium ${
                      invoice.status === 'paid' 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : invoice.status === 'pending'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {invoice.status?.charAt(0).toUpperCase() + invoice.status?.slice(1)}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Invoice Items */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-teal-600 mb-4">Invoice Items</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-4 py-3 text-left font-medium">Description</th>
                      <th className="border border-gray-300 px-4 py-3 text-center font-medium">Quantity</th>
                      <th className="border border-gray-300 px-4 py-3 text-right font-medium">Unit Price (Rs.)</th>
                      <th className="border border-gray-300 px-4 py-3 text-right font-medium">Amount (Rs.)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items?.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-4 py-3">{item.description || 'N/A'}</td>
                        <td className="border border-gray-300 px-4 py-3 text-center">{item.quantity || 0}</td>
                        <td className="border border-gray-300 px-4 py-3 text-right">{item.unitPrice?.toLocaleString() || '0'}</td>
                        <td className="border border-gray-300 px-4 py-3 text-right font-medium">{item.amount?.toLocaleString() || '0'}</td>
                      </tr>
                    )) || (
                      <tr>
                        <td colSpan="4" className="border border-gray-300 px-4 py-3 text-center text-gray-500">
                          No items
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Invoice Summary */}
            <div className="flex justify-end">
              <div className="w-80 space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium">Subtotal:</span>
                  <span>Rs.{invoice.subtotal?.toLocaleString() || '0'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Tax ({invoice.taxRate || 0}%):</span>
                  <span>Rs.{invoice.taxAmount?.toLocaleString() || '0'}</span>
                </div>
                {invoice.discount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span className="font-medium">Discount:</span>
                    <span>-Rs.{invoice.discount?.toLocaleString() || '0'}</span>
                  </div>
                )}
                <div className="border-t border-gray-300 pt-3">
                  <div className="flex justify-between text-xl font-bold text-emerald-600">
                    <span>Total Amount:</span>
                    <span>Rs.{invoice.totalAmount?.toLocaleString() || '0'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            {invoice.notes && (
              <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-700 mb-2">Notes:</h3>
                <p className="text-gray-600">{invoice.notes}</p>
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 text-center text-gray-500 text-sm">
              <p>Thank you for choosing City Medical Center!</p>
              <p>For any queries, please contact us at +92 98765 43210</p>
              <p>This is a computer generated invoice and does not require a signature.</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 flex justify-center space-x-4">
          <button
            onClick={() => navigate('/receptionist/billing')}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-slate-900 rounded-lg transition-colors"
          >
            Back to Billing
          </button>
          <button
            onClick={() => navigate(`/receptionist/billing/invoices/${invoice.id}`)}
            className="px-6 py-3 bg-primary-500 text-white hover:bg-primary-600 text-slate-900 rounded-lg transition-colors"
          >
            View Invoice Details
          </button>
        </div>
      </main>
    </div>
  )
}
