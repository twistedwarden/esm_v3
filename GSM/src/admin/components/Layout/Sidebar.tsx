import React from 'react'
import { ChevronDown, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getSidebarItems } from './sidebarItems'
import { useAuthStore } from '../../../store/v1authStore'
import { motion, AnimatePresence } from 'framer-motion'
import { useNotifications } from '../../contexts/NotificationContext'
import NotificationDot from '../ui/NotificationDot'
import { useLanguage } from '../../../contexts/LanguageContext'

type SidebarProps = {
	collapsed: boolean
	onPageChange?: (id: string) => void
	activeItem: string
}

function Sidebar({ collapsed, onPageChange, activeItem }: SidebarProps) {
	const [expandedItem, setExpandedItem] = React.useState<Set<string>>(new Set([""]))
	const [activeSubItem, setActiveSubItem] = React.useState<string | null>(null)
	const [isMobile, setIsMobile] = React.useState(false)
	const navigate = useNavigate()
	const { logout, isLoggingOut, currentUser } = useAuthStore()
	const { notificationCounts, markAsRead } = useNotifications()
	const { t } = useLanguage()
	
	// Get sidebar items based on user role and system role
	const sidebarItems = getSidebarItems(currentUser?.role, currentUser?.system_role, t)

	// Function to get notification count for a module
	const getNotificationCount = (itemId: string) => {
		switch (itemId) {
			case 'scholarship':
				return notificationCounts.scholarship.total
			case 'sad':
				return notificationCounts.schoolAid.total
			case 'studentRegistry':
				return notificationCounts.studentRegistry.total
			case 'audit-logs':
				return notificationCounts.auditLogs.total
			case 'security':
				return notificationCounts.security.total
			default:
				return 0
		}
	}

	// Function to get notification count for a sub-item
	const getSubItemNotificationCount = (itemId: string, subItemId: string) => {
		switch (itemId) {
			case 'scholarship':
				if (subItemId === 'scholarship-applications') {
					return notificationCounts.scholarship.applications
				}
				break
			case 'sad':
				if (subItemId === 'sad-applications') {
					return notificationCounts.schoolAid.applications
				}
				break
			case 'studentRegistry':
				if (subItemId === 'studentRegistry-overview') {
					return notificationCounts.studentRegistry.newStudents
				}
				break
			case 'security':
				if (subItemId === 'security-threats') {
					return notificationCounts.security.threats
				}
				break
		}
		return 0
	}

	// Handle responsive behavior
	React.useEffect(() => {
		const handleResize = () => {
			setIsMobile(window.innerWidth < 768)
		}
		
		handleResize() // Set initial value
		window.addEventListener('resize', handleResize)
		return () => window.removeEventListener('resize', handleResize)
	}, [])

	const toggleExpanded = (itemid: string) => {
		const newExpanded = new Set(expandedItem)
		if (newExpanded.has(itemid)) {
			// If clicking the same item, just close it
			newExpanded.delete(itemid)
		} else {
			// If clicking a different item, close all others and open this one
			newExpanded.clear()
			newExpanded.add(itemid)
		}
		setExpandedItem(newExpanded)
	}

	const handleLogout = async () => {
		try {
			await logout()
			// Redirect to login page after successful logout
			navigate('/', { replace: true })
		} catch {
			// Even if logout fails, redirect to login page
			navigate('/', { replace: true })
		}
	}

	const shouldCollapse = collapsed && !isMobile

	return (
		<div className="flex">
			<motion.div 
				className={`bg-white border-r border-slate-200/50 flex flex-col dark:bg-slate-900 dark:border-slate-700 h-screen min-h-screen shadow-lg md:shadow-none`}
				animate={{ 
					width: shouldCollapse ? 64 : 256,
				}}
				transition={{ 
					type: "spring", 
					damping: 25, 
					stiffness: 200,
					duration: 0.3
				}}
			>
				<motion.div 
					className="flex-shrink-0"
					animate={{ 
						padding: shouldCollapse ? 12 : 24,
					}}
					transition={{ 
						type: "spring", 
						damping: 25, 
						stiffness: 200,
						duration: 0.3
					}}
				>
					<div className='flex items-center space-x-3'>
						<div className='w-10 h-10 flex items-center justify-center text-white text-xl font-bold flex-shrink-0'>
							{/* Try to load image, fallback to text if it fails */}
							<img 
								src="/GSM_logo.png" 
								alt="GSM Logo" 
								className="w-full h-full object-contain"
								onError={(e) => {
									const target = e.target as HTMLImageElement;
									target.style.display = 'none';
									const fallback = target.parentElement?.querySelector('.logo-fallback') as HTMLElement;
									if (fallback) fallback.style.display = 'block';
								}}
							/>
							<span className="logo-fallback hidden text-white font-bold text-lg">GSM</span>
						</div>
						<AnimatePresence>
							{!shouldCollapse && (
								<motion.div 
									className="min-w-0"
									initial={{ opacity: 0, width: 0 }}
									animate={{ opacity: 1, width: "auto" }}
									exit={{ opacity: 0, width: 0 }}
									transition={{ 
										duration: 0.2,
										ease: "easeInOut"
									}}
								>
									<h1 className='text-lg md:text-xl font-bold dark:text-white truncate'>GSM</h1>
									<p className='text-xs text-slate-500 truncate'>Admin Dashboard</p>
								</motion.div>
							)}
						</AnimatePresence>
					</div>
				</motion.div>
				<hr className='border-slate-200 dark:border-slate-700 mx-2 flex-shrink-0' />
				<nav className='flex-1 p-2 md:p-4 space-y-1 md:space-y-2 overflow-y-auto'>
					{sidebarItems.map((item, index) => (
						<motion.div 
							key={item.id}
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ 
								delay: index * 0.1,
								duration: 0.3,
								ease: "easeOut"
							}}
						>
							<motion.button
								className={`w-full flex justify-between items-center p-2 md:p-2 rounded-xl transition-all duration-300 text-left ${shouldCollapse ? 'px-2' : 'px-3'} relative overflow-hidden group`}
								style={{
									background: (activeItem === item.id || ((item as any).subItems && (item as any).subItems.some((sub: any) => sub.id === activeSubItem))) 
										? 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(34, 197, 94, 0.05) 100%)' 
										: 'transparent'
								}}
								onClick={() => {
									if ((item as any).subItems) {
										toggleExpanded(item.id)
										if ((item as any).subItems.length > 0) {
											setActiveSubItem((item as any).subItems[0].id)
											if (onPageChange) onPageChange((item as any).subItems[0].id)
										}
									} else {
										setActiveSubItem(null)
										if (onPageChange) onPageChange(item.id)
										// Mark as read when clicked
										markAsRead(item.id as any)
									}
								}}
								whileHover={{ 
									scale: 1.02,
									transition: { duration: 0.2, ease: "easeOut" }
								}}
								whileTap={{ 
									scale: 0.98,
									transition: { duration: 0.1, ease: "easeInOut" }
								}}
								initial={{ opacity: 0, x: -20 }}
								animate={{ 
									opacity: 1, 
									x: 0,
									transition: { 
										delay: index * 0.1,
										duration: 0.3,
										ease: "easeOut"
									}
								}}
								exit={{ 
									opacity: 0, 
									x: -20,
									transition: { 
										duration: 0.2,
										ease: "easeIn"
									}
								}}
							>
								{/* Glass hover effect with green gradient zoom */}
								<motion.div
									className="absolute inset-0 bg-gradient-to-r from-green-500/20 via-green-400/10 to-transparent rounded-xl opacity-0"
									initial={{ opacity: 0, scaleX: 0, x: "100%" }}
									whileHover={{ 
										opacity: 1, 
										scaleX: 1, 
										x: 0,
										transition: { 
											duration: 0.4, 
											ease: "easeOut" 
										}
									}}
									style={{
										background: 'linear-gradient(90deg, rgba(34, 197, 94, 0.2) 0%, rgba(34, 197, 94, 0.1) 50%, transparent 100%)',
										backdropFilter: 'blur(10px)',
										WebkitBackdropFilter: 'blur(10px)',
									}}
								/>
								
								{/* Glass shine effect */}
								<motion.div
									className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/10 to-transparent rounded-xl opacity-0"
									initial={{ opacity: 0, scaleX: 0, x: "100%" }}
									whileHover={{ 
										opacity: 1, 
										scaleX: 1, 
										x: 0,
										transition: { 
											duration: 0.3, 
											ease: "easeOut",
											delay: 0.1
										}
									}}
								/>
								
								<div className='flex items-center space-x-3 min-w-0 relative z-10'>
									<div className='relative'>
										<item.icon className={`w-5 h-5 flex-shrink-0 transition-colors duration-300 ${
											(activeItem === item.id || ((item as any).subItems && (item as any).subItems.some((sub: any) => sub.id === activeSubItem))) 
												? 'text-green-600 dark:text-green-400' 
												: 'text-slate-600 dark:text-slate-400 group-hover:text-green-500 dark:group-hover:text-green-400'
										}`} />
										{getNotificationCount(item.id) > 0 && (
											<NotificationDot 
												count={getNotificationCount(item.id)} 
												size="sm"
												className="-top-1 -right-1"
											/>
										)}
									</div>
									<AnimatePresence>
										{!shouldCollapse && (
											<motion.div 
												className='flex items-center space-x-2 min-w-0 flex-1'
												initial={{ opacity: 0, width: 0 }}
												animate={{ opacity: 1, width: "auto" }}
												exit={{ opacity: 0, width: 0 }}
												transition={{ 
													duration: 0.2,
													ease: "easeInOut"
												}}
											>
												<span className={`text-sm font-medium truncate transition-colors duration-300 ${
													(activeItem === item.id || ((item as any).subItems && (item as any).subItems.some((sub: any) => sub.id === activeSubItem))) 
														? 'text-green-700 dark:text-green-300 font-semibold' 
														: 'text-slate-600 dark:text-slate-400 group-hover:text-green-600 dark:group-hover:text-green-400'
												}`}>
													{item.label}
												</span>
											</motion.div>
										)}
									</AnimatePresence>
								</div>
								<AnimatePresence>
									{!shouldCollapse && (item as any).subItems && (
										<motion.div
											initial={{ opacity: 0, rotate: -90 }}
											animate={{ opacity: 1, rotate: 0 }}
											exit={{ opacity: 0, rotate: -90 }}
											transition={{ 
												duration: 0.2,
												ease: "easeInOut"
											}}
										>
											<ChevronDown className={`${expandedItem.has(item.id) ? 'rotate-180' : ''} w-4 h-4 text-slate-500 transition-transform duration-200 flex-shrink-0`} />
										</motion.div>
									)}
								</AnimatePresence>
							</motion.button>
							<AnimatePresence>
								{!shouldCollapse && (item as any).subItems && expandedItem.has(item.id) && (
									<motion.div 
										className='ml-6 md:ml-8 mt-2 space-y-1 border-l border-slate-300 pl-2'
										initial={{ opacity: 0, height: 0 }}
										animate={{ opacity: 1, height: "auto" }}
										exit={{ opacity: 0, height: 0 }}
										transition={{ 
											duration: 0.3,
											ease: "easeInOut"
										}}
									>
										{(item as any).subItems.map((subitem: any, subIndex: number) => {
											const subItemNotificationCount = getSubItemNotificationCount(item.id, subitem.id)
											return (
												<motion.button
													key={subitem.id}
													className={`w-full text-sm text-left p-2 rounded-lg transition-all duration-300 relative overflow-hidden group ${activeSubItem === subitem.id ? 'bg-green-100/50 dark:bg-green-900/20' : ''}`}
													style={{
														background: activeSubItem === subitem.id 
															? 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%)' 
															: 'transparent'
													}}
													onClick={() => {
														setActiveSubItem(subitem.id)
														if (onPageChange) onPageChange(subitem.id)
														// Mark sub-item as read when clicked
														markAsRead(item.id as any, subitem.id)
													}}
													initial={{ opacity: 0, x: -10 }}
													animate={{ opacity: 1, x: 0 }}
													transition={{ 
														delay: subIndex * 0.05,
														duration: 0.2,
														ease: "easeOut"
													}}
													whileHover={{ 
														scale: 1.02,
														transition: { duration: 0.2, ease: "easeOut" }
													}}
													whileTap={{ 
														scale: 0.98,
														transition: { duration: 0.1, ease: "easeInOut" }
													}}
													exit={{ 
														opacity: 0, 
														x: -10,
														transition: { 
															duration: 0.15,
															ease: "easeIn"
														}
													}}
												>
													{/* Glass hover effect for sub-items */}
													<motion.div
														className="absolute inset-0 bg-gradient-to-r from-green-500/15 via-green-400/8 to-transparent rounded-lg opacity-0"
														initial={{ opacity: 0, scaleX: 0, x: "100%" }}
														whileHover={{ 
															opacity: 1, 
															scaleX: 1, 
															x: 0,
															transition: { 
																duration: 0.3, 
																ease: "easeOut" 
															}
														}}
														style={{
															background: 'linear-gradient(90deg, rgba(34, 197, 94, 0.15) 0%, rgba(34, 197, 94, 0.08) 50%, transparent 100%)',
															backdropFilter: 'blur(8px)',
															WebkitBackdropFilter: 'blur(8px)',
														}}
													/>
													
													<div className="relative flex items-center z-10">
														<span className={`truncate block flex-1 transition-colors duration-300 ${
															activeSubItem === subitem.id 
																? 'text-green-700 dark:text-green-300 font-semibold' 
																: 'text-slate-700 dark:text-slate-500 group-hover:text-green-600 dark:group-hover:text-green-400'
														}`}>{subitem.label}</span>
														{subItemNotificationCount > 0 && (
															<NotificationDot 
																count={subItemNotificationCount} 
																size="sm"
																className="-top-1 -right-1"
															/>
														)}
													</div>
												</motion.button>
											)
										})}
									</motion.div>
								)}
							</AnimatePresence>
						</motion.div>
					))}
				</nav>
				
				{/* Logout button at the bottom */}
				<motion.div 
					className="flex-shrink-0 border-t border-slate-200 dark:border-slate-700"
					animate={{ 
						padding: shouldCollapse ? 8 : 16,
					}}
					transition={{ 
						type: "spring", 
						damping: 25, 
						stiffness: 200,
						duration: 0.3
					}}
				>
					<motion.button
						onClick={handleLogout}
						disabled={isLoggingOut}
						className={`w-full flex items-center space-x-3 p-2 md:p-3 rounded-xl transition-all duration-200 text-left ${shouldCollapse ? 'px-2 justify-center' : 'px-3'} text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed`}
						whileHover={{ scale: 1.02 }}
						whileTap={{ scale: 0.98 }}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ 
							delay: sidebarItems.length * 0.1 + 0.2,
							duration: 0.3,
							ease: "easeOut"
						}}
					>
						<LogOut className='w-5 h-5 flex-shrink-0' />
						<AnimatePresence>
							{!shouldCollapse && (
								<motion.span 
									className='text-sm font-medium'
									initial={{ opacity: 0, width: 0 }}
									animate={{ opacity: 1, width: "auto" }}
									exit={{ opacity: 0, width: 0 }}
									transition={{ 
										duration: 0.2,
										ease: "easeInOut"
									}}
								>
									{isLoggingOut ? t('Logging out...') : t('Logout')}
								</motion.span>
							)}
						</AnimatePresence>
					</motion.button>
				</motion.div>
			</motion.div>
		</div>
	)
}

export default Sidebar 