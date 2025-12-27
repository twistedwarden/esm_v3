import React, { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'

type SessionTimeoutModalProps = {
  isOpen: boolean
  onContinue: () => void
  secondsRemaining?: number
}

export const SessionTimeoutModal: React.FC<SessionTimeoutModalProps> = ({ 
  isOpen, 
  onContinue,
  secondsRemaining = 30 
}) => {
  const [countdown, setCountdown] = useState(secondsRemaining)

  useEffect(() => {
    if (isOpen) {
      setCountdown(secondsRemaining)
      
      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [isOpen, secondsRemaining])

  // Show modal when open
  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative animate-scale-in">
        {/* Warning Icon */}
        <div className="flex justify-center mb-4">
          <div className="bg-yellow-100 rounded-full p-3">
            <AlertTriangle className="text-yellow-600" size={40} />
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Session Timeout Warning</h3>
          <p className="text-gray-600">
            You've been inactive for a while. For your security, you'll be logged out automatically.
          </p>
        </div>

        {/* Countdown */}
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-6 text-center">
          <p className="text-sm text-gray-700 mb-2">Logging out in:</p>
          <div className="text-5xl font-bold text-yellow-600">
            {countdown}
          </div>
          <p className="text-sm text-gray-600 mt-2">seconds</p>
        </div>

        {/* Action Button */}
        <button
          onClick={onContinue}
          className="w-full bg-secondary-500 hover:bg-secondary-600 text-white py-3 px-6 rounded-lg font-semibold transition-colors"
        >
          Continue Session
        </button>

        <p className="text-xs text-gray-500 text-center mt-4">
          Click "Continue Session" to stay logged in
        </p>
      </div>

      <style>{`
        @keyframes scale-in {
          0% {
            transform: scale(0.9);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </div>
  )
}
