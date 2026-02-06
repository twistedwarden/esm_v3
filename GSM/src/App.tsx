import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet, Navigate, useLocation } from 'react-router-dom';
import { PortalLayout } from './components/layout/PortalLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Portal } from './pages/Portal';
import { RenewalForm } from './pages/renewal/RenewalForm';
import { ScholarshipDashboard } from './pages/scholarshipDashboard/ScholarshipDashboard';
import { NewApplicationForm } from './pages/newApplication/NewApplicationForm';
import { Login } from './pages/auth/Login';
import { GatewayLogin } from './pages/GatewayLogin';
import { PaymentSuccess } from './admin/pages/PaymentSuccess';
import { PaymentCancel } from './admin/pages/PaymentCancel';
import { useAuthStore } from './store/v1authStore';
import AdminApp from './admin/App';
import PartnerSchoolApp from './partner-school/PartnerSchoolApp';
import { LanguageProvider } from './contexts/LanguageContext';
import { SessionTimeoutWrapper } from './components/SessionTimeoutWrapper';
import { ToastProvider } from './components/providers/ToastProvider';

function PortalLayoutWrapper() {
	return (
		<PortalLayout>
			<Outlet />
		</PortalLayout>
	);
}

function RequireAdmin({ children }: { children?: React.ReactNode }) {
	const location = useLocation()
	const currentUser = useAuthStore(s => s.currentUser)
	const isLoading = useAuthStore(s => s.isLoading)

	// CRITICAL: Always show loading spinner while isLoading is true
	// This ensures we wait for initializeAuth() to complete before checking roles
	if (isLoading) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
					<p className="text-gray-600">Loading...</p>
				</div>
			</div>
		)
	}

	// After loading completes, check if user is authenticated
	if (!currentUser) {
		return <Navigate to="/" replace state={{ from: location }} />
	}

	// Check role-based access
	// IMPORTANT: For staff users, we check if system_role exists
	// However, if the scholarship service is temporarily unavailable,
	// we should still allow access (they'll see limited permissions in the sidebar)
	const isAuthorized =
		currentUser.role === 'admin' ||
		currentUser.role === 'ssc' ||
		String(currentUser.role).startsWith('ssc') ||
		currentUser.role === 'staff'; // Allow all staff users

	if (!isAuthorized) {
		// All other roles - redirect to login
		return <Navigate to="/" replace state={{ from: location }} />
	}

	// If children provided (for payment pages), render them
	if (children) {
		return <>{children}</>;
	}

	// Otherwise render AdminApp
	return <AdminApp />
}

function App() {
	return (
		<LanguageProvider>
			<Router basename={import.meta.env.BASE_URL}>
				<SessionTimeoutWrapper>
					<ToastProvider>
						<Routes>
							{/* Login page as entry point */}
							<Route path="/" element={<GatewayLogin />} />

							{/* Portal routes - accessible only after login */}
							<Route element={<ProtectedRoute><PortalLayoutWrapper /></ProtectedRoute>}>
								<Route path="/portal" element={<Portal />} />

								<Route path="/new-application" element={<NewApplicationForm />} />
								<Route path="/renewal" element={<RenewalForm />} />
								<Route path="/scholarship-dashboard" element={<ScholarshipDashboard />} />
							</Route>

							{/* Admin login and admin routes */}
							<Route path="/admin-login" element={<Login />} />

							{/* Payment callback routes - accessible to authenticated admin users */}
							<Route
								path="/admin/school-aid/payment/success"
								element={
									<RequireAdmin>
										<PaymentSuccess />
									</RequireAdmin>
								}
							/>
							<Route
								path="/admin/school-aid/payment/cancel"
								element={
									<RequireAdmin>
										<PaymentCancel />
									</RequireAdmin>
								}
							/>

							<Route path="/admin/*" element={<RequireAdmin />} />

							{/* Partner School routes */}
							<Route path="/partner-school" element={<PartnerSchoolApp />} />

							{/* 404 */}
							<Route path="*" element={
								<div className="min-h-screen bg-gray-50 flex items-center justify-center">
									<div className="text-center">
										<h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
										<p className="text-gray-600 mb-8">Page not found</p>
										<a href="/" className="text-orange-500 hover:text-orange-600 font-medium">
											Return to Home
										</a>
									</div>
								</div>
							} />
						</Routes>
					</ToastProvider>
				</SessionTimeoutWrapper>
			</Router>
		</LanguageProvider>
	);
}

export default App;