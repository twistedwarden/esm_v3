import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'

type Icon = {
  id: number
  name: string
  svg: string
  x: number
  y: number
  rotation: number
}

type ClickOrderCaptchaProps = {
  isOpen: boolean
  onClose: () => void
  onVerified: () => void
}

const ICONS = [
  { name: 'trash', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z"/></svg>' },
  { name: 'send', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>' },
  { name: 'home', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>' },
  { name: 'flag', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>' },
  { name: 'lock', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>' },
  { name: 'bell', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>' },
  { name: 'mail', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>' }
]

const COLORS = ['#9b87c7', '#7fa99b', '#c7a87f', '#87a7c7', '#c79b87']

export const ClickOrderCaptcha: React.FC<ClickOrderCaptchaProps> = ({ isOpen, onClose, onVerified }) => {
  const [icons, setIcons] = useState<Icon[]>([])
  const [targetSequence, setTargetSequence] = useState<string[]>([])
  const [clickedSequence, setClickedSequence] = useState<string[]>([])
  const [clickedIds, setClickedIds] = useState<Set<number>>(new Set())
  const [error, setError] = useState(false)

  useEffect(() => {
    if (isOpen) {
      generateCaptcha()
    }
  }, [isOpen])

  const generateCaptcha = () => {
    // Reset state
    setClickedSequence([])
    setClickedIds(new Set())
    setError(false)

    // Select 5 random icons
    const shuffled = [...ICONS].sort(() => Math.random() - 0.5)
    const selected = shuffled.slice(0, 5)

    // Generate random positions and rotations
    const generatedIcons: Icon[] = selected.map((icon, index) => ({
      id: index,
      name: icon.name,
      svg: icon.svg,
      x: 10 + Math.random() * 70,
      y: 10 + Math.random() * 70,
      rotation: Math.random() * 360
    }))

    setIcons(generatedIcons)

    // Set target sequence (random order of 3-4 icons)
    const sequenceLength = 3 + Math.floor(Math.random() * 2) // 3 or 4
    const sequence = [...selected]
      .sort(() => Math.random() - 0.5)
      .slice(0, sequenceLength)
      .map(icon => icon.name)
    
    setTargetSequence(sequence)
  }

  const handleIconClick = (icon: Icon) => {
    if (clickedIds.has(icon.id)) return // Already clicked

    const newClickedSequence = [...clickedSequence, icon.name]
    const newClickedIds = new Set(clickedIds).add(icon.id)

    setClickedSequence(newClickedSequence)
    setClickedIds(newClickedIds)

    // Check if the sequence matches so far
    const isCorrectSoFar = newClickedSequence.every((name, idx) => name === targetSequence[idx])

    if (!isCorrectSoFar) {
      // Wrong order - show error and reset
      setError(true)
      setTimeout(() => {
        generateCaptcha()
      }, 1000)
      return
    }

    // Check if completed successfully
    if (newClickedSequence.length === targetSequence.length) {
      setTimeout(() => {
        onVerified()
        onClose()
      }, 500)
    }
  }

  const getIconName = (name: string): string => {
    const nameMap: { [key: string]: string } = {
      trash: 'Trash',
      send: 'Send',
      home: 'Home',
      flag: 'Flag',
      lock: 'Lock',
      bell: 'Bell',
      mail: 'Mail'
    }
    return nameMap[name] || name
  }

  // Show modal when open
  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={24} />
        </button>

        {/* Header */}
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-2">Security Verification</h3>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-gray-700 font-medium mb-2">Click in order:</p>
            <div className="flex gap-2 flex-wrap">
              {targetSequence.map((name, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium transition-all ${
                    clickedSequence[idx]
                      ? 'bg-green-100 text-green-700 border border-green-300'
                      : 'bg-gray-100 text-gray-700 border border-gray-300'
                  }`}
                >
                  <span className="font-bold">{idx + 1}.</span>
                  <span>{getIconName(name)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CAPTCHA Canvas */}
        <div className="relative w-full h-64 bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg border-2 border-gray-300 overflow-hidden">
          {/* Texture overlay */}
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width="100" height="100" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noise"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" /%3E%3C/filter%3E%3Crect width="100" height="100" filter="url(%23noise)" opacity="0.4"/%3E%3C/svg%3E")'
          }}></div>

          {/* Icons */}
          {icons.map((icon, idx) => {
            const isClicked = clickedIds.has(icon.id)
            const color = COLORS[idx % COLORS.length]
            
            return (
              <button
                key={icon.id}
                onClick={() => handleIconClick(icon)}
                disabled={isClicked}
                className={`absolute transition-all duration-300 ${
                  isClicked ? 'opacity-30 scale-90' : 'hover:scale-110 cursor-pointer'
                } ${error && !isClicked ? 'animate-shake' : ''}`}
                style={{
                  left: `${icon.x}%`,
                  top: `${icon.y}%`,
                  transform: `translate(-50%, -50%) rotate(${icon.rotation}deg)`,
                  color: color,
                  width: '48px',
                  height: '48px'
                }}
              >
                <div dangerouslySetInnerHTML={{ __html: icon.svg }} />
              </button>
            )
          })}
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 text-center">
            <p className="text-sm text-red-600 font-medium">❌ Wrong order! Try again...</p>
          </div>
        )}

        {/* Retry button */}
        <button
          onClick={generateCaptcha}
          className="mt-4 w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
        >
          🔄 Generate New Challenge
        </button>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translate(-50%, -50%) translateX(0); }
          25% { transform: translate(-50%, -50%) translateX(-5px); }
          75% { transform: translate(-50%, -50%) translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  )
}
