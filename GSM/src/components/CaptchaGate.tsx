import React, { useRef, useState } from 'react'
// @ts-ignore - Optional dependency for Google reCAPTCHA
import ReCAPTCHA from 'react-google-recaptcha'

type CaptchaGateProps = {
  onVerified: (token: string | null) => void
  size?: 'normal' | 'invisible' | 'compact'
  className?: string
}

const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY

const CaptchaGate: React.FC<CaptchaGateProps> = ({ onVerified, size = 'normal', className }) => {
  const ref = useRef<ReCAPTCHA>(null)
  const [token, setToken] = useState<string | null>(null)

  const handleChange = (val: string | null) => {
    setToken(val)
    onVerified(val)
  }

  // Show captcha when site key is available
  if (!siteKey) {
    return null
  }

  return (
    <div className={className}>
      <ReCAPTCHA
        ref={ref}
        sitekey={siteKey}
        size={size}
        onChange={handleChange}
        onExpired={() => handleChange(null)}
        onErrored={() => handleChange(null)}
      />
    </div>
  )
}

export default CaptchaGate


