import { BrowserRouter as Router, Routes, Route, Outlet, Navigate, useLocation } from 'react-router-dom';
import { PortalLayout } from './components/layout/PortalLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Portal } from './pages/Portal';
import { RenewalForm } from './pages/renewal/RenewalForm';
import { ScholarshipDashboard } from './pages/scholarshipDashboard/ScholarshipDashboard';
import { NewApplicationForm } from './pages/newApplication/NewApplicationForm';
import { Login } from './pages/auth/Login';
import { GatewayLogin } from './pages/GatewayLogin';
import { useAuthStore } from './store/v1authStore';
import AdminApp from './admin/App';
import PartnerSchoolApp from './partner-school/PartnerSchoolApp';
import { LanguageProvider } from './contexts/LanguageContext';
import { SessionTimeoutWrapper } from './components/SessionTimeoutWrapper';

function PortalLayoutWrapper() {
	return (
		<PortalLayout>
			<Outlet />
		</PortalLayout>
	);
}

function RequireAdmin() {
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
	if (currentUser.role === 'admin' || currentUser.role === 'ssc' || String(currentUser.role).startsWith('ssc')) {
		return <AdminApp />
	}

	// For staff users, they must have a system_role from scholarship service
	if (currentUser.role === 'staff') {
		// Log current user data for debugging
		console.log('✅ Staff user authorization check:', {
			user_id: currentUser.id,
			role: currentUser.role,
			system_role: currentUser.system_role,
			department: currentUser.department,
			position: currentUser.position,
			isLoading: isLoading
		});
		
		if (!currentUser.system_role) {
			// Staff without system_role - show access denied
			console.error('Staff user missing system_role. User data:', currentUser);
			return (
				<div className="min-h-screen flex items-center justify-center bg-gray-50">
					<div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
						<div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
							<svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
							</svg>
						</div>
						<h3 className="text-lg font-medium text-gray-900 mb-2">Staff Access Required</h3>
						<p className="text-sm text-gray-500 mb-4">
							You need to be registered as staff in the scholarship system to access this dashboard. Please contact your administrator.
						</p>
						<details className="mt-4 text-left">
							<summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-800">Debug Info (for developers)</summary>
							<pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
								{JSON.stringify({ 
									user_id: currentUser.id, 
									role: currentUser.role,
									system_role: currentUser.system_role,
									department: currentUser.department,
									position: currentUser.position
								}, null, 2)}
							</pre>
						</details>
						<button 
							onClick={() => window.location.href = '/'}
							className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 mt-4"
						>
							Return to Login
						</button>
					</div>
				</div>
			)
		}
		// Staff with system_role can proceed
		console.log('Staff user authorized with system_role:', currentUser.system_role);
		return <AdminApp />
	}

	// All other roles - redirect to login
	return <Navigate to="/" replace state={{ from: location }} />
}

function App() {
	return (
		<LanguageProvider>
			<Router basename={import.meta.env.BASE_URL}>
				<SessionTimeoutWrapper>
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
				</SessionTimeoutWrapper>
			</Router>
		</LanguageProvider>
	);
}

export default App;