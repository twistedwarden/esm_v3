import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogIn, User, Lock, Mail, ArrowLeft, Clock } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { OtpInput } from '../../components/ui/OtpInput';
import { useAuthStore } from '../../store/v1authStore';
import { Skeleton, SkeletonInput, SkeletonButton } from '../../components/ui/Skeleton';
import { getAuthServiceUrl, API_CONFIG } from '../../config/api';

export const Login: React.FC = () => {
	const [formData, setFormData] = useState({
		username: '',
		password: '',
	});
	const [submitting, setSubmitting] = useState(false);
	const [otpMode, setOtpMode] = useState(false);
	const [userEmail, setUserEmail] = useState('');
	const [otpError, setOtpError] = useState('');
	const [timeRemaining, setTimeRemaining] = useState(600); // 10 minutes in seconds
	const [resendCooldown, setResendCooldown] = useState(0);

	const { login, loginWithOtp, error, clearError } = useAuthStore();
	const currentUser = useAuthStore(s => s.currentUser);
	const isLoading = useAuthStore(s => s.isLoading);
	const navigate = useNavigate();
	const location = useLocation();

	const fromPath = (location.state as any)?.from?.pathname as string | undefined;

	// Timer countdown for OTP expiration
	useEffect(() => {
		if (!otpMode || timeRemaining <= 0) return;

		const timer = setInterval(() => {
			setTimeRemaining(prev => {
				if (prev <= 1) {
					clearInterval(timer);
					return 0;
				}
				return prev - 1;
			});
		}, 1000);

		return () => clearInterval(timer);
	}, [otpMode, timeRemaining]);

	// Resend cooldown timer
	useEffect(() => {
		if (resendCooldown <= 0) return;

		const timer = setInterval(() => {
			setResendCooldown(prev => {
				if (prev <= 1) {
					clearInterval(timer);
					return 0;
				}
				return prev - 1;
			});
		}, 1000);

		return () => clearInterval(timer);
	}, [resendCooldown]);

	// Handle Google OAuth callback
	useEffect(() => {
		const urlParams = new URLSearchParams(window.location.search);
		const code = urlParams.get('code');

		if (code && !submitting) {
			handleGoogleCallback(code);
		}
	}, []);

	const handleGoogleCallback = async (code: string) => {
		setSubmitting(true);
		clearError();

		try {
			const response = await fetch(`${getAuthServiceUrl('/api')}/auth/google`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ code }),
			});

			const data = await response.json();

			if (data.success && data.data.token) {
				// Store token
				localStorage.setItem('auth_token', data.data.token);

				// Clear URL params
				window.history.replaceState({}, document.title, window.location.pathname);

				// Redirect based on role
				const role = data.data.user.role;
				if (role === 'admin' || role === 'staff') {
					window.location.href = '/admin';
				} else {
					window.location.href = fromPath || '/';
				}
			} else {
				// Handle error - show message
				alert(data.message || 'Google sign-in failed. Please try again.');
				window.history.replaceState({}, document.title, window.location.pathname);
			}
		} catch (error) {
			console.error('Google OAuth error:', error);
			alert('Failed to sign in with Google. Please try again.');
			window.history.replaceState({}, document.title, window.location.pathname);
		} finally {
			setSubmitting(false);
		}
	};

	// Redirect if already authenticated
	useEffect(() => {
		if (!isLoading && currentUser) {
			if (currentUser.role === 'admin' || currentUser.role === 'staff' || String(currentUser.role).startsWith('ssc')) {
				navigate('/admin', { replace: true });
			} else {
				navigate(fromPath || '/', { replace: true });
			}
		}
	}, [currentUser, isLoading, navigate, fromPath]);

	// Check for OTP_REQUIRED error
	useEffect(() => {
		if (error && error.startsWith('OTP_REQUIRED|')) {
			const email = error.split('|')[1];
			setUserEmail(email);
			setOtpMode(true);
			setTimeRemaining(600); // Reset timer
			clearError();
		}
	}, [error, clearError]);

	// Show loading skeleton while checking authentication
	if (isLoading || currentUser) {
		if (isLoading) {
			return (
				<div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
					<div className="max-w-md w-full space-y-8">
						<div className="text-center">
							<Skeleton variant="circular" width={48} height={48} className="mx-auto mb-4" />
							<Skeleton variant="text" height={32} width={200} className="mx-auto" />
						</div>
						<div className="bg-white rounded-lg shadow-lg p-6">
							<div className="space-y-6">
								<SkeletonInput />
								<SkeletonInput />
								<SkeletonButton width="100%" />
							</div>
						</div>
						<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
							<Skeleton variant="text" height={16} className="mb-2" />
							<Skeleton variant="text" height={16} width="90%" />
						</div>
						<div className="text-center">
							<SkeletonButton width={150} className="mx-auto" />
						</div>
					</div>
				</div>
			);
		}
		return null;
	}

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData(prev => ({
			...prev,
			[name]: value
		}));
		if (error) {
			clearError();
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setSubmitting(true);
		clearError();

		const ok = await login(formData.username, formData.password);
		setSubmitting(false);

		if (!ok) {
			return;
		}

		const role = useAuthStore.getState().currentUser?.role;
		if (role === 'admin' || role === 'staff') {
			navigate('/admin', { replace: true });
			return;
		}
		navigate(fromPath || '/', { replace: true });
	};

	const handleOtpComplete = async (otp: string) => {
		setSubmitting(true);
		setOtpError('');

		const ok = await loginWithOtp(userEmail, otp);
		setSubmitting(false);

		if (!ok) {
			const authError = useAuthStore.getState().error;
			setOtpError(authError || 'Invalid OTP code');
			return;
		}

		const role = useAuthStore.getState().currentUser?.role;
		if (role === 'admin' || role === 'staff') {
			navigate('/admin', { replace: true });
			return;
		}
		navigate(fromPath || '/', { replace: true });
	};

	const handleResendOtp = async () => {
		if (resendCooldown > 0) return;

		setSubmitting(true);
		setOtpError('');

		// Re-login to generate new OTP
		const ok = await login(formData.username, formData.password);
		setSubmitting(false);

		if (ok || useAuthStore.getState().error?.startsWith('OTP_REQUIRED|')) {
			setResendCooldown(60); // 60 second cooldown
			setTimeRemaining(600); // Reset timer
			setOtpError('');
			// Show success message briefly
			const successMsg = 'New OTP sent to your email';
			setOtpError(successMsg);
			setTimeout(() => {
				if (otpError === successMsg) setOtpError('');
			}, 3000);
		}
	};

	const handleBackToLogin = () => {
		setOtpMode(false);
		setUserEmail('');
		setOtpError('');
		setTimeRemaining(600);
		clearError();
	};

	const handleGoogleSignIn = () => {
		const clientId = API_CONFIG.GOOGLE_OAUTH.CLIENT_ID;
		const redirectUri = window.location.origin; // Use current origin
		const scope = API_CONFIG.GOOGLE_OAUTH.SCOPES;
		const responseType = API_CONFIG.GOOGLE_OAUTH.RESPONSE_TYPE;

		const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
			`client_id=${encodeURIComponent(clientId)}&` +
			`redirect_uri=${encodeURIComponent(redirectUri)}&` +
			`response_type=${responseType}&` +
			`scope=${encodeURIComponent(scope)}&` +
			`access_type=${API_CONFIG.GOOGLE_OAUTH.ACCESS_TYPE}&` +
			`prompt=${API_CONFIG.GOOGLE_OAUTH.PROMPT}`;

		console.log('Google OAuth URL:', googleAuthUrl);
		console.log('Client ID:', clientId);
		window.location.href = googleAuthUrl;
	};

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	};

	// OTP Verification Screen
	if (otpMode) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
				<div className="max-w-md w-full space-y-8">
					{/* Header */}
					<div className="text-center">
						<Mail className="w-12 h-12 text-orange-500 mx-auto mb-4" />
						<h2 className="text-3xl font-bold text-gray-900">
							Verify Your Identity
						</h2>
						<p className="mt-2 text-sm text-gray-600">
							We've sent a 6-digit code to
						</p>
						<p className="text-sm font-medium text-gray-900">
							{userEmail}
						</p>
					</div>

					{/* OTP Form */}
					<div className="bg-white rounded-lg shadow-lg p-6">
						<div className="space-y-6">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-4 text-center">
									Enter Verification Code
								</label>
								<OtpInput
									length={6}
									onComplete={handleOtpComplete}
									disabled={submitting || timeRemaining === 0}
									error={!!otpError && !otpError.includes('sent')}
								/>
							</div>

							{otpError && (
								<p className={`text-sm text-center ${otpError.includes('sent') ? 'text-green-600' : 'text-red-600'
									}`}>
									{otpError}
								</p>
							)}

							{/* Timer */}
							<div className="flex items-center justify-center gap-2 text-sm text-gray-600">
								<Clock className="w-4 h-4" />
								<span>
									{timeRemaining > 0
										? `Code expires in ${formatTime(timeRemaining)}`
										: 'Code expired'
									}
								</span>
							</div>

							{/* Resend Button */}
							<div className="text-center">
								<button
									onClick={handleResendOtp}
									disabled={resendCooldown > 0 || submitting}
									className={`text-sm font-medium ${resendCooldown > 0 || submitting
										? 'text-gray-400 cursor-not-allowed'
										: 'text-orange-600 hover:text-orange-500'
										}`}
								>
									{resendCooldown > 0
										? `Resend code in ${resendCooldown}s`
										: 'Resend verification code'
									}
								</button>
							</div>

							{/* Back Button */}
							<Button
								type="button"
								variant="outline"
								className="w-full"
								onClick={handleBackToLogin}
								disabled={submitting}
							>
								<ArrowLeft className="h-4 w-4 mr-2" />
								Back to Login
							</Button>
						</div>
					</div>

					{/* Help Text */}
					<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
						<p className="text-sm text-blue-800">
							<strong>Didn't receive the code?</strong> Check your spam folder or click the resend button above.
						</p>
					</div>
				</div>
			</div>
		);
	}

	// Regular Login Screen
	return (
		<div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
			<div className="max-w-md w-full space-y-8">
				{/* Header */}
				<div className="text-center">
					<LogIn className="w-12 h-12 text-orange-500 mx-auto mb-4" />
					<h2 className="text-3xl font-bold text-gray-900">
						System Login
					</h2>
				</div>

				{/* Login Form */}
				<div className="bg-white rounded-lg shadow-lg p-6">
					<form onSubmit={handleSubmit} className="space-y-6">
						<div>
							<label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
								Username or Email Address
							</label>
							<div className="relative">
								<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<User className="h-5 w-5 text-gray-400" />
								</div>
								<input
									id="username"
									name="username"
									type="text"
									required
									className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200"
									placeholder="Enter your username or email address"
									value={formData.username}
									onChange={handleInputChange}
								/>
							</div>
						</div>

						<div>
							<label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
								Password
							</label>
							<div className="relative">
								<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<Lock className="h-5 w-5 text-gray-400" />
								</div>
								<input
									id="password"
									name="password"
									type="password"
									required
									className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200"
									placeholder="Enter your password"
									value={formData.password}
									onChange={handleInputChange}
								/>
							</div>
						</div>

						{error && !error.startsWith('OTP_REQUIRED') && (
							<p className="text-sm text-red-600">{error}</p>
						)}

						<Button type="submit" className="w-full" disabled={submitting}>
							<LogIn className="h-4 w-4 mr-2" />
							{submitting ? 'Signing In...' : 'Sign In'}
						</Button>

						{/* Divider */}
						<div className="relative my-6">
							<div className="absolute inset-0 flex items-center">
								<div className="w-full border-t border-gray-300"></div>
							</div>
							<div className="relative flex justify-center text-sm">
								<span className="px-2 bg-white text-gray-500">Or continue with</span>
							</div>
						</div>

						{/* Google Sign-In Button */}
						<button
							type="button"
							onClick={handleGoogleSignIn}
							className="w-full flex items-center justify-center gap-3 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
						>
							<svg className="h-5 w-5" viewBox="0 0 24 24">
								<path
									fill="#4285F4"
									d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
								/>
								<path
									fill="#34A853"
									d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
								/>
								<path
									fill="#FBBC05"
									d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
								/>
								<path
									fill="#EA4335"
									d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
								/>
							</svg>
							<span className="text-sm font-medium text-gray-700">Continue with Google</span>
						</button>
					</form>
				</div>

				{/* Note */}
				<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
					<p className="text-sm text-blue-800">
						<strong>Note:</strong> This login is for system users only.
						New scholarship applicants should use the public application form.
					</p>
				</div>

				{/* Back to Home */}
				<div className="text-center">
					<Link to="/">
						<Button variant="outline">
							Back to Home
						</Button>
					</Link>
				</div>
			</div>
		</div>
	);
};
