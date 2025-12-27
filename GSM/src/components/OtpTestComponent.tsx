// OTP Test Component for demonstrating Brevo OTP functionality
import React, { useState } from 'react';
import { apiService } from '../services/apiService';
import { envConfig } from '../config/environment';

interface OtpTestComponentProps {
  onClose: () => void;
}

export const OtpTestComponent: React.FC<OtpTestComponentProps> = ({ onClose }) => {
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');

  const showMessage = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  };

  const handleSendOtp = async () => {
    if (!email) {
      showMessage('Please enter an email address', 'error');
      return;
    }

    setLoading(true);
    try {
      const result = await apiService.sendOtp(email, 'Test User');
      if (result.success) {
        showMessage(`OTP sent successfully! ${result.data?.otpCode ? `Code: ${result.data.otpCode}` : ''}`, 'success');
      } else {
        showMessage(result.error || 'Failed to send OTP', 'error');
      }
    } catch (error) {
      showMessage('Network error. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!email || !otpCode) {
      showMessage('Please enter both email and OTP code', 'error');
      return;
    }

    setLoading(true);
    try {
      const result = await apiService.verifyOtp(email, otpCode);
      if (result.success) {
        showMessage('OTP verified successfully!', 'success');
        setOtpCode('');
      } else {
        showMessage(result.error || 'OTP verification failed', 'error');
      }
    } catch (error) {
      showMessage('Network error. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email) {
      showMessage('Please enter an email address', 'error');
      return;
    }

    setLoading(true);
    try {
      const result = await apiService.resendOtp(email, 'Test User');
      if (result.success) {
        showMessage('OTP resent successfully!', 'success');
      } else {
        showMessage(result.error || 'Failed to resend OTP', 'error');
      }
    } catch (error) {
      showMessage('Network error. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Brevo OTP Test</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* Configuration Status */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-sm mb-2">Configuration Status:</h4>
          <div className="text-xs space-y-1">
            <div className={`flex items-center ${envConfig.brevoApiKey ? 'text-green-600' : 'text-red-600'}`}>
              <span className="w-2 h-2 rounded-full bg-current mr-2"></span>
              Brevo API Key: {envConfig.brevoApiKey ? 'Configured' : 'Missing'}
            </div>
            <div className={`flex items-center ${envConfig.googleClientId ? 'text-green-600' : 'text-red-600'}`}>
              <span className="w-2 h-2 rounded-full bg-current mr-2"></span>
              Google OAuth: {envConfig.googleClientId ? 'Configured' : 'Missing'}
            </div>
            <div className="text-gray-600">
              Debug Mode: {envConfig.debugMode ? 'Enabled' : 'Disabled'}
            </div>
          </div>
        </div>

        {/* Email Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email address"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* OTP Code Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">OTP Code</label>
          <input
            type="text"
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="Enter 6-digit OTP"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            maxLength={6}
          />
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={handleSendOtp}
            disabled={loading || !email}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending...' : 'Send OTP'}
          </button>
          
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleVerifyOtp}
              disabled={loading || !email || !otpCode}
              className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Verify OTP
            </button>
            
            <button
              onClick={handleResendOtp}
              disabled={loading || !email}
              className="bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Resend OTP
            </button>
          </div>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`mt-4 p-3 rounded-lg text-sm ${
            messageType === 'success' ? 'bg-green-100 text-green-700' :
            messageType === 'error' ? 'bg-red-100 text-red-700' :
            'bg-blue-100 text-blue-700'
          }`}>
            {message}
          </div>
        )}

        {/* Instructions */}
        <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
          <h4 className="font-medium text-sm mb-2">Instructions:</h4>
          <ol className="text-xs text-gray-600 space-y-1 list-decimal list-inside">
            <li>Enter a valid email address</li>
            <li>Click "Send OTP" to receive a 6-digit code</li>
            <li>Enter the OTP code and click "Verify OTP"</li>
            <li>Use "Resend OTP" if needed (1-minute cooldown)</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default OtpTestComponent;
