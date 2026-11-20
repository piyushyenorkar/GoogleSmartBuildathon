import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Check } from 'lucide-react'

export interface DropdownOption {
  value: string
  label: string
}

interface DropdownProps {
  options: DropdownOption[]
  value: string
  onChange: (value: string) => void
  style?: React.CSSProperties
  buttonStyle?: React.CSSProperties
  className?: string
}

export default function Dropdown({ options, value, onChange, style, buttonStyle, className }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find((opt) => opt.value === value) || options[0]

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: 'relative',
        display: 'inline-block',
        ...style,
      }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          borderRadius: '999px',
          border: '1px solid var(--glass-border-strong, rgba(0,0,0,0.1))',
          background: 'rgba(255,255,255,0.7)',
          fontSize: '0.85rem',
          fontWeight: 500,
          color: 'var(--text-primary, #475569)',
          outline: 'none',
          cursor: 'pointer',
          width: '100%',
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
          transition: 'all 0.2s',
          whiteSpace: 'nowrap',
          ...buttonStyle,
        }}
      >
        <span style={{ flex: 1, textAlign: 'left' }}>{selectedOption?.label}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          style={{ display: 'flex', alignItems: 'center' }}
        >
          <ChevronDown size={16} color="var(--text-muted, #64748b)" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              minWidth: '100%',
              width: 'max-content',
              background: 'var(--white, #ffffff)',
              border: '1px solid var(--glass-border-strong, rgba(0,0,0,0.1))',
              borderRadius: '12px',
              overflowY: 'auto',
              maxHeight: '250px',
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
              zIndex: 50,
              padding: '0.4rem',
            }}
          >
            {options.map((opt) => {
              const isSelected = opt.value === value
              return (
                <div
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value)
                    setIsOpen(false)
                  }}
                  style={{
                    padding: '0.5rem 0.8rem',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    color: isSelected ? 'var(--primary-color, #4f46e5)' : 'var(--text-secondary, #64748b)',
                    cursor: 'pointer',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: isSelected ? 'rgba(79, 70, 229, 0.08)' : 'transparent',
                    transition: 'all 0.15s',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'rgba(0,0,0,0.03)'
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'transparent'
                  }}
                >
                  {opt.label}
                  {isSelected && <Check size={14} color="var(--primary-color, #4f46e5)" />}
                </div>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
