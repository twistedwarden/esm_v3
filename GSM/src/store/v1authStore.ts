import { create } from 'zustand'
import type { UserRole } from '../types'
import { API_CONFIG } from '../config/api'

// Use AUTH_SERVICE BASE_URL with /api suffix for API calls
const API_BASE_URL = `${API_CONFIG.AUTH_SERVICE.BASE_URL}/api`

export type AuthUser = {
	id: string
	citizen_id: string
	email: string
	first_name: string
	last_name: string
	middle_name?: string
	extension_name?: string
	mobile?: string
	birthdate?: string
	address?: string
	house_number?: string
	street?: string
	barangay?: string
	role: UserRole
	system_role?: 'interviewer' | 'reviewer' | 'administrator' | 'coordinator'
	department?: string
	position?: string
	is_active: boolean
}

type AuthState = {
	currentUser: AuthUser | null
	token: string | null
	error: string | null
	additionalInfo: any
	isLoading: boolean
	isLoggingOut: boolean
	sessionDuration: number | null
	setSessionDuration: (duration: number) => void
	login: (username: string, password: string, captchaToken?: string | null) => Promise<boolean>
	loginWithOtp: (email: string, otpCode: string) => Promise<boolean>
	register: (userData: any, captchaToken?: string | null) => Promise<boolean>
	googleLogin: (code: string, captchaToken?: string | null) => Promise<boolean>
	googleRegister: (code: string, additionalData: any, captchaToken?: string | null) => Promise<boolean>
	logout: () => Promise<void>
	clearError: () => void
	initializeAuth: () => Promise<void>
	updateCurrentUser: (userData: Partial<AuthUser>) => void
}

// Utility function to construct full name from name components
export const getFullName = (user: AuthUser): string => {
	const parts = [user.first_name]

	if (user.middle_name) {
		parts.push(user.middle_name)
	}

	parts.push(user.last_name)

	if (user.extension_name) {
		parts.push(user.extension_name)
	}

	return parts.join(' ')
}


