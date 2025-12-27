import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/v1authStore'
import { useSessionTimeout } from '../hooks/useSessionTimeout'
import { SessionTimeoutModal } from './SessionTimeoutModal'

type SessionTimeoutWrapperProps = {
  children: React.ReactNode
}

export const SessionTimeoutWrapper: React.FC<SessionTimeoutWrapperProps> = ({ children }) => {
  const [showWarning, setShowWarning] = useState(false)
  const currentUser = useAuthStore(state => state.currentUser)
  const navigate = useNavigate()
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const { resetTimer, clearTimers } = useSessionTimeout({
    enabled: !!currentUser, // Only enable when user is logged in
    onWarning: () => {
      setShowWarning(true)
      
      // Set a hard timeout for automatic logout after 30 seconds
      warningTimeoutRef.current = setTimeout(async () => {
        setShowWarning(false)
        
        // Logout user
        const logout = useAuthStore.getState().logout
        await logout()
        
        // Show notification
        const notification = document.createElement('div')
        notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-[10000]'
        notification.textContent = 'Session expired due to inactivity. Please log in again.'
        document.body.appendChild(notification)
        
        setTimeout(() => {
          notification.remove()
        }, 5000)
        
        // Redirect to login
        navigate('/', { replace: true })
      }, 30000) // 30 seconds
    },
    onTimeout: () => {
      // This is a backup in case the warning timeout doesn't fire
      setShowWarning(false)
      
      // Show notification
      const notification = document.createElement('div')
      notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-[10000]'
      notification.textContent = 'Session expired due to inactivity. Please log in again.'
      document.body.appendChild(notification)
      
      setTimeout(() => {
        notification.remove()
      }, 5000)
      
      // Redirect to login
      navigate('/', { replace: true })
    }
  })

  const handleContinue = () => {
    // Clear the warning timeout
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current)
      warningTimeoutRef.current = null
    }
    
    setShowWarning(false)
    clearTimers()
    resetTimer()
  }

  return (
    <>
      {children}
      <SessionTimeoutModal 
        isOpen={showWarning} 
        onContinue={handleContinue}
        secondsRemaining={30}
      />
    </>
  )
}
