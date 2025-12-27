import { useEffect, useRef, useCallback, useState } from 'react'
import { useAuthStore } from '../store/v1authStore'

const TIMEOUT_DURATION = 3 * 60 * 1000 // 3 minutes in milliseconds
const WARNING_DURATION = 30 * 1000 // Show warning 30 seconds before timeout

type UseSessionTimeoutOptions = {
  onTimeout?: () => void
  onWarning?: () => void
  enabled?: boolean
}

export const useSessionTimeout = (options: UseSessionTimeoutOptions = {}) => {
  const { onTimeout, onWarning, enabled = true } = options
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const warningRef = useRef<NodeJS.Timeout | null>(null)
  const [warningShown, setWarningShown] = useState(false)
  const logout = useAuthStore(state => state.logout)

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current)
      warningRef.current = null
    }
    setWarningShown(false)
  }, [])

  const handleTimeout = useCallback(async () => {
    console.log('Session timeout - logging out user')
    await logout()
    if (onTimeout) {
      onTimeout()
    }
  }, [logout, onTimeout])

  const handleWarning = useCallback(() => {
    console.log('Session timeout warning')
    setWarningShown(true)
    if (onWarning) {
      onWarning()
    }
  }, [onWarning])

  const resetTimer = useCallback(() => {
    if (!enabled) return
    
    // Don't reset timer if warning is already shown
    if (warningShown) return

    clearTimers()

    // Set warning timer (30 seconds before timeout)
    warningRef.current = setTimeout(() => {
      handleWarning()
    }, TIMEOUT_DURATION - WARNING_DURATION)

    // Set timeout timer
    timeoutRef.current = setTimeout(() => {
      handleTimeout()
    }, TIMEOUT_DURATION)
  }, [enabled, warningShown, clearTimers, handleWarning, handleTimeout])

  useEffect(() => {
    if (!enabled) {
      clearTimers()
      return
    }

    // Events that indicate user activity
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
      'wheel'
    ]

    // Reset timer on any user activity (but not during warning)
    const handleActivity = () => {
      if (!warningShown) {
        resetTimer()
      }
    }

    // Start the timer
    resetTimer()

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true })
    })

    // Cleanup
    return () => {
      clearTimers()
      events.forEach(event => {
        document.removeEventListener(event, handleActivity)
      })
    }
  }, [enabled, warningShown, resetTimer, clearTimers])

  return {
    resetTimer,
    clearTimers,
    warningShown
  }
}