export const useAuthStore = create<AuthState>((set, get) => ({
	currentUser: null,
	token: localStorage.getItem('auth_token'),
	error: null,
	additionalInfo: null,
	isLoading: true,
	isLoggingOut: false,
	sessionDuration: null,
	setSessionDuration: (duration: number) => set({ sessionDuration: duration }),

	initializeAuth: async () => {
		const token = localStorage.getItem('auth_token')
		if (!token) {
			set({ isLoading: false })
			return
		}

		// Try to get user data from localStorage first as fallback
		const storedUserData = localStorage.getItem('user_data')
		let fallbackUserData = null
		if (storedUserData) {
			try {
				fallbackUserData = JSON.parse(storedUserData)
			} catch (e) {
				console.warn('Failed to parse stored user data:', e)
			}
		}

		// Validate token with backend
		try {
			console.log('🔍 Fetching user data from:', `${API_BASE_URL}/user`)
			const response = await fetch(`${API_BASE_URL}/user`, {
				headers: {
					'Authorization': `Bearer ${token}`,
					'Accept': 'application/json',
				},
			})

			const data = await response.json()
			console.log('📡 User API response:', data)

			if (data.success) {
				const userData = {
					id: String(data.data.user.id),
					citizen_id: data.data.user.citizen_id ?? '',
					email: data.data.user.email,
					first_name: data.data.user.first_name,
					last_name: data.data.user.last_name,
					middle_name: data.data.user.middle_name,
					extension_name: data.data.user.extension_name,
					mobile: data.data.user.mobile,
					birthdate: data.data.user.birthdate,
					address: data.data.user.address,
					house_number: data.data.user.house_number,
					street: data.data.user.street,
					barangay: data.data.user.barangay,
					role: data.data.user.role,
					// Use system_role from API if available, otherwise fallback to stored data
					system_role: data.data.user.system_role || fallbackUserData?.system_role,
					department: data.data.user.department || fallbackUserData?.department,
					position: data.data.user.position || fallbackUserData?.position,
					is_active: data.data.user.is_active,
				};

				// Save user data to localStorage for API service
				localStorage.setItem('user_data', JSON.stringify(userData));


				set({
					currentUser: userData,
					token,
					isLoading: false
				})
			} else {
				// If API fails but we have stored data, use it
				if (fallbackUserData) {
					set({
						currentUser: fallbackUserData,
						token,
						isLoading: false
					})
				} else {
					localStorage.removeItem('auth_token')
					set({
						currentUser: null,
						token: null,
						isLoading: false
					})
				}
			}
		} catch {
			// If API fails but we have stored data, use it
			if (fallbackUserData) {
				set({
					currentUser: fallbackUserData,
					token,
					isLoading: false
				})
			} else {
				localStorage.removeItem('auth_token')
				set({
					currentUser: null,
					token: null,
					isLoading: false
				})
			}
		}
	},

	login: async (username, password, captchaToken) => {
		try {
			// Migrate to GSM-compatible endpoint (email + password)
			const response = await fetch(`${API_BASE_URL}/gsm/login`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json',
				},
				body: JSON.stringify({ email: username, password, captcha_token: captchaToken }),
			})

			const data = await response.json()

			if (!response.ok) {
				let errorMessage = data.message || 'Login failed'

				// Append warning if available (e.g. for login attempts)
				if (data.warning) {
					errorMessage = `${errorMessage} (${data.warning})`
				}

				set({ error: errorMessage })
				return false
			}

			if (data.success) {
				// Check if OTP is required
				if (data.data.requires_otp) {
					// Store email for OTP verification
					set({
						error: `OTP_REQUIRED|${data.data.email}`,
						isLoading: false
					})
					return false
				}

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
					system_role: user.system_role,
					department: user.department,
					position: user.position,
					is_active: user.status === 'active',
				};

				// Save user data to localStorage for API service
				localStorage.setItem('user_data', JSON.stringify(userData));


				set({
					currentUser: userData,
					token,
					error: null
				})
				localStorage.setItem('auth_token', token)
				return true
			} else {
				set({ error: data.message || 'Login failed' })
				return false
			}
		} catch {
			set({ error: 'Network error. Please try again.' })
			return false
		}
	},

	register: async (userData: any, captchaToken?: string | null) => {
		set({ isLoading: true, error: null })

		try {
			// Debug: Log the data being sent
			console.log('Sending registration data to API:', userData)

			const response = await fetch(`${API_BASE_URL}/register`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json',
				},
				body: JSON.stringify({
					...userData,
					confirmPassword: userData.confirmPassword,
					captcha_token: captchaToken
				}),
			})

			const data = await response.json()

			// Debug: Log the response
			console.log('Registration API response:', { status: response.status, data })

			// Log detailed validation errors if any
			if (response.status === 422 && data.errors) {
				console.log('Validation errors:', data.errors)
			}

			if (!response.ok) {
				// Show specific validation errors if available
				if (response.status === 422 && data.errors) {
					const errorMessages = Object.values(data.errors).flat()
					set({ error: errorMessages.join(', ') })
				} else {
					set({ error: data.message || 'Registration failed' })
				}
				return false
			}

			if (data.success) {
				// Check if user is immediately logged in (no OTP required)
				if (data.data.token && data.data.user) {
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
						system_role: user.system_role,
						department: user.department,
						position: user.position,
						is_active: user.status === 'active',
					};

					// Save user data to localStorage for API service
					localStorage.setItem('user_data', JSON.stringify(userData));

					set({
						currentUser: userData,
						token,
						error: null
					})
					localStorage.setItem('auth_token', token)

					// Trigger notification for new user registration
					window.dispatchEvent(new CustomEvent('userRegistered'));

					return true
				} else {
					// OTP required (legacy flow)
					set({ error: null })

					// Trigger notification for new user registration
					window.dispatchEvent(new CustomEvent('userRegistered'));

					return true
				}
			} else {
				set({ error: data.message || 'Registration failed' })
				return false
			}
		} catch (error) {
			console.error('Registration error:', error)
			set({ error: 'Network error. Please try again.' })
			return false
		} finally {
			set({ isLoading: false })
		}
	},

	googleLogin: async (code: string, captchaToken?: string | null) => {
		set({ isLoading: true, error: null })

		try {
			console.log('Sending Google OAuth code to API:', code)

			const response = await fetch(`${API_BASE_URL}/auth/google`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json',
				},
				body: JSON.stringify({ code, captcha_token: captchaToken }),
			})

			const data = await response.json()
			console.log('Google OAuth API response:', { status: response.status, data })

			// Handle not-registered Google account
			if (response.status === 404 && data?.code === 'NOT_REGISTERED') {
				const email = data?.email || ''
				const firstName = data?.first_name || ''
				const lastName = data?.last_name || ''
				const additionalInfo = data?.additional_info || {}
				// encode a simple directive the UI can react to
				set({
					error: `NOT_REGISTERED|${email}|${firstName}|${lastName}`,
					additionalInfo: additionalInfo
				})
				return false
			}

			if (!response.ok) {
				set({ error: data.message || 'Google login failed' })
				return false
			}

			if (data.success) {
				const { user, token } = data.data
				set({
					currentUser: {
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
						is_active: true,
					},
					token,
					error: null
				})
				localStorage.setItem('auth_token', token)
				return true
			} else {
				set({ error: data.message || 'Google login failed' })
				return false
			}
		} catch (error) {
			console.error('Google OAuth error:', error)
			set({ error: 'Network error. Please try again.' })
			return false
		} finally {
			set({ isLoading: false })
		}
	},

	googleRegister: async (code: string, additionalData: any, captchaToken?: string | null) => {
		set({ isLoading: true, error: null })

		try {
			console.log('Sending Google registration data to API:', { code, additionalData })

			const response = await fetch(`${API_BASE_URL}/register/google`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json',
				},
				body: JSON.stringify({
					code,
					...additionalData,
					captcha_token: captchaToken
				}),
			})

			const data = await response.json()
			console.log('Google registration API response:', { status: response.status, data })

			if (!response.ok) {
				set({ error: data.message || 'Google registration failed' })
				return false
			}

			if (data.success) {
				const { user, token } = data.data
				set({
					currentUser: {
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
						is_active: true,
					},
					token,
					error: null
				})
				localStorage.setItem('auth_token', token)
				return true
			} else {
				set({ error: data.message || 'Google registration failed' })
				return false
			}
		} catch (error) {
			console.error('Google registration error:', error)
			set({ error: 'Network error. Please try again.' })
			return false
		} finally {
			set({ isLoading: false })
		}
	},

	loginWithOtp: async (email: string, otpCode: string) => {
		set({ isLoading: true, error: null })

		try {
			const response = await fetch(`${API_BASE_URL}/gsm/login-with-otp`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json',
				},
				body: JSON.stringify({
					email,
					otp_code: otpCode
				}),
			})

			const data = await response.json()

			if (!response.ok) {
				set({ error: data.message || 'OTP verification failed' })
				return false
			}

			if (data.success) {
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
					system_role: user.system_role,
					department: user.department,
					position: user.position,
					is_active: user.is_active,
				}

				// Save user data to localStorage for API service
				localStorage.setItem('user_data', JSON.stringify(userData));

				set({
					currentUser: userData,
					token,
					error: null
				})
				localStorage.setItem('auth_token', token)
				return true
			} else {
				set({ error: data.message || 'OTP verification failed' })
				return false
			}
		} catch (error) {
			console.error('OTP verification error:', error)
			set({ error: 'Network error. Please try again.' })
			return false
		} finally {
			set({ isLoading: false })
		}
	},

	logout: async () => {
		set({ isLoggingOut: true })
		const { token } = get()

		// Call backend logout
		if (token) {
			try {
				await fetch(`${API_BASE_URL}/logout`, {
					method: 'POST',
					headers: {
						'Authorization': `Bearer ${token}`,
						'Accept': 'application/json',
					},
				})
			} catch {
				// Ignore logout errors
			}
		}

		localStorage.removeItem('auth_token')
		localStorage.removeItem('user_data')
		set({ currentUser: null, token: null, error: null, isLoggingOut: false })
	},

	clearError: () => set({ error: null, additionalInfo: null }),

	updateCurrentUser: (userData: Partial<AuthUser>) => {
		const { currentUser } = get()
		if (currentUser) {
			const updatedUser = { ...currentUser, ...userData }
			set({ currentUser: updatedUser })
			// Also update localStorage
			localStorage.setItem('user_data', JSON.stringify(updatedUser))
		}
	}
}))

// Initialize auth on app start
if (typeof window !== 'undefined') {
	useAuthStore.getState().initializeAuth()
} 