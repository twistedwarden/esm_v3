import { useEffect, useRef, useCallback, useState } from 'react'
import { useAuthStore } from '../store/v1authStore'

const DEFAULT_TIMEOUT_DURATION = 30 * 60 * 1000 // 30 minutes default
const WARNING_DURATION = 30 * 1000 // Show warning 30 seconds before timeout

type UseSessionTimeoutOptions = {
  onTimeout?: () => void
  onWarning?: () => void
  enabled?: boolean
  durationSeconds?: number
}

export const useSessionTimeout = (options: UseSessionTimeoutOptions = {}) => {
  const { onTimeout, onWarning, enabled = true, durationSeconds } = options
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const warningRef = useRef<NodeJS.Timeout | null>(null)
  const [warningShown, setWarningShown] = useState(false)
  const logout = useAuthStore(state => state.logout)

  // Calculate duration in MS. Use prop if provided, otherwise default.
  // Ensure we don't go below warning duration (30s) + buffer.
  const timeoutDuration = durationSeconds
    ? Math.max(durationSeconds * 1000, WARNING_DURATION + 5000)
    : DEFAULT_TIMEOUT_DURATION

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

    // Set warning timer
    warningRef.current = setTimeout(() => {
      handleWarning()
    }, timeoutDuration - WARNING_DURATION)

    // Set timeout timer
    timeoutRef.current = setTimeout(() => {
      handleTimeout()
    }, timeoutDuration)
  }, [enabled, warningShown, clearTimers, handleWarning, handleTimeout, timeoutDuration])

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
