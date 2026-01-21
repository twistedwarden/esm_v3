import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import { useAuthStore } from '../store/v1authStore';
import { Skeleton } from '../components/ui/Skeleton';
import { ClickOrderCaptcha } from '../components/ClickOrderCaptcha';
import { getAuthServiceUrl, API_CONFIG } from '../config/api';

// Google OAuth types
declare global {
  interface Window {
    google: {
      accounts: {
        oauth2: {
          initCodeClient: (config: any) => {
            requestCode: () => void;
          };
        };
      };
    };
  }
}

export const GatewayLogin: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [showOtp, setShowOtp] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [showPrivacy, setShowPrivacy] = useState(false)
  const [hasReadTerms, setHasReadTerms] = useState(false)
  const [hasReadPrivacy, setHasReadPrivacy] = useState(false)
  const [showGoogleRegistration, setShowGoogleRegistration] = useState(false)
  const [googleUserData, setGoogleUserData] = useState<any>(null)
  const [googleRegistrationData, setGoogleRegistrationData] = useState({
    mobile: '',
    birthdate: '',
    address: '',
    houseNumber: '',
    street: '',
    barangay: ''
  })
  const [otpTimer, setOtpTimer] = useState(600)
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', ''])
  const [otpEmail, setOtpEmail] = useState('')
  const [otpType, setOtpType] = useState<'registration' | 'login'>('registration')
  const [showPassword, setShowPassword] = useState(false)
  const [showRegPassword, setShowRegPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info')
  const [isToastVisible, setIsToastVisible] = useState(false)
  const [registrationData, setRegistrationData] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    suffix: '',
    birthdate: '',
    regEmail: '',
    mobile: '',
    address: '',
    houseNumber: '',
    street: '',
    barangay: '',
    regPassword: '',
    confirmPassword: '',
    noMiddleName: false
  })
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    upper: false,
    lower: false,
    number: false,
    special: false
  })

  // Toast function
  const displayToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage(message)
    setToastType(type)
    setIsToastVisible(true)
    setTimeout(() => {
      setIsToastVisible(false)
    }, 4000)
  }
  const { login, loginWithOtp, register, googleLogin, googleRegister, error, clearError } = useAuthStore()
  const currentUser = useAuthStore(s => s.currentUser)
  const isLoading = useAuthStore(s => s.isLoading)
  const [showLoginSplash, setShowLoginSplash] = useState(false)
  const navigate = useNavigate()
  const [now, setNow] = useState<string>(new Date().toLocaleString())
  const [googleReady, setGoogleReady] = useState(false)
  const [showGoogleCaptcha, setShowGoogleCaptcha] = useState(false)
  const [showRegisterCaptcha, setShowRegisterCaptcha] = useState(false)
  const [googleCaptchaVerified, setGoogleCaptchaVerified] = useState(false)
  const [registerCaptchaVerified, setRegisterCaptchaVerified] = useState(false)

  useEffect(() => {
    const i = setInterval(() => setNow(new Date().toLocaleString()), 1000)
    return () => clearInterval(i)
  }, [])

  useEffect(() => {
    const check = () => {
      // ensure the Google Identity Services script is loaded
      if (window.google) setGoogleReady(true)
    }
    check()
    const id = setInterval(check, 300)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!isLoading && currentUser) {
      const roleStr = String(currentUser.role)
      if (roleStr === 'admin' || roleStr === 'staff' || roleStr.startsWith('ssc')) navigate('/admin', { replace: true })
      else if (roleStr === 'ps_rep') navigate('/partner-school', { replace: true })
      else navigate('/portal', { replace: true })
    }
  }, [currentUser, isLoading, navigate])

  // Handle password-related errors as toast
  useEffect(() => {
    if (error && (error.toLowerCase().includes('password') || error.toLowerCase().includes('invalid credentials'))) {
      displayToast(error, 'error')
      clearError() // Clear the error from store since we're showing it as toast
    }
  }, [error, clearError])

  // Show loading state when loading OR when user is authenticated (during navigation)
  if (isLoading || currentUser) {
    return (
      <div className="min-h-screen bg-app flex flex-col">
        {/* Header Skeleton */}
        <header className="py-2 bg-white/90 backdrop-blur sticky top-0 z-20 border-b border-gray-100">
          <div className="mx-auto px-6 max-w-7xl">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <Skeleton variant="circular" width={64} height={64} />
                <Skeleton variant="text" height={36} width={200} />
              </div>
              <Skeleton variant="text" height={20} width={150} />
            </div>
          </div>
        </header>

        {/* Main Content Skeleton */}
        <main className="mx-auto px-6 pt-4 pb-12 flex-1 max-w-7xl flex items-center justify-center">
          <div className="grid lg:grid-cols-2 gap-12 place-items-center text-center lg:text-left w-full">
            {/* Left headline skeleton */}
            <div className="py-12 px-4 w-full">
              <Skeleton variant="text" height={48} className="mb-4" />
              <Skeleton variant="text" height={48} width="80%" />
            </div>

            {/* Right Login Card Skeleton */}
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm mx-auto w-full">
              <div className="space-y-5">
                <Skeleton variant="rectangular" height={48} />
                <Skeleton variant="rectangular" height={48} />
                <Skeleton variant="rectangular" height={48} />
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">OR</span>
                  </div>
                </div>
                <Skeleton variant="rectangular" height={48} />
                <Skeleton variant="text" height={16} className="text-center" />
              </div>
            </div>
          </div>
        </main>

        {/* Footer Skeleton */}
        <footer className="bg-primary-600 text-white py-4 mt-8">
          <div className="mx-auto px-6 max-w-7xl">
            <div className="flex flex-col lg:flex-row justify-between items-center">
              <div className="text-center lg:text-left mb-2 lg:mb-0 space-y-2">
                <Skeleton variant="text" height={20} width={300} className="bg-primary-500" />
                <Skeleton variant="text" height={14} width={250} className="bg-primary-500" />
              </div>
              <div className="flex space-x-3">
                <Skeleton variant="text" height={14} width={150} className="bg-primary-500" />
              </div>
            </div>
          </div>
        </footer>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    clearError()
    const ok = await login(email, password, null)
    setSubmitting(false)
    if (ok) {
      // Show splash screen before navigation
      setShowLoginSplash(true)
      setTimeout(() => {
        const role = String(useAuthStore.getState().currentUser?.role)
        if (role === 'admin' || role === 'staff' || role.startsWith('ssc')) navigate('/admin', { replace: true })
        else if (role === 'ps_rep') navigate('/partner-school', { replace: true })
        else navigate('/portal', { replace: true })
      }, 1500) // Show splash for 1.5 seconds
    } else {
      // Check if OTP is required
      const currentError = useAuthStore.getState().error
      if (currentError && currentError.startsWith('OTP_REQUIRED|')) {
        const [, otpEmail] = currentError.split('|')
        setOtpEmail(otpEmail)
        setOtpType('login')
        setShowOtp(true)
        startOtpTimer()
        showNotification('OTP sent to your email. Please verify to complete login.', 'info')
      }
    }
  }

  const handleGoogleLogin = async () => {
    try {
      if (!googleCaptchaVerified) {
        setShowGoogleCaptcha(true)
        return
      }
      // Debug: Log environment variables
      console.log('Environment check:', {
        GOOGLE_CLIENT_ID: API_CONFIG.GOOGLE_OAUTH?.CLIENT_ID,
        NODE_ENV: import.meta.env.NODE_ENV,
        MODE: import.meta.env.MODE
      })

      // Initialize Google OAuth
      if (!window.google) {
        console.error('Google OAuth not loaded')
        return
      }
      if (window.google) {
        const clientId = API_CONFIG.GOOGLE_OAUTH?.CLIENT_ID || '855545694637-gi7vtpce9f672hn7me86ugvv2nc8jp1q.apps.googleusercontent.com'
        if (!clientId) {
          console.error('Google Client ID not configured')
          showNotification('Google OAuth not configured. Please contact support.', 'error')
          return
        }

        window.google.accounts.oauth2.initCodeClient({
          client_id: clientId,
          scope: 'email profile',
          ux_mode: 'popup',
          redirect_uri: window.location.origin,
          callback: handleGoogleCallback
        }).requestCode()
      } else {
        console.error('Google OAuth not loaded')
        showNotification('Google OAuth not available. Please try again.', 'error')
      }
    } catch (error) {
      console.error('Google login error:', error)
      showNotification('Google login failed. Please try again.', 'error')
    }
  }

  const handleGoogleCallback = async (response: any) => {
    try {
      console.log('Google OAuth response received:', response)
      const success = await googleLogin(response.code, 'captcha-verified')
      if (success) {
        // Show splash screen before navigation
        setShowLoginSplash(true)
        setTimeout(() => {
          const role = String(useAuthStore.getState().currentUser?.role)
          if (role === 'admin' || role === 'staff') navigate('/admin', { replace: true })
          else if (role === 'ps_rep') navigate('/partner-school', { replace: true })
          else navigate('/portal', { replace: true })
        }, 1500) // Show splash for 1.5 seconds
      } else {
        // Check if it's a NOT_REGISTERED error
        const currentError = useAuthStore.getState().error
        if (currentError && currentError.startsWith('NOT_REGISTERED|')) {
          const [, email, firstName, lastName] = currentError.split('|')
          setGoogleUserData({ email, firstName, lastName, code: response.code })

          // Pre-populate form with Google data if available
          const additionalInfo = useAuthStore.getState().additionalInfo || {}
          setGoogleRegistrationData({
            mobile: additionalInfo.mobile || '',
            birthdate: additionalInfo.birthdate || '',
            address: additionalInfo.address || '',
            houseNumber: additionalInfo.houseNumber || '',
            street: additionalInfo.street || '',
            barangay: additionalInfo.barangay || ''
          })

          setShowGoogleRegistration(true)
          setShowRegister(false) // Hide regular registration form
          showNotification('Google account not registered. Please complete registration.', 'info')
        } else {
          showNotification('Google login failed. Please try again.', 'error')
        }
      }
    } catch (error) {
      console.error('Google callback error:', error)
      showNotification('Google login failed. Please try again.', 'error')
    }
  }

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!registerCaptchaVerified) {
      setShowRegisterCaptcha(true)
      return
    }

    // Validate required fields
    const requiredFields = ['firstName', 'lastName', 'birthdate', 'regEmail', 'mobile', 'address', 'houseNumber', 'street', 'barangay', 'regPassword', 'confirmPassword']
    const missingFields = requiredFields.filter(field => !registrationData[field as keyof typeof registrationData])

    if (missingFields.length > 0) {
      showNotification(`Please fill in all required fields: ${missingFields.join(', ')}`, 'error')
      return
    }

    // Validate password requirements
    if (!Object.values(passwordRequirements).every(req => req)) {
      showNotification('Please meet all password requirements', 'error')
      return
    }

    if (registrationData.regPassword !== registrationData.confirmPassword) {
      showNotification('Passwords do not match', 'error')
      return
    }

    // Validate email format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!emailRegex.test(registrationData.regEmail)) {
      showNotification('Please enter a valid email address (e.g., user@example.com)', 'error')
      return
    }

    // Validate mobile number format
    const mobileRegex = /^09[0-9]{9}$/
    if (!mobileRegex.test(registrationData.mobile)) {
      showNotification('Mobile number must be in format 09XXXXXXXXX (11 digits starting with 09)', 'error')
      return
    }

    // Validate birthdate is before today
    const today = new Date().toISOString().split('T')[0]
    if (registrationData.birthdate >= today) {
      showNotification('Birthdate must be before today', 'error')
      return
    }

    // Debug: Log the registration data being sent
    console.log('Registration data being sent:', registrationData)
    console.log('Required fields check:', {
      firstName: !!registrationData.firstName,
      lastName: !!registrationData.lastName,
      birthdate: !!registrationData.birthdate,
      regEmail: !!registrationData.regEmail,
      mobile: !!registrationData.mobile,
      address: !!registrationData.address,
      houseNumber: !!registrationData.houseNumber,
      street: !!registrationData.street,
      barangay: !!registrationData.barangay,
      regPassword: !!registrationData.regPassword,
      confirmPassword: !!registrationData.confirmPassword
    })

    setSubmitting(true)
    const success = await register(registrationData, 'captcha-verified')
    setSubmitting(false)

    if (success) {
      showNotification('Registration successful! You are now logged in.', 'success')
      // User is automatically logged in, no need for OTP
      setShowRegister(false)
      // The useEffect will handle navigation based on user role
    } else {
      showNotification('Registration failed. Please try again.', 'error')
    }
  }

  const handleGoogleRegistration = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!googleUserData) {
      showNotification('Google user data not available. Please try again.', 'error')
      return
    }

    // Validate required fields for Google registration
    const requiredFields = ['mobile', 'birthdate', 'address', 'houseNumber', 'street', 'barangay']
    const missingFields = requiredFields.filter(field => !googleRegistrationData[field as keyof typeof googleRegistrationData])

    if (missingFields.length > 0) {
      showNotification(`Please fill in all required fields: ${missingFields.join(', ')}`, 'error')
      return
    }

    // Validate mobile number format
    const mobileRegex = /^09[0-9]{9}$/
    if (!mobileRegex.test(googleRegistrationData.mobile)) {
      showNotification('Mobile number must be in format 09XXXXXXXXX (11 digits starting with 09)', 'error')
      return
    }

    // Validate birthdate is before today
    const today = new Date().toISOString().split('T')[0]
    if (googleRegistrationData.birthdate >= today) {
      showNotification('Birthdate must be before today', 'error')
      return
    }

    setSubmitting(true)

    // Get a fresh Google OAuth code for registration
    try {
      const clientId = API_CONFIG.GOOGLE_OAUTH?.CLIENT_ID || '855545694637-gi7vtpce9f672hn7me86ugvv2nc8jp1q.apps.googleusercontent.com'

      if (!window.google) {
        showNotification('Google OAuth not available. Please try again.', 'error')
        setSubmitting(false)
        return
      }

      // Get fresh OAuth code
      const freshCode = await new Promise<string>((resolve, reject) => {
        window.google.accounts.oauth2.initCodeClient({
          client_id: clientId,
          scope: 'email profile',
          ux_mode: 'popup',
          redirect_uri: window.location.origin,
          callback: (response: any) => {
            if (response.code) {
              resolve(response.code)
            } else {
              reject(new Error('No code received'))
            }
          }
        }).requestCode()
      })

      const success = await googleRegister(freshCode, {
        mobile: googleRegistrationData.mobile,
        birthdate: googleRegistrationData.birthdate,
        address: googleRegistrationData.address,
        houseNumber: googleRegistrationData.houseNumber,
        street: googleRegistrationData.street,
        barangay: googleRegistrationData.barangay,
      }, 'captcha-verified')

      if (success) {
        showNotification('Registration with Google successful!', 'success')
        setShowGoogleRegistration(false)
        setGoogleUserData(null)
        // Reset Google registration data
        setGoogleRegistrationData({
          mobile: '',
          birthdate: '',
          address: '',
          houseNumber: '',
          street: '',
          barangay: ''
        })
        // Show splash screen before navigation
        setShowLoginSplash(true)
        setTimeout(() => {
          const role = String(useAuthStore.getState().currentUser?.role)
          if (role === 'admin' || role === 'staff') navigate('/admin', { replace: true })
          else if (role === 'ps_rep') navigate('/partner-school', { replace: true })
          else navigate('/portal', { replace: true })
        }, 1500) // Show splash for 1.5 seconds
      } else {
        const error = useAuthStore.getState().error
        if (error && (error.includes('expired') || error.includes('invalid'))) {
          showNotification('Google authorization expired. Please try logging in with Google again.', 'error')
          // Close the registration modal and let user try again
          setShowGoogleRegistration(false)
          setGoogleUserData(null)
          setGoogleRegistrationData({
            mobile: '',
            birthdate: '',
            address: '',
            houseNumber: '',
            street: '',
            barangay: ''
          })
        } else {
          showNotification('Google registration failed. Please try again.', 'error')
        }
      }
    } catch (error) {
      console.error('Error getting fresh Google OAuth code:', error)
      showNotification('Failed to get Google authorization. Please try again.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const updatePasswordRequirements = (password: string) => {
    setPasswordRequirements({
      length: password.length >= 10,
      upper: /[A-Z]/.test(password),
      lower: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[^A-Za-z0-9]/.test(password)
    })
  }

  const startOtpTimer = () => {
    setOtpTimer(600)
    const interval = setInterval(() => {
      setOtpTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const showNotification = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification')
    existingNotifications.forEach(notification => notification.remove())

    // Create notification element
    const notification = document.createElement('div')
    notification.className = `notification fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg transform transition-all duration-300 translate-x-full`

    // Set notification style based on type
    switch (type) {
      case 'success':
        notification.classList.add('bg-green-500', 'text-white')
        break
      case 'error':
        notification.classList.add('bg-red-500', 'text-white')
        break
      case 'warning':
        notification.classList.add('bg-yellow-500', 'text-white')
        break
      default:
        notification.classList.add('bg-blue-500', 'text-white')
    }

    notification.innerHTML = `
      <div class="flex items-center space-x-2">
        <span>${message}</span>
        <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white hover:text-gray-200">
          ✕
        </button>
      </div>
    `

    document.body.appendChild(notification)

    // Animate in
    setTimeout(() => {
      notification.classList.remove('translate-x-full')
    }, 100)

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.classList.add('translate-x-full')
        setTimeout(() => {
          if (notification.parentNode) {
            notification.remove()
          }
        }, 300)
      }
    }, 5000)
  }

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const code = otpCode.join('')

    if (code.length !== 6) {
      showNotification('Please enter the complete 6-digit OTP', 'error')
      return
    }

    setSubmitting(true)

    if (otpType === 'login') {
      // Handle login OTP verification
      const success = await loginWithOtp(otpEmail, code)
      setSubmitting(false)

      if (success) {
        setShowOtp(false)
        setOtpCode(['', '', '', '', '', ''])
        setOtpEmail('')
        // Show splash screen before navigation
        setShowLoginSplash(true)
        setTimeout(() => {
          const role = String(useAuthStore.getState().currentUser?.role)
          if (role === 'admin' || role === 'staff') navigate('/admin', { replace: true })
          else if (role === 'ps_rep') navigate('/partner-school', { replace: true })
          else navigate('/portal', { replace: true })
        }, 1500) // Show splash for 1.5 seconds
      }
    } else {
      // Handle registration OTP verification
      try {
        const res = await fetch(`${getAuthServiceUrl('/api/verify-otp')}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: otpEmail,
            otp_code: code
          })
        })

        const data = await res.json()
        setSubmitting(false)

        if (res.ok && data.success) {
          // Auto-login after successful registration OTP verification
          const { user, token } = data.data
          const userData = {
            id: String(user.id),
            citizen_id: user.citizen_id ?? '',
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            middle_name: user.middle_name,
            extension_name: user.extension_name,
            mobile: user.mobile,
            birthdate: user.birthdate,
            address: user.address,
            house_number: user.house_number,
            street: user.street,
            barangay: user.barangay,
            role: user.role,
            is_active: user.is_active,
          }

          // Save user data to localStorage for API service
          localStorage.setItem('user_data', JSON.stringify(userData));
          localStorage.setItem('auth_token', token);

          // Update auth store
          useAuthStore.setState({
            currentUser: userData,
            token,
            error: null
          });

          setShowOtp(false)
          setOtpCode(['', '', '', '', '', ''])
          setOtpEmail('')
          showNotification('Account verified successfully! You are now logged in.', 'success')

          // Show splash screen before navigation
          setShowLoginSplash(true)
          setTimeout(() => {
            const role = String(userData.role)
            if (role === 'admin' || role === 'staff') navigate('/admin', { replace: true })
            else if (role === 'ps_rep') navigate('/partner-school', { replace: true })
            else navigate('/portal', { replace: true })
          }, 1500) // Show splash for 1.5 seconds
        } else {
          showNotification(data.message || 'OTP verification failed', 'error')
        }
      } catch (error) {
        console.error('OTP verification error:', error)
        showNotification('Network error. Please try again.', 'error')
        setSubmitting(false)
      }
    }
  }

  const handleResendOtp = async () => {
    try {
      const res = await fetch(`${getAuthServiceUrl('/api/send-otp')}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: otpEmail })
      })

      const data = await res.json()

      if (res.ok && data.success) {
        startOtpTimer()
        showNotification('New OTP sent successfully!', 'success')
      } else {
        showNotification(data.message || 'Failed to resend OTP', 'error')
      }
    } catch (error) {
      console.error('Resend OTP error:', error)
      showNotification('Network error. Please try again.', 'error')
    }
  }

  // Debug: Log environment variables on component render
  console.log('🔍 ENVIRONMENT DEBUG:', {
    GOOGLE_CLIENT_ID: API_CONFIG.GOOGLE_OAUTH?.CLIENT_ID,
    hasGoogleClientId: !!API_CONFIG.GOOGLE_OAUTH?.CLIENT_ID,
    clientIdLength: API_CONFIG.GOOGLE_OAUTH?.CLIENT_ID?.length || 0,
    mode: import.meta.env.MODE,
    dev: import.meta.env.DEV,
    prod: import.meta.env.PROD,
    allViteEnvVars: Object.keys(import.meta.env).filter(key => key.startsWith('VITE_'))
  })

  // Check if Google OAuth is properly configured
  const isGoogleOAuthConfigured = !!API_CONFIG.GOOGLE_OAUTH?.CLIENT_ID

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex flex-col">
      {/* Header */}
      <header className="py-3 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm sticky top-0 z-20 border-b border-gray-200 dark:border-slate-700">
        <div className="mx-auto px-6 max-w-7xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center">
                <img src="/GSM_logo.png" alt="Logo" className="h-14 w-auto" />
              </div>
              <h1 className="text-2xl font-bold">
                <span className="text-secondary-600 dark:text-secondary-400">Go</span>
                <span className="text-primary-600 dark:text-primary-400">Serve</span>
                <span className="text-secondary-600 dark:text-secondary-400">PH</span>
              </h1>
            </div>
            <div className="text-sm text-gray-600 dark:text-slate-400">
              {now}
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto px-6 pt-4 pb-4 flex-1 max-w-7xl flex items-center justify-center min-h-0">
        <div className="grid lg:grid-cols-2 gap-8 place-items-center text-center lg:text-left w-full">
          {/* Left headline */}
          <div className="py-8 px-4">
            <div className="space-y-4">
              <h2 className="text-3xl lg:text-4xl font-bold leading-tight">
                <span className="text-primary-600 dark:text-primary-400">Abot-Kamay mo ang</span>
                <br />
                <span className="text-secondary-600 dark:text-secondary-400">Serbisyong Publiko!</span>
              </h2>
              <p className="text-gray-600 dark:text-slate-400 max-w-lg text-base">
                Access government services with ease. Your gateway to efficient and transparent public service delivery.
              </p>
            </div>
          </div>

          {/* Right Login Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-5 max-w-sm mx-auto w-full border border-gray-100 dark:border-slate-700">
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Email Input */}
              <div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="Email address"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {/* Password Input */}
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  placeholder="Password"
                  className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-gray-600 dark:text-slate-400">Remember me</span>
                </label>
                <button
                  type="button"
                  className="text-primary-600 dark:text-primary-400 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              {/* Error Display - Only for non-password errors */}
              {error && !error.toLowerCase().includes('password') && !error.toLowerCase().includes('invalid credentials') && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              {/* Login Button */}
              <button
                type="submit"
                className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={submitting}
              >
                {submitting ? 'Signing In...' : 'Sign In'}
              </button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-slate-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-slate-800 text-gray-500 dark:text-slate-400">OR</span>
                </div>
              </div>

              {/* Google OAuth Button */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={!googleReady || !isGoogleOAuthConfigured}
                className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center transition-colors ${googleReady && isGoogleOAuthConfigured
                  ? 'bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-600'
                  : 'bg-gray-100 dark:bg-slate-600 border border-gray-200 dark:border-slate-500 text-gray-400 dark:text-slate-500 cursor-not-allowed'
                  }`}
              >
                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </button>

              {/* Registration Link */}
              <div className="text-center pt-2">
                <p className="text-gray-600 dark:text-slate-400 text-sm">
                  No account?{' '}
                  <button
                    type="button"
                    onClick={() => setShowRegister(true)}
                    className="text-primary-600 dark:text-primary-400 hover:underline font-medium"
                  >
                    Register here
                  </button>
                </p>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-primary-600 text-white py-3 mt-4">
        <div className="mx-auto px-6 max-w-7xl">
          <div className="flex flex-col lg:flex-row justify-between items-center">
            <div className="text-center lg:text-left mb-1 lg:mb-0">
              <h3 className="text-sm font-bold mb-1">Government Services Management System</h3>
              <p className="text-xs opacity-90">For any inquiries, please call 122 or email helpdesk@gov.ph</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex space-x-3 text-xs">
                <button
                  onClick={() => setShowTerms(true)}
                  className="hover:underline cursor-pointer"
                >
                  TERMS OF SERVICE
                </button>
                <span>|</span>
                <button
                  onClick={() => setShowPrivacy(true)}
                  className="hover:underline cursor-pointer"
                >
                  PRIVACY POLICY
                </button>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Registration Modal */}
      {showRegister && (
        <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col animate-in fade-in-0 zoom-in-95 duration-300">
            {/* Header */}
            <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Create Account</h2>
                <button
                  onClick={() => setShowRegister(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <form onSubmit={handleRegistration} className="space-y-6">
                {/* Personal Information Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Personal Information</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        required
                        className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400"
                        placeholder="Enter your first name"
                        value={registrationData.firstName}
                        onChange={(e) => setRegistrationData({ ...registrationData, firstName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        required
                        className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400"
                        placeholder="Enter your last name"
                        value={registrationData.lastName}
                        onChange={(e) => setRegistrationData({ ...registrationData, lastName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                        Middle Name
                        <span className="text-red-500" style={{ display: registrationData.noMiddleName ? 'none' : 'inline' }}>*</span>
                      </label>
                      <input
                        type="text"
                        name="middleName"
                        required={!registrationData.noMiddleName}
                        disabled={registrationData.noMiddleName}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400 disabled:bg-gray-100 dark:disabled:bg-slate-600 disabled:text-gray-500"
                        placeholder="Enter your middle name"
                        value={registrationData.middleName}
                        onChange={(e) => setRegistrationData({ ...registrationData, middleName: e.target.value })}
                      />
                      <label className="inline-flex items-center text-sm text-gray-600 dark:text-slate-400">
                        <input
                          type="checkbox"
                          className="mr-2 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          checked={registrationData.noMiddleName}
                          onChange={(e) => setRegistrationData({ ...registrationData, noMiddleName: e.target.checked, middleName: e.target.checked ? '' : registrationData.middleName })}
                        />
                        I don't have a middle name
                      </label>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Suffix</label>
                      <input
                        type="text"
                        name="suffix"
                        placeholder="Jr., Sr., III (optional)"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400"
                        value={registrationData.suffix}
                        onChange={(e) => setRegistrationData({ ...registrationData, suffix: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                        Birthdate <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="birthdate"
                        required
                        className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                        value={registrationData.birthdate}
                        onChange={(e) => setRegistrationData({ ...registrationData, birthdate: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="regEmail"
                        required
                        pattern="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
                        title="Please enter a valid email address (e.g., user@example.com)"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400"
                        placeholder="your.email@example.com"
                        value={registrationData.regEmail}
                        onChange={(e) => setRegistrationData({ ...registrationData, regEmail: e.target.value })}
                      />
                      <p className="text-xs text-gray-500 dark:text-slate-400">
                        ✓ Accepts all email providers (Gmail, Yahoo, Outlook, etc.)
                      </p>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                        Mobile Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        name="mobile"
                        required
                        className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400"
                        placeholder="09XXXXXXXXX"
                        value={registrationData.mobile}
                        onChange={(e) => setRegistrationData({ ...registrationData, mobile: e.target.value })}
                      />
                      <p className="text-xs text-gray-500 dark:text-slate-400">
                        Format: 09XXXXXXXXX (11 digits starting with 09)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Address Information Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Address Information</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2 space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                        Complete Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="address"
                        required
                        className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400"
                        placeholder="Lot/Unit, Building, Subdivision"
                        value={registrationData.address}
                        onChange={(e) => setRegistrationData({ ...registrationData, address: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                        House Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="houseNumber"
                        required
                        className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400"
                        placeholder="123"
                        value={registrationData.houseNumber}
                        onChange={(e) => setRegistrationData({ ...registrationData, houseNumber: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                        Street <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="street"
                        required
                        className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400"
                        placeholder="Main Street"
                        value={registrationData.street}
                        onChange={(e) => setRegistrationData({ ...registrationData, street: e.target.value })}
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                        Barangay <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="barangay"
                        required
                        className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400"
                        placeholder="Barangay Name"
                        value={registrationData.barangay}
                        onChange={(e) => setRegistrationData({ ...registrationData, barangay: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Security Information Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Security Information</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                        Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showRegPassword ? "text" : "password"}
                          name="regPassword"
                          minLength={10}
                          required
                          className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl pr-12 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400"
                          placeholder="Create a strong password"
                          value={registrationData.regPassword}
                          onChange={(e) => {
                            setRegistrationData({ ...registrationData, regPassword: e.target.value })
                            updatePasswordRequirements(e.target.value)
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPassword(!showRegPassword)}
                          className="absolute inset-y-0 right-0 px-3 text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300 transition-colors"
                        >
                          {showRegPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>

                      {/* Password Strength Indicator */}
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-gray-200 dark:bg-slate-600 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${Object.values(passwordRequirements).filter(Boolean).length === 0 ? 'w-0' :
                                Object.values(passwordRequirements).filter(Boolean).length === 1 ? 'w-1/4 bg-red-500' :
                                  Object.values(passwordRequirements).filter(Boolean).length === 2 ? 'w-2/4 bg-orange-500' :
                                    Object.values(passwordRequirements).filter(Boolean).length === 3 ? 'w-3/4 bg-yellow-500' :
                                      Object.values(passwordRequirements).filter(Boolean).length === 4 ? 'w-4/5 bg-blue-500' :
                                        'w-full bg-green-500'
                                }`}
                            ></div>
                          </div>
                          <span className="text-xs font-medium text-gray-600 dark:text-slate-400">
                            {Object.values(passwordRequirements).filter(Boolean).length === 0 ? 'Very Weak' :
                              Object.values(passwordRequirements).filter(Boolean).length === 1 ? 'Weak' :
                                Object.values(passwordRequirements).filter(Boolean).length === 2 ? 'Fair' :
                                  Object.values(passwordRequirements).filter(Boolean).length === 3 ? 'Good' :
                                    Object.values(passwordRequirements).filter(Boolean).length === 4 ? 'Strong' :
                                      'Very Strong'}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                          <div className={`flex items-center text-xs transition-colors ${passwordRequirements.length ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-slate-400'}`}>
                            {passwordRequirements.length ? <CheckCircle size={14} className="mr-2" /> : <XCircle size={14} className="mr-2" />}
                            At least 10 characters
                          </div>
                          <div className={`flex items-center text-xs transition-colors ${passwordRequirements.upper ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-slate-400'}`}>
                            {passwordRequirements.upper ? <CheckCircle size={14} className="mr-2" /> : <XCircle size={14} className="mr-2" />}
                            Has uppercase letter
                          </div>
                          <div className={`flex items-center text-xs transition-colors ${passwordRequirements.lower ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-slate-400'}`}>
                            {passwordRequirements.lower ? <CheckCircle size={14} className="mr-2" /> : <XCircle size={14} className="mr-2" />}
                            Has lowercase letter
                          </div>
                          <div className={`flex items-center text-xs transition-colors ${passwordRequirements.number ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-slate-400'}`}>
                            {passwordRequirements.number ? <CheckCircle size={14} className="mr-2" /> : <XCircle size={14} className="mr-2" />}
                            Has a number
                          </div>
                          <div className={`flex items-center text-xs transition-colors ${passwordRequirements.special ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-slate-400'}`}>
                            {passwordRequirements.special ? <CheckCircle size={14} className="mr-2" /> : <XCircle size={14} className="mr-2" />}
                            Has a special character
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                        Confirm Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          name="confirmPassword"
                          minLength={10}
                          required
                          className={`w-full px-4 py-3 border rounded-xl pr-12 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400 ${registrationData.confirmPassword && registrationData.regPassword !== registrationData.confirmPassword
                            ? 'border-red-500 dark:border-red-400'
                            : registrationData.confirmPassword && registrationData.regPassword === registrationData.confirmPassword
                              ? 'border-green-500 dark:border-green-400'
                              : 'border-gray-300 dark:border-slate-600'
                            }`}
                          placeholder="Confirm your password"
                          value={registrationData.confirmPassword}
                          onChange={(e) => setRegistrationData({ ...registrationData, confirmPassword: e.target.value })}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute inset-y-0 right-0 px-3 text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300 transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                      {registrationData.confirmPassword && (
                        <div className="flex items-center text-xs">
                          {registrationData.regPassword === registrationData.confirmPassword ? (
                            <div className="flex items-center text-green-600 dark:text-green-400">
                              <CheckCircle size={14} className="mr-2" />
                              Passwords match
                            </div>
                          ) : (
                            <div className="flex items-center text-red-500 dark:text-red-400">
                              <XCircle size={14} className="mr-2" />
                              Passwords do not match
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Terms and Privacy Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Terms & Privacy</h3>

                  <div className="space-y-3">
                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        required
                        checked={hasReadTerms && hasReadPrivacy}
                        onChange={(e) => {
                          setHasReadTerms(e.target.checked)
                          setHasReadPrivacy(e.target.checked)
                        }}
                      />
                      <span className="text-sm text-gray-700 dark:text-slate-300">
                        I agree to the{' '}
                        <button
                          type="button"
                          onClick={() => setShowTerms(true)}
                          className="text-primary-600 dark:text-primary-400 hover:underline"
                        >
                          Terms of Use
                        </button>
                        {' '}and{' '}
                        <button
                          type="button"
                          onClick={() => setShowPrivacy(true)}
                          className="text-primary-600 dark:text-primary-400 hover:underline"
                        >
                          Privacy Policy
                        </button>
                      </span>
                    </label>
                  </div>
                </div>

                {/* Alternative Registration Options */}
                <div className="space-y-4">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300 dark:border-slate-600" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-3 bg-white dark:bg-slate-800 text-gray-500 dark:text-slate-400">OR</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={!isGoogleOAuthConfigured}
                    className="w-full flex justify-center items-center px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Register with Google
                  </button>

                  {!isGoogleOAuthConfigured && (
                    <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <p className="text-xs text-yellow-800 dark:text-yellow-200">
                        ⚠️ Google OAuth is not configured. Please contact support or use the form above.
                      </p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowRegister(false)}
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !hasReadTerms || !hasReadPrivacy}
                    className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${submitting || !hasReadTerms || !hasReadPrivacy
                      ? 'bg-gray-300 dark:bg-slate-600 text-gray-500 dark:text-slate-400 cursor-not-allowed'
                      : 'bg-primary-600 hover:bg-primary-700 text-white'
                      }`}
                  >
                    {submitting ? (
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating Account...
                      </div>
                    ) : (
                      'Create Account'
                    )}
                  </button>
                </div>

                {(!hasReadTerms || !hasReadPrivacy) && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-red-500 dark:text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <p className="text-red-700 dark:text-red-300 text-sm font-medium">
                        You must read and accept both Terms of Use and Data Privacy Policy to register
                      </p>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Google Registration Modal */}
      {showGoogleRegistration && googleUserData && (
        <div className="fixed inset-0 z-30 flex items-start justify-center pt-20 px-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="bg-white border-b border-gray-200 px-6 py-4 text-center flex-shrink-0">
              <h2 className="text-xl md:text-2xl font-semibold text-secondary-600">Complete Registration with Google</h2>
              <p className="text-sm text-gray-600 mt-2">
                Welcome {googleUserData.firstName} {googleUserData.lastName}!
                Please provide additional information to complete your registration.
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <form onSubmit={handleGoogleRegistration} className="space-y-5">
                {/* Google Account Info (Read-only) */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h3 className="text-sm font-medium text-blue-800 mb-2">Google Account Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-blue-600 font-medium">Name:</span> {googleUserData.firstName} {googleUserData.lastName}
                    </div>
                    <div>
                      <span className="text-blue-600 font-medium">Email:</span> {googleUserData.email}
                    </div>
                  </div>
                </div>

                {/* Required Additional Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-1">Mobile Number<span className="text-red-500">*</span></label>
                    <input
                      type="tel"
                      name="mobile"
                      required
                      pattern="09[0-9]{9}"
                      title="Mobile number must be in format 09XXXXXXXXX (11 digits starting with 09)"
                      placeholder="09XXXXXXXXX"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      value={googleRegistrationData.mobile}
                      onChange={(e) => setGoogleRegistrationData({ ...googleRegistrationData, mobile: e.target.value })}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Format: 09XXXXXXXXX (11 digits starting with 09)
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Birthdate<span className="text-red-500">*</span></label>
                    <input
                      type="date"
                      name="birthdate"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      value={googleRegistrationData.birthdate}
                      onChange={(e) => setGoogleRegistrationData({ ...googleRegistrationData, birthdate: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm mb-1">Address<span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="address"
                    required
                    placeholder="Complete address"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    value={googleRegistrationData.address}
                    onChange={(e) => setGoogleRegistrationData({ ...googleRegistrationData, address: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm mb-1">House Number<span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      name="houseNumber"
                      required
                      placeholder="123"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      value={googleRegistrationData.houseNumber}
                      onChange={(e) => setGoogleRegistrationData({ ...googleRegistrationData, houseNumber: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Street<span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      name="street"
                      required
                      placeholder="Main Street"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      value={googleRegistrationData.street}
                      onChange={(e) => setGoogleRegistrationData({ ...googleRegistrationData, street: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Barangay<span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      name="barangay"
                      required
                      placeholder="Barangay Name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      value={googleRegistrationData.barangay}
                      onChange={(e) => setGoogleRegistrationData({ ...googleRegistrationData, barangay: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowGoogleRegistration(false)
                      setGoogleUserData(null)
                      // Reset Google registration data
                      setGoogleRegistrationData({
                        mobile: '',
                        birthdate: '',
                        address: '',
                        houseNumber: '',
                        street: '',
                        barangay: ''
                      })
                    }}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`px-4 py-2 rounded-lg transition-colors ${submitting
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                      : 'bg-secondary-500 hover:bg-secondary-600 text-white'
                      }`}
                  >
                    {submitting ? 'Registering...' : 'Complete Registration'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* OTP Modal */}
      {showOtp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold mb-2 text-center">Two-Factor Verification</h3>
            <p className="text-sm text-gray-600 mb-4 text-center">Please check your registered email for your OTP. You have <span className="font-semibold text-secondary-600">{Math.floor(otpTimer / 60)}:{(otpTimer % 60).toString().padStart(2, '0')}</span> to enter it.</p>
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div>
                <label className="block text-sm mb-2 text-center">Enter OTP</label>
                <div className="flex justify-center space-x-2" id="otpInputs">
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <input
                      key={index}
                      type="text"
                      className="w-12 h-12 text-center border border-gray-300 rounded-lg"
                      maxLength={1}
                      inputMode="numeric"
                      value={otpCode[index]}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 1)
                        const newOtpCode = [...otpCode]
                        newOtpCode[index] = value
                        setOtpCode(newOtpCode)

                        if (value && index < 5) {
                          const nextInput = e.target.parentNode?.children[index + 1] as HTMLInputElement
                          nextInput?.focus()
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace' && !e.currentTarget.value && index > 0) {
                          const prevInput = e.currentTarget.parentNode?.children[index - 1] as HTMLInputElement
                          prevInput?.focus()
                        }
                      }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <button type="button" onClick={() => setShowOtp(false)} className="px-4 py-2 rounded-lg bg-red-500 text-white">Cancel</button>
                <div className="space-x-2">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={otpTimer > 0}
                    className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 disabled:opacity-50"
                  >
                    Resend OTP
                  </button>
                  <button
                    type="submit"
                    disabled={otpTimer === 0}
                    className="px-4 py-2 rounded-lg bg-secondary-500 text-white disabled:opacity-50"
                  >
                    Verify
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Terms Modal */}
      {showTerms && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">GoServePH Terms of Service Agreement</h3>
              <button type="button" onClick={() => setShowTerms(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="px-6 py-4 space-y-4 text-sm leading-6">
              <p><strong>Welcome to GoServePH!</strong></p>
              <p>This GoServePH Services Agreement ("Agreement") is a binding legal contract for the use of our software systems—which handle data input, monitoring, processing, and analytics—("Services") between GoServePH ("us," "our," or "we") and you, the registered user ("you" or "user").</p>
              <p>This Agreement details the terms and conditions for using our Services. By accessing or using any GoServePH Services, you agree to these terms. If you don't understand any part of this Agreement, please contact us at info@goserveph.com.</p>
              <h4 className="font-semibold">OVERVIEW OF THIS AGREEMENT</h4>
              <p>This document outlines the terms for your use of the GoServePH system:</p>
              <table className="w-full text-left text-xs">
                <thead>
                  <tr><th className="py-1 pr-4">Section</th><th className="py-1">Topic</th></tr>
                </thead>
                <tbody>
                  <tr><td className="py-1 pr-4">Section A</td><td className="py-1">General Account Setup and Use</td></tr>
                  <tr><td className="py-1 pr-4">Section B</td><td className="py-1">Technology, Intellectual Property, and Licensing</td></tr>
                  <tr><td className="py-1 pr-4">Section C</td><td className="py-1">Payment Terms, Fees, and Billing</td></tr>
                  <tr><td className="py-1 pr-4">Section D</td><td className="py-1">Data Usage, Privacy, and Security</td></tr>
                  <tr><td className="py-1 pr-4">Section E</td><td className="py-1">Additional Legal Terms and Disclaimers</td></tr>
                </tbody>
              </table>
              <h4 className="font-semibold">SECTION A: GENERAL TERMS</h4>
              <p><strong>1. Your Account and Registration</strong></p>
              <p>a. Account Creation: To use our Services, you must create an Account. Your representative (Representative) must provide us with required details, including your entity's name, address, contact person, email, phone number, relevant ID/tax number, and the nature of your business/activities.</p>
              <p>b. Review and Approval: We reserve the right to review and approve your application, which typically takes at least two (2) business days. We can deny or reject any application at our discretion.</p>
              <p>c. Eligibility: Only businesses, institutions, and other entities based in the Philippines are eligible to apply for a GoServePH Account.</p>
              <p>d. Representative Authority: You confirm that your Representative has the full authority to provide your information and legally bind your entity to this Agreement. We may ask for proof of this authority.</p>
              <p>e. Validation: We may require additional documentation at any time (e.g., business licenses, IDs) to verify your entity's ownership, control, and the information you provided.</p>
              <p><strong>2. Services and Support</strong></p>
              <p>We provide support for general account inquiries and issues that prevent the proper use of the system ("System Errors"). Support includes resources available through our in-app Ticketing System and website documentation ("Documentation"). For further questions, contact us at support@goserveph.com.</p>
              <p><strong>3. Service Rules and Restrictions</strong></p>
              <p>a. Lawful Use: You must use the Services lawfully and comply with all applicable Philippine laws, rules, and regulations ("Laws") regarding your use of the Services and the transactions you facilitate ("Transactions").</p>
              <p>b. Prohibited Activities: You may not use the Services to facilitate illegal transactions, or for personal/household use. Specifically, you must not, nor allow others to:</p>
              <ul className="list-disc pl-5">
                <li>Access non-public systems or data.</li>
                <li>Copy, resell, or distribute the Services, Documentation, or system content.</li>
                <li>Use, transfer, or access data you do not own or have no documented rights to use.</li>
                <li>Act as a service agent for the Services.</li>
                <li>Transfer your rights under this Agreement.</li>
                <li>Bypass technical limitations or enable disabled features.</li>
                <li>Reverse engineer the Services (except where legally permitted).</li>
                <li>Interfere with the normal operation of the Services or impose an unreasonably large load on the system.</li>
              </ul>
              <p><strong>4. Electronic Notices and Consent</strong></p>
              <p>a. Electronic Consent: By registering, you provide your electronic signature and consent to receive all notices and disclosures from us electronically (via our website, email, or text message), which has the same legal effect as a physical signature.</p>
              <p>b. Delivery: We are not liable for non-receipt of notices due to issues beyond our control (e.g., network outages, incorrect contact details, firewall restrictions). Notices posted or emailed are considered received within 24 hours.</p>
              <p>c. Text Messages: You authorize us to use text messages to verify your account control (like two-step verification) and provide critical updates. Standard carrier charges may apply.</p>
              <p>d. Withdrawing Consent: You can withdraw your consent to electronic notices only by terminating your Account.</p>
              <p><strong>5. Termination</strong></p>
              <p>a. Agreement Term: This Agreement starts upon registration and continues until terminated by you or us.</p>
              <p>b. Termination by You: You can terminate by emailing a closure request to info@goserveph.com. Your Account will be closed within 120 business days of receipt.</p>
              <p>c. Termination by Us: We may terminate this Agreement, suspend your Account, or close it at any time, for any reason, by providing you notice. Immediate suspension or termination may occur if:</p>
              <ul className="list-disc pl-5">
                <li>You pose a significant fraud or credit risk.</li>
                <li>You use the Services in a prohibited manner or violate this Agreement.</li>
                <li>Law requires us to do so.</li>
              </ul>
              <p>d. Effect of Termination: Upon termination:</p>
              <ul className="list-disc pl-5">
                <li>All licenses granted to you end.</li>
                <li>We may delete your data and information (though we have no obligation to do so).</li>
                <li>We are not liable to you for any damages related to the termination, suspension, or data deletion.</li>
                <li>You remain liable for any outstanding fees, fines, or financial obligations incurred before termination.</li>
              </ul>
              <h4 className="font-semibold">SECTION B: TECHNOLOGY</h4>
              <p><strong>1. System Access and Updates</strong></p>
              <p>We provide access to the web system and/or mobile application ("Application"). You must only use the Application as described in the Documentation. We will update the Application and Documentation periodically, which may add or remove features, and we will notify you of material changes.</p>
              <p><strong>2. Ownership of Intellectual Property (IP)</strong></p>
              <p>a. Your Data: You retain ownership of all your master data, raw transactional data, and generated reports gathered from the system.</p>
              <p>b. GoServePH IP: We exclusively own all rights, titles, and interests in the patents, copyrights, trademarks, system designs, and documentation ("GoServePH IP"). All rights in GoServePH IP not expressly granted to you are reserved by us.</p>
              <p>c. Ideas: If you submit comments or ideas for system improvements ("Ideas"), you agree that we are free to use these Ideas without any attribution or compensation to you.</p>
              <p><strong>3. License Coverage</strong></p>
              <p>We grant you a non-exclusive and non-transferable license to electronically access and use the GoServePH IP only as described in this Agreement. We are not selling the IP to you, and you cannot sublicense it. We may revoke this license if you violate the Agreement.</p>
              <p><strong>4. References to Our Relationship</strong></p>
              <p>During the term of this Agreement, both you and we may publicly identify the other party as the service provider or client, respectively. If you object to us identifying you as a client, you must notify us at info@goserveph.com. Upon termination, both parties must remove all public references to the relationship.</p>
              <h4 className="font-semibold">SECTION C: PAYMENT TERMS AND CONDITIONS</h4>
              <p><strong>1. Service Fees</strong></p>
              <p>We will charge the Fees for set-up, access, support, penalties, and other transactions as described on the GoServePH website. We may revise the Fees at any time, with at least 30 days' notice before the revisions apply to you.</p>
              <p><strong>2. Payment Terms and Schedule</strong></p>
              <p>a. Billing: Your monthly bill for the upcoming month is generated by the system on the 21st day of the current month and is due after 5 days. Billing is based on the number of registered users ("End-User") as of the 20th day.</p>
              <p>b. Payment Method: All payments must be settled via our third-party Payment System Provider, PayPal. You agree to abide by all of PayPal's terms, and we are not responsible for any issues with their service.</p>
              <p><strong>3. Taxes</strong></p>
              <p>Fees exclude applicable taxes. You are solely responsible for remitting all taxes for your business to the appropriate Philippine tax and revenue authorities.</p>
              <p><strong>4. Payment Processing</strong></p>
              <p>We are not a bank and do not offer services regulated by the Bangko Sentral ng Pilipinas. We reserve the right to reject your application or terminate your Account if you are ineligible to use PayPal services.</p>
              <p><strong>5. Processing Disputes and Refunds</strong></p>
              <p>You must report disputes and refund requests by emailing us at billing@goserveph.com. Disputes will only be investigated if reported within 60 days from the billing date. If a refund is warranted, it will be issued as a credit memo for use on future bills.</p>
              <h4 className="font-semibold">SECTION D: DATA USAGE, PRIVACY AND SECURITY</h4>
              <p><strong>1. Data Usage Overview</strong></p>
              <p>Data security is a top priority. This section outlines our obligations when handling information.</p>
              <p>'PERSONAL DATA' is information that relates to and can identify a person.</p>
              <p>'USER DATA' is information that describes your business, operations, products, or services.</p>
              <p>'GoServePH DATA' is transactional data over our infrastructure, fraud analysis info, aggregated data, and other information originating from the Services.</p>
              <p>'DATA' means all of the above.</p>
              <p>We use Data to provide Services, mitigate fraud, and improve our systems. We do not provide Personal Data to unaffiliated parties for marketing purposes.</p>
              <p><strong>2. Data Protection and Privacy</strong></p>
              <p>a. Confidentiality: You will protect all Data received via the Services and only use it in connection with this Agreement. Neither party may use Personal Data for marketing without express consent. We may disclose Data if required by legal instruments (e.g., subpoena).</p>
              <p>b. Privacy Compliance: You affirm that you comply with all Laws governing the privacy and protection of the Data you provide to or access through the Services. You are responsible for obtaining all necessary consents from End-Users to allow us to collect, use, and disclose their Data.</p>
              <p>c. Data Processing Roles: You shall be the data controller, and we shall be the data intermediary. We will process the Personal Data only according to this Agreement and will implement appropriate measures to protect it.</p>
              <p>d. Data Mining: You may not mine the database or any part of it without our express consent.</p>
              <p><strong>3. Security Controls</strong></p>
              <p>We are responsible for protecting your Data using commercially reasonable administrative, technical, and physical security measures. However, no system is impenetrable. You agree that you are responsible for implementing your own firewall, anti-virus, anti-phishing, and other security measures ("Security Controls"). We may suspend your Account to maintain the integrity of the Services, and you waive the right to claim losses that result from such actions.</p>
              <h4 className="font-semibold">SECTION E: ADDITIONAL LEGAL TERMS</h4>
              <p><strong>1. Right to Amend</strong></p>
              <p>We can change or add to these terms at any time by posting the changes on our website. Your continued use of the Services constitutes your acceptance of the modified Agreement.</p>
              <p><strong>2. Assignment</strong></p>
              <p>You cannot assign this Agreement or your Account rights to anyone else without our prior written consent. We can assign this Agreement without your consent.</p>
              <p><strong>3. Force Majeure</strong></p>
              <p>Neither party will be liable for delays or non-performance caused by events beyond reasonable control, such as utility failures, acts of nature, or war. This does not excuse your obligation to pay fees.</p>
              <p><strong>4. Representations and Warranties</strong></p>
              <p>By agreeing, you warrant that:</p>
              <ul className="list-disc pl-5">
                <li>You are eligible to use the Services and have the authority to enter this Agreement.</li>
                <li>All information you provide is accurate and complete.</li>
                <li>You will comply with all Laws.</li>
                <li>You will not use the Services for fraudulent or illegal purposes.</li>
              </ul>
              <p><strong>5. No Warranties</strong></p>
              <p>We provide the Services and GoServePH IP "AS IS" and "AS AVAILABLE," without any express, implied, or statutory warranties of title, merchantability, fitness for a particular purpose, or non-infringement.</p>
              <p><strong>6. Limitation of Liability</strong></p>
              <p>We shall not be responsible or liable to you for any indirect, punitive, incidental, special, consequential, or exemplary damages resulting from your use or inability to use the Services, lost profits, personal injury, or property damage. We are not liable for damages arising from:</p>
              <ul className="list-disc pl-5">
                <li>Hacking, tampering, or unauthorized access to your Account.</li>
                <li>Your failure to implement Security Controls.</li>
                <li>Use of the Services inconsistent with the Documentation.</li>
                <li>Bugs, viruses, or interruptions to the Services.</li>
              </ul>
              <p>This Agreement and all incorporated policies constitute the entire agreement between you and GoServePH.</p>
            </div>
            <div className="border-t px-6 py-3 flex justify-between items-center">
              <label className="inline-flex items-center text-sm">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={hasReadTerms}
                  onChange={(e) => setHasReadTerms(e.target.checked)}
                />
                <span>I have read and understood the Terms of Use</span>
              </label>
              <button
                type="button"
                onClick={() => setShowTerms(false)}
                className="px-4 py-2 rounded-lg bg-secondary-500 text-white hover:bg-secondary-600"
              >
                {hasReadTerms ? 'Accept & Close' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Modal */}
      {showPrivacy && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">GoServePH Data Privacy Policy</h3>
              <button type="button" onClick={() => setShowPrivacy(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="px-6 py-4 space-y-4 text-sm leading-6">
              <p><strong>Protecting the information you and your users handle through our system is our highest priority.</strong> This policy outlines how GoServePH manages, secures, and uses your data.</p>
              <h4 className="font-semibold">1. How We Define and Use Data</h4>
              <p>In this policy, we define the types of data that flow through the GoServePH system:</p>
              <table className="w-full text-left text-xs">
                <thead>
                  <tr><th className="py-1 pr-4">Term</th><th className="py-1">Definition</th></tr>
                </thead>
                <tbody>
                  <tr><td className="py-1 pr-4">Personal Data</td><td className="py-1">Any information that can identify a specific person, whether directly or indirectly, shared or accessible through the Services.</td></tr>
                  <tr><td className="py-1 pr-4">User Data</td><td className="py-1">Information that describes your business operations, services, or internal activities.</td></tr>
                  <tr><td className="py-1 pr-4">GoServePH Data</td><td className="py-1">Details about transactions and activity on our platform, information used for fraud detection, aggregated data, and any non-personal information generated by our system.</td></tr>
                  <tr><td className="py-1 pr-4">DATA</td><td className="py-1">Used broadly to refer to all the above: Personal Data, User Data, and GoServePH Data.</td></tr>
                </tbody>
              </table>
              <h4 className="font-semibold">Our Commitment to Data Use</h4>
              <p>We analyze and manage data only for the following critical purposes:</p>
              <ul className="list-disc pl-5">
                <li>To provide, maintain, and improve the GoServePH Services for you and all other users.</li>
                <li>To detect and mitigate fraud, financial loss, or other harm to you or other users.</li>
                <li>To develop and enhance our products, systems, and tools.</li>
              </ul>
              <p>We will not sell or share Personal Data with unaffiliated parties for their marketing purposes. By using our system, you consent to our use of your Data in this manner.</p>
              <h4 className="font-semibold">2. Data Protection and Compliance</h4>
              <p><strong>Confidentiality</strong></p>
              <p>We commit to using Data only as permitted by our agreement or as specifically directed by you. You, in turn, must protect all Data you access through GoServePH and use it only in connection with our Services. Neither party may use Personal Data to market to third parties without explicit consent.</p>
              <p>We will only disclose Data when legally required to do so, such as through a subpoena, court order, or search warrant.</p>
              <p><strong>Privacy Compliance and Responsibilities</strong></p>
              <p><em>Your Legal Duty:</em> You affirm that you are, and will remain, compliant with all applicable Philippine laws (including the Data Privacy Act of 2012) governing the collection, protection, and use of the Data you provide to us.</p>
              <p><em>Consent:</em> You are responsible for obtaining all necessary rights and consents from your End-Users to allow us to collect, use, and store their Personal Data.</p>
              <p><em>End-User Disclosure:</em> You must clearly inform your End-Users that GoServePH processes transactions for you and may receive their Personal Data as part of that process.</p>
              <p><strong>Data Processing Roles</strong></p>
              <p>When we process Personal Data on your behalf, we operate under the following legal roles:</p>
              <ul className="list-disc pl-5">
                <li>You are the Data Controller (you determine why and how the data is processed).</li>
                <li>We are the Data Intermediary (we process data strictly according to your instructions).</li>
              </ul>
              <p>As the Data Intermediary, we commit to:</p>
              <ul className="list-disc pl-5">
                <li>Implementing appropriate security measures to protect the Personal Data we process.</li>
                <li>Not retaining Personal Data longer than necessary to fulfill the purposes set out in our agreement.</li>
              </ul>
              <p>You acknowledge that we rely entirely on your instructions. Therefore, we are not liable for any claims resulting from our actions that were based directly or indirectly on your instructions.</p>
              <p><strong>Prohibited Activities</strong></p>
              <p>You are strictly prohibited from data mining the GoServePH database or any portion of it without our express written permission.</p>
              <p><strong>Breach Notification</strong></p>
              <p>If we become aware of an unauthorized acquisition, disclosure, change, or loss of Personal Data on our systems (a "Breach"), we will notify you and provide sufficient information to help you mitigate any negative impact, consistent with our legal obligations.</p>
              <h4 className="font-semibold">3. Account Deactivation and Data Deletion</h4>
              <p><strong>Initiating Deactivation</strong></p>
              <p>If you wish to remove your personal information from our systems, you must go to your Edit Profile page and click the 'Deactivate Account' button. This action initiates the data deletion and account deactivation process.</p>
              <p><strong>Data Retention</strong></p>
              <p>Upon deactivation, all of your Personal Identifying Information will be deleted from our systems.</p>
              <p><em>Important Note:</em> Due to the nature of our role as a Government Services Management System, and for legal, accounting, and audit purposes, we are required to retain some of your non-personal account activity history and transactional records. You will receive a confirmation email once your request has been fully processed.</p>
              <h4 className="font-semibold">4. Security Controls and Responsibilities</h4>
              <p><strong>Our Security</strong></p>
              <p>We are responsible for implementing commercially reasonable administrative, technical, and physical procedures to protect Data from unauthorized access, loss, or modification. We comply with all applicable Laws in handling Data.</p>
              <p><strong>Your Security Controls</strong></p>
              <p>You acknowledge that no security system is perfect. You agree to implement your own necessary security measures ("Security Controls"), which must include:</p>
              <ul className="list-disc pl-5">
                <li>Firewall and anti-virus systems.</li>
                <li>Anti-phishing systems.</li>
                <li>End-User and device management policies.</li>
                <li>Data handling protocols.</li>
              </ul>
              <p>We reserve the right to suspend your Account or the Services if necessary to maintain system integrity and security, or to prevent harm. You waive any right to claim losses that result from a Breach or any action we take to prevent harm.</p>
            </div>
            <div className="border-t px-6 py-3 flex justify-between items-center">
              <label className="inline-flex items-center text-sm">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={hasReadPrivacy}
                  onChange={(e) => setHasReadPrivacy(e.target.checked)}
                />
                <span>I have read and understood the Data Privacy Policy</span>
              </label>
              <button
                type="button"
                onClick={() => setShowPrivacy(false)}
                className="px-4 py-2 rounded-lg bg-secondary-500 text-white hover:bg-secondary-600"
              >
                {hasReadPrivacy ? 'Accept & Close' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Terms of Service Modal */}
      {showTerms && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">GoServePH Terms of Service</h3>
              <button type="button" onClick={() => setShowTerms(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="px-6 py-4 space-y-4 text-sm leading-6">
              <p><strong>Welcome to GoServePH!</strong> These Terms of Service ("Terms") govern your use of the Government Services Management System and all related services provided by GoServePH.</p>

              <h4 className="font-semibold">1. Acceptance of Terms</h4>
              <p>By accessing or using GoServePH, you agree to be bound by these Terms and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.</p>

              <h4 className="font-semibold">2. Description of Service</h4>
              <p>GoServePH is a comprehensive government services management platform that provides:</p>
              <ul className="list-disc pl-5">
                <li>Student registration and scholarship management</li>
                <li>Document processing and verification</li>
                <li>Payment processing for government services</li>
                <li>Administrative dashboard for government personnel</li>
                <li>Secure data management and reporting</li>
              </ul>

              <h4 className="font-semibold">3. User Accounts and Registration</h4>
              <p><strong>Account Creation:</strong> To access certain features, you must create an account by providing accurate, current, and complete information.</p>
              <p><strong>Account Security:</strong> You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>
              <p><strong>Account Types:</strong> GoServePH supports different user types including students, government personnel, and administrators, each with specific access levels and permissions.</p>

              <h4 className="font-semibold">4. Acceptable Use Policy</h4>
              <p>You agree to use GoServePH only for lawful purposes and in accordance with these Terms. You agree NOT to:</p>
              <ul className="list-disc pl-5">
                <li>Use the service for any illegal or unauthorized purpose</li>
                <li>Attempt to gain unauthorized access to any part of the system</li>
                <li>Interfere with or disrupt the service or servers</li>
                <li>Submit false, misleading, or fraudulent information</li>
                <li>Violate any applicable local, national, or international law</li>
                <li>Harass, abuse, or harm other users</li>
              </ul>

              <h4 className="font-semibold">5. Privacy and Data Protection</h4>
              <p>Your privacy is important to us. Our collection and use of personal information is governed by our Data Privacy Policy, which is incorporated into these Terms by reference. By using GoServePH, you consent to the collection and use of information as described in our Privacy Policy.</p>

              <h4 className="font-semibold">6. Intellectual Property Rights</h4>
              <p><strong>Our Rights:</strong> GoServePH and its original content, features, and functionality are owned by the Government of the Philippines and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.</p>
              <p><strong>Your Content:</strong> You retain ownership of any content you submit to GoServePH, but grant us a license to use, modify, and display such content as necessary to provide our services.</p>

              <h4 className="font-semibold">7. Service Availability and Modifications</h4>
              <p>We strive to maintain high service availability but cannot guarantee uninterrupted access. We reserve the right to:</p>
              <ul className="list-disc pl-5">
                <li>Modify or discontinue the service with reasonable notice</li>
                <li>Perform maintenance that may temporarily affect service availability</li>
                <li>Update features and functionality to improve user experience</li>
              </ul>

              <h4 className="font-semibold">8. Payment Terms</h4>
              <p>Certain services may require payment of fees. All fees are non-refundable unless otherwise specified. Payment processing is handled securely through authorized payment gateways.</p>

              <h4 className="font-semibold">9. Limitation of Liability</h4>
              <p>To the maximum extent permitted by law, GoServePH shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses resulting from your use of the service.</p>

              <h4 className="font-semibold">10. Indemnification</h4>
              <p>You agree to defend, indemnify, and hold harmless GoServePH and its officers, directors, employees, and agents from and against any claims, damages, obligations, losses, liabilities, costs, or debt arising from your use of the service or violation of these Terms.</p>

              <h4 className="font-semibold">11. Termination</h4>
              <p>We may terminate or suspend your account and access to the service immediately, without prior notice, for any reason, including breach of these Terms. Upon termination, your right to use the service will cease immediately.</p>

              <h4 className="font-semibold">12. Governing Law and Dispute Resolution</h4>
              <p>These Terms shall be governed by and construed in accordance with the laws of the Republic of the Philippines. Any disputes arising from these Terms or your use of GoServePH shall be resolved through the appropriate Philippine courts.</p>

              <h4 className="font-semibold">13. Changes to Terms</h4>
              <p>We reserve the right to modify these Terms at any time. We will notify users of any material changes through the service or via email. Your continued use of GoServePH after such modifications constitutes acceptance of the updated Terms.</p>

              <h4 className="font-semibold">14. Contact Information</h4>
              <p>For questions about these Terms of Service, please contact us at:</p>
              <ul className="list-disc pl-5">
                <li>Email: helpdesk@gov.ph</li>
                <li>Phone: 122</li>
                <li>Address: Government Services Management System, Philippines</li>
              </ul>

              <p><strong>Last Updated:</strong> {new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            <div className="border-t px-6 py-3 flex justify-between items-center">
              <label className="inline-flex items-center text-sm">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={hasReadTerms}
                  onChange={(e) => setHasReadTerms(e.target.checked)}
                />
                <span>I have read and understood the Terms of Service</span>
              </label>
              <button
                type="button"
                onClick={() => setShowTerms(false)}
                className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700"
              >
                {hasReadTerms ? 'Accept & Close' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Login Success Splash Screen */}
      {showLoginSplash && (
        <div className="fixed inset-0 z-50 bg-white flex items-center justify-center">
          <div className="text-center">
            <img src="/splash.svg" alt="Loading" className="splash-logo mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Welcome to GoServePH!</p>
            <p className="text-gray-500 text-sm">Redirecting you to your dashboard...</p>
          </div>
        </div>
      )}

      {/* Click-in-Order CAPTCHA Modals */}
      <ClickOrderCaptcha
        isOpen={showGoogleCaptcha}
        onClose={() => setShowGoogleCaptcha(false)}
        onVerified={() => {
          setGoogleCaptchaVerified(true)
          setShowGoogleCaptcha(false)
          // Trigger Google login after CAPTCHA verification
          setTimeout(() => {
            handleGoogleLogin()
          }, 100)
        }}
      />

      <ClickOrderCaptcha
        isOpen={showRegisterCaptcha}
        onClose={() => setShowRegisterCaptcha(false)}
        onVerified={() => {
          setRegisterCaptchaVerified(true)
          setShowRegisterCaptcha(false)
          // Auto-submit the registration form after CAPTCHA verification
          setTimeout(() => {
            const forms = document.querySelectorAll('form')
            // Find the registration form (it's the second form in the modal)
            const regForm = Array.from(forms).find(form => {
              const inputs = form.querySelectorAll('input[name="firstName"]')
              return inputs.length > 0
            })
            if (regForm) (regForm as HTMLFormElement).requestSubmit()
          }, 100)
        }}
      />

      {/* Toast Notification */}
      {isToastVisible && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right duration-300">
          <div className={`rounded-lg shadow-lg p-4 max-w-sm ${toastType === 'error' ? 'bg-red-500 text-white' :
            toastType === 'success' ? 'bg-green-500 text-white' :
              'bg-blue-500 text-white'
            }`}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{toastMessage}</p>
              <button
                onClick={() => setIsToastVisible(false)}
                className="ml-3 text-white/80 hover:text-white"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default GatewayLogin

