import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FaEnvelope, FaArrowLeft, FaCircleCheck, FaTriangleExclamation, FaCircleNotch, FaArrowRight, FaStar } from 'react-icons/fa6'
import { useAuth } from '../../hooks/useAuth'

export default function ForgotPasswordForm() {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      await resetPassword(email.trim());
      setIsSubmitted(true);
    } catch (error) {
      console.error('Password reset error:', error);
      let errorMessage = 'Failed to send reset email. Please try again.';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please try again later.';
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Success state
  if (isSubmitted) {
    return (
      <div className="min-h-screen dashboard-container flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="card">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-success rounded-full mb-4">
                <FaCircleCheck className="w-8 h-8 text-white" />
              </div>
              <h2 className="section-title mb-2">Check Your Email</h2>
              <p className="text-body">
                If an account with <strong>{email}</strong> exists, we've sent a password reset link
              </p>
            </div>
            
            <div className="card bg-primary-50 border-primary-200 mb-6">
              <h4 className="text-heading text-sm mb-3">What happens next?</h4>
              <ul className="text-sm text-body space-y-2">
                <li>• Check your email inbox (and spam folder)</li>
                <li>• Click the reset link in the email</li>
                <li>• Create a new password</li>
                <li>• Sign in with your new password</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <button 
                onClick={() => setIsSubmitted(false)}
                className="btn-outline-primary btn-md w-full"
              >
                <FaEnvelope className="icon-sm mr-2" />
                Resend Email
              </button>
              <Link to="/login" className="block">
                <button className="btn-ghost btn-md w-full">
                  <FaArrowLeft className="icon-sm mr-2" />
                  Back to Sign In
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main form
  return (
    <div className="min-h-screen dashboard-container flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-primary rounded-2xl mb-6 shadow-glow-primary">
            <FaStar className="w-10 h-10 text-white" />
          </div>
          <h1 className="page-title text-3xl mb-2">Forgot Your Password?</h1>
          <p className="page-description">
            Enter your email address and we'll send you a link to reset your password
          </p>
        </div>

        {/* Form Card */}
        <div className="card">
          <form onSubmit={handleSubmit} className="form-container">
            {/* Email Field */}
            <div className="form-group">
              <label className="form-label form-label-required">Email Address</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors">
                  <FaEnvelope className="icon-sm" />
                </div>
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={` pl-11 ${error ? '-error' : ''}`}
                  disabled={isLoading}
                  required
                />
              </div>
              {error && (
                <div className="form-error flex items-center">
                  <FaTriangleExclamation className="icon-sm mr-2" />
                  {error}
                </div>
              )}
              
              {/* Helpful information */}
              <div className="card bg-slate-50 border-slate-200 mt-3">
                <p className="text-sm font-semibold text-slate-700 mb-2">What happens next?</p>
                <ul className="text-xs text-muted space-y-1">
                  <li>• We'll process your password reset request</li>
                  <li>• If an account exists, we'll send a reset link</li>
                  <li>• Check your inbox (and spam folder)</li>
                  <li>• Click the link to create a new password</li>
                </ul>
              </div>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              className="btn-primary btn-lg w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="spinner w-5 h-5"></div>
                  <span>Verifying & Sending...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <span>Send Reset Link</span>
                  <FaArrowRight className="icon-sm" />
                </div>
              )}
            </button>
          </form>

          {/* Back to Login */}
          <div className="text-center mt-6">
            <Link 
              to="/login" 
              className="btn-ghost btn-md"
            >
              <FaArrowLeft className="icon-sm mr-2" />
              Back to Sign In
            </Link>
          </div>
        </div>

        <div className="text-center mt-6">
          <p className="text-sm text-muted">
            Remember your password?{' '}
            <Link 
              to="/login" 
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
