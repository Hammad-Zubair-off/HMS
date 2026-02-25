import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { FaEnvelope, FaCircleCheck, FaArrowRight, FaStar, FaUserDoctor, FaBellConcierge, FaClock, FaShieldHalved } from 'react-icons/fa6'

export default function VerifyEmail() {
  const location = useLocation()
  const navigate = useNavigate()
  const [countdown, setCountdown] = useState(20)
  const [isRedirecting, setIsRedirecting] = useState(false)
  
  const { role, email, fullName } = location.state || { role: 'staff', email: 'user@example.com', fullName: 'User' }
  
  const roleMeta = {
    doctor: { title: 'Doctor', icon: FaUserDoctor, color: 'primary' },
    receptionist: { title: 'Receptionist', icon: FaBellConcierge, color: 'secondary' }
  }
  
  const currentRole = roleMeta[role] || { title: 'Staff', icon: FaUserDoctor, color: 'primary' }
  const IconComponent = currentRole.icon

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setIsRedirecting(true)
          setTimeout(() => navigate('/login'), 1000)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [navigate])

  const handleManualRedirect = () => {
    setIsRedirecting(true)
    setTimeout(() => navigate('/login'), 500)
  }

  return (
    <div className="min-h-screen dashboard-container flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-primary rounded-2xl mb-6 shadow-glow-primary">
            <FaEnvelope className="w-10 h-10 text-white" />
          </div>
          <h1 className="page-title text-4xl mb-3">Verify Your Email</h1>
          <p className="page-description">
            We've sent a verification link to your email
          </p>
        </div>

        {/* Main Card */}
        <div className="card">
          {/* Success Animation */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-success rounded-full mb-4">
              <FaCircleCheck className="w-8 h-8 text-white" />
            </div>
            <h2 className="section-title mb-2">Account Created Successfully!</h2>
            <p className="text-body">
              Welcome to our healthcare team, <span className="text-primary-600 font-semibold">{fullName}</span>
            </p>
          </div>

          {/* Role Display */}
          <div className="card bg-primary-50 border-primary-200 mb-6">
            <div className="flex items-center justify-center space-x-3 mb-3">
              <div className={`stat-card-icon stat-card-icon-${currentRole.color}`}>
                <IconComponent className="icon-md" />
              </div>
              <span className="text-lg font-semibold text-primary-700">
                {currentRole.title}
              </span>
            </div>
            <p className="text-center text-body text-sm">
              Your account has been created with {currentRole.title.toLowerCase()} privileges
            </p>
          </div>

          {/* Email Info */}
          <div className="card bg-primary-50 border-primary-200 mb-6">
            <div className="flex items-center space-x-3 mb-3">
              <FaEnvelope className="icon-md text-primary-600" />
              <span className="font-semibold text-primary-700">Verification Email Sent</span>
            </div>
            <p className="text-body text-sm mb-3">
              We've sent a verification link to:
            </p>
            <div className="bg-white rounded-lg p-3 text-center border border-primary-200">
              <span className="text-primary-700 font-mono text-sm break-all">{email}</span>
            </div>
          </div>

          {/* Countdown Timer */}
          <div className="card bg-gradient-primary bg-opacity-10 border-primary-300 mb-6">
            <div className="flex items-center justify-center space-x-3 mb-3">
              <FaClock className="icon-md text-primary-600" />
              <span className="font-semibold text-primary-700">Auto-redirect in</span>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary-600 mb-2">
                {countdown}s
              </div>
              <p className="text-body text-sm">
                You'll be redirected to login automatically
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button 
              onClick={handleManualRedirect}
              disabled={isRedirecting}
              className="btn-primary btn-lg w-full"
            >
              {isRedirecting ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="spinner w-5 h-5"></div>
                  <span>Redirecting...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <FaArrowRight className="icon-sm" />
                  <span>Go to Login Now</span>
                </div>
              )}
            </button>
            
            <button 
              onClick={() => window.location.reload()}
              className="btn-outline btn-md w-full"
            >
              <FaShieldHalved className="icon-sm mr-2" />
              Resend Verification Email
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8">
          <div className="card bg-slate-50 border-slate-200">
            <h3 className="text-lg font-semibold text-primary-600 mb-3">What to do next?</h3>
            <div className="space-y-2 text-sm text-body">
              <div className="flex items-center space-x-2">
                <FaStar className="icon-sm text-primary-500" />
                <span>Check your email inbox (and spam folder)</span>
              </div>
              <div className="flex items-center space-x-2">
                <FaStar className="icon-sm text-primary-500" />
                <span>Click the verification link in the email</span>
              </div>
              <div className="flex items-center space-x-2">
                <FaStar className="icon-sm text-primary-500" />
                <span>Return here and sign in with your credentials</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-muted">
            Secure verification for your healthcare workspace
          </p>
        </div>
      </div>
    </div>
  )
}
