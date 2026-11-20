import React from 'react'
import { ChevronDown } from 'lucide-react'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import './SelectDropdown.css'

export type SelectOption = string | { label: string; value: string; icon?: React.ReactNode }

interface SelectDropdownProps {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  icon?: React.ReactNode
  disabled?: boolean
  className?: string
  triggerStyle?: React.CSSProperties
  showPlaceholderOption?: boolean
}

export function SelectDropdown({
  value,
  onChange,
  options,
  placeholder = 'Select an option...',
  icon,
  disabled = false,
  className = '',
  triggerStyle,
  showPlaceholderOption = false,
}: SelectDropdownProps) {
  // Find selected option object or string
  const selectedOption = options.find((opt) => {
    if (typeof opt === 'string') return opt === value
    return opt.value === value
  })

  const displayLabel = typeof selectedOption === 'string'
    ? selectedOption
    : selectedOption?.label || (value ? value : placeholder)

  const SelectedIcon = typeof selectedOption !== 'string' ? selectedOption?.icon : null

  return (
    <div 
      className="select-dropdown-wrapper" 
      style={{ opacity: disabled ? 0.85 : 1, pointerEvents: disabled ? 'none' : 'auto', flex: 1 }}
    >
      {icon && <div className="select-dropdown-icon">{icon}</div>}
      <DropdownMenu>
        <DropdownMenuTrigger 
          type="button"
          className={`select-dropdown-trigger ${!icon ? 'no-icon' : ''} ${className || ''}`.trim()}
          style={triggerStyle}
        >
          <span style={{ 
            color: value ? '#fff' : 'rgba(255, 255, 255, 0.4)', 
            overflow: 'hidden', 
            textOverflow: 'ellipsis', 
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            {SelectedIcon && <span style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>{SelectedIcon}</span>}
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayLabel}</span>
          </span>
          {!disabled && <ChevronDown size={18} style={{ flexShrink: 0, color: 'rgba(255,255,255,0.4)', marginLeft: 8 }} />}
        </DropdownMenuTrigger>
        <DropdownMenuContent className="select-dropdown-content">
          {showPlaceholderOption && (
            <DropdownMenuItem onClick={() => onChange('')} style={{ opacity: 0.6 }}>
              {placeholder}
            </DropdownMenuItem>
          )}
          {options.length === 0 && !showPlaceholderOption && (
            <div style={{ padding: '12px 14px', fontSize: '13px', color: 'rgba(255, 255, 255, 0.4)', textAlign: 'center' }}>
              No options available
            </div>
          )}
          {options.map((opt) => {
            const optValue = typeof opt === 'string' ? opt : opt.value
            const optLabel = typeof opt === 'string' ? opt : opt.label
            const OptIcon = typeof opt !== 'string' ? opt.icon : null
            const isSelected = optValue === value

            return (
              <DropdownMenuItem
                key={optValue}
                onClick={() => onChange(optValue)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontWeight: isSelected ? 600 : 400,
                  color: isSelected ? '#a5b4fc' : undefined,
                  background: isSelected ? 'rgba(99, 102, 241, 0.15)' : undefined,
                }}
              >
                {OptIcon && <span style={{ display: 'inline-flex', alignItems: 'center', color: isSelected ? '#818cf8' : 'rgba(255,255,255,0.6)', flexShrink: 0 }}>{OptIcon}</span>}
                <span>{optLabel}</span>
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
