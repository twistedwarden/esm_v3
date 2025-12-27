import React, { useState } from 'react'
import { CheckCircle, Shield } from 'lucide-react'

type HumanVerificationProps = {
  isOpen: boolean
  onClose: () => void
  onVerified: () => void
}

export const HumanVerification: React.FC<HumanVerificationProps> = ({ isOpen, onClose, onVerified }) => {
  const [isChecked, setIsChecked] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)

  const handleCheckboxChange = () => {
    if (!isChecked) {
      setIsChecked(true)
      setIsVerifying(true)
      
      // Simulate verification process
      setTimeout(() => {
        setIsVerifying(false)
        setTimeout(() => {
          onVerified()
        }, 500)
      }, 1500)
    }
  }

  const handleClose = () => {
    setIsChecked(false)
    setIsVerifying(false)
    onClose()
  }

  // Show modal when open
  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative animate-scale-in">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-100 rounded-full p-4">
              <Shield className="text-blue-600" size={48} />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Security Verification</h3>
          <p className="text-gray-600 text-sm">
            Please verify that you are human before proceeding
          </p>
        </div>

        {/* Verification Box */}
        <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* Custom Checkbox */}
              <button
                onClick={handleCheckboxChange}
                disabled={isChecked}
                className={`w-8 h-8 rounded border-2 flex items-center justify-center transition-all ${
                  isChecked
                    ? 'bg-green-500 border-green-500'
                    : 'bg-white border-gray-400 hover:border-blue-500'
                } ${isVerifying ? 'animate-pulse' : ''}`}
              >
                {isChecked && !isVerifying && (
                  <CheckCircle className="text-white" size={24} />
                )}
                {isVerifying && (
                  <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
              </button>
              
              <span className="text-gray-700 font-medium">
                I'm not a robot
              </span>
            </div>

            {/* Logo/Badge */}
            <div className="flex flex-col items-end">
              <div className="flex items-center space-x-1 text-xs text-gray-500">
                <Shield size={16} />
                <span>reCAPTCHA</span>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                <a href="#" className="hover:underline">Privacy</a>
                <span className="mx-1">-</span>
                <a href="#" className="hover:underline">Terms</a>
              </div>
            </div>
          </div>

          {/* Verification Status */}
          {isVerifying && (
            <div className="mt-4 text-center">
              <p className="text-sm text-blue-600 font-medium">Verifying...</p>
            </div>
          )}
          
          {isChecked && !isVerifying && (
            <div className="mt-4 text-center">
              <p className="text-sm text-green-600 font-medium flex items-center justify-center">
                <CheckCircle size={16} className="mr-1" />
                Verified successfully!
              </p>
            </div>
          )}
        </div>

        {/* Cancel Button */}
        <button
          onClick={handleClose}
          className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
        >
          Cancel
        </button>
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
