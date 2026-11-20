import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, ShieldCheck, AlertTriangle } from 'lucide-react'
import { verifyPin } from '@/services/plutoHQService'
import './PinGate.css'

interface PinGateProps {
  onUnlock: () => void
}

export default function PinGate({ onUnlock }: PinGateProps) {
  const [pin, setPin] = useState<string[]>(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [cooldown, setCooldown] = useState(0)
  const [unlocked, setUnlocked] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    setTimeout(() => inputRefs.current[0]?.focus(), 300)
  }, [])

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) { clearInterval(timer); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  const handleInput = (index: number, value: string) => {
    if (cooldown > 0) return
    if (!/^\d*$/.test(value)) return

    const newPin = [...pin]
    newPin[index] = value.slice(-1)
    setPin(newPin)
    setError('')

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    if (value && index === 5 && newPin.every(d => d !== '')) {
      handleVerify(newPin.join(''))
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
      const newPin = [...pin]
      newPin[index - 1] = ''
      setPin(newPin)
    }
    if (e.key === 'Enter') {
      const fullPin = pin.join('')
      if (fullPin.length === 6) handleVerify(fullPin)
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      const newPin = pasted.split('')
      setPin(newPin)
      inputRefs.current[5]?.focus()
      handleVerify(pasted)
    }
  }

  const handleVerify = async (pinStr: string) => {
    if (verifying || cooldown > 0) return
    setVerifying(true)
    setError('')

    try {
      const result = await verifyPin(pinStr)
      if (result.valid) {
        sessionStorage.setItem('pluto-owner-pin', pinStr)
        setUnlocked(true)
        setTimeout(onUnlock, 1200) // Delay a bit for unlock animation
      } else {
        const newAttempts = attempts + 1
        setAttempts(newAttempts)
        setPin(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()

        if (newAttempts >= 3) {
          setCooldown(30)
          setError('') // clear error so dynamic timer shows
          setAttempts(0)
        } else {
          setError(`Invalid PIN. ${3 - newAttempts} attempts remaining.`)
        }
      }
    } catch {
      setError('Connection failed. Is the backend running?')
      setPin(['', '', '', '', '', ''])
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div className="pin-gate-overlay">
      <div className="pin-gate-space" />
      <div className="pin-gate-glow-1" />
      <div className="pin-gate-glow-2" />

      <motion.div
        className={`pin-gate-card ${unlocked ? 'pin-unlocked' : ''}`}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="pin-gate-icon-wrapper">
          <motion.div
            className="pin-gate-icon"
            animate={unlocked ? { scale: [1, 1.2, 1], rotate: [0, 0, 360] } : { scale: 1 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          >
            {unlocked ? <ShieldCheck size={40} strokeWidth={2} /> : <Lock size={40} strokeWidth={2} />}
          </motion.div>
        </div>

        <h1 className="pin-gate-title">
          {unlocked ? 'Access Granted' : 'Pluto Headquarters'}
        </h1>
        <p className="pin-gate-subtitle">
          {unlocked
            ? 'Initializing secure connection to dashboard...'
            : 'Enter your 6-digit security PIN to access the control panel.'
          }
        </p>

        {!unlocked && (
          <div className="pin-input-container">
            <div className="pin-input-row" onPaste={handlePaste}>
              {pin.map((digit, i) => (
                <motion.input
                  key={i}
                  ref={el => { inputRefs.current[i] = el }}
                  type="password"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleInput(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  className={`pin-digit-input ${digit ? 'filled' : ''} ${error ? 'error' : ''}`}
                  disabled={verifying || cooldown > 0}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i }}
                  autoComplete="off"
                />
              ))}
            </div>
          </div>
        )}

        <div className="pin-status-wrapper">
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                key="error"
                className="pin-error-msg"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
              >
                <AlertTriangle size={14} />
                {error}
              </motion.div>
            )}

            {cooldown > 0 && !error && (
              <motion.div
                key="cooldown"
                className="pin-cooldown-msg"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
              >
                <Lock size={14} />
                Locked for {cooldown}s
              </motion.div>
            )}

            {verifying && (
              <motion.div
                key="verifying"
                className="pin-verifying-msg"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
              >
                <div className="spin-loader" />
                Verifying Credentials...
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
