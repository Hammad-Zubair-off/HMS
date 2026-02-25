import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { FaCircleCheck, FaCircleExclamation, FaArrowsRotate, FaEnvelope } from 'react-icons/fa6'

export default function EmailVerificationStatus() {
  const { currentUser, resendVerificationEmail } = useAuth()
  const [isChecking, setIsChecking] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const handleRefreshStatus = async () => {
    if (!currentUser) return
    
    setIsChecking(true)
    try {
      await currentUser.reload()
      window.location.reload()
    } catch (error) {
      console.error('Error refreshing verification status:', error)
    } finally {
      setIsChecking(false)
    }
  }

  const handleResendEmail = async () => {
    if (!currentUser) return
    
    setIsSending(true)
    setEmailSent(false)
    try {
      await resendVerificationEmail()
      setEmailSent(true)
      setTimeout(() => setEmailSent(false), 3000)
    } catch (error) {
      console.error('Error resending verification email:', error)
    } finally {
      setIsSending(false)
    }
  }

  if (!currentUser) return null

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        {currentUser.emailVerified ? (
          <FaCircleCheck className="icon-sm text-success" />
        ) : (
          <FaCircleExclamation className="icon-sm text-error" />
        )}
        <span className={`font-medium ${
          currentUser.emailVerified ? 'text-success' : 'text-error'
        }`}>
          {currentUser.emailVerified ? 'Verified' : 'Not Verified'}
        </span>
      </div>
      
      {!currentUser.emailVerified && (
        <div className="flex gap-2">
          <button 
            onClick={handleRefreshStatus}
            disabled={isChecking}
            className="btn-outline-primary rounded-lg btn-sm"
          >
            {isChecking ? (
              <div className="flex items-center gap-2">
                <div className="spinner w-3 h-3"></div>
                <span>Checking...</span>
              </div>
            ) : (
              <div className="flex items-center rounded-lg gap-2">
                <FaArrowsRotate className="icon-sm" />
                <span>Check Again</span>
              </div>
            )}
          </button>
          
          <button 
            onClick={handleResendEmail}
            disabled={isSending}
            className="btn-secondary rounded-lg btn-sm"
          >
            {isSending ? (
              <div className="flex items-center gap-2">
                <div className="spinner w-3 h-3"></div>
                <span>Sending...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <FaEnvelope className="icon-sm" />
                <span>Resend Email</span>
              </div>
            )}
          </button>
        </div>
      )}
      
      {emailSent && (
        <span className="badge-success text-xs">
          ✓ Verification email sent!
        </span>
      )}
    </div>
  )
}
