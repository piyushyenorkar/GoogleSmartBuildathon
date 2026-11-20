import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search } from 'lucide-react'

export interface HQDetailModalTab {
  id: string
  label: string
}

interface Props {
  isOpen: boolean
  onClose: () => void
  title: string
  icon?: React.ReactNode
  tabs?: HQDetailModalTab[]
  activeTab?: string
  onTabChange?: (tabId: string) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  toolbarExtra?: React.ReactNode
  children: React.ReactNode
}

export default function HQDetailModal({
  isOpen,
  onClose,
  title,
  icon,
  tabs,
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  toolbarExtra,
  children
}: Props) {

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="hq-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.4)',
              backdropFilter: 'blur(8px)',
              zIndex: 999
            }}
          />

          {/* Modal Container */}
          <div style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            zIndex: 1000,
            padding: '2rem'
          }}>
            <motion.div
              className="spatial-card"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{
                width: '100%',
                maxWidth: '900px',
                height: '85vh',
                display: 'flex',
                flexDirection: 'column',
                pointerEvents: 'auto',
                overflow: 'hidden',
                background: 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(40px)',
              }}
            >
              {/* Header */}
              <div style={{
                padding: '1.5rem',
                borderBottom: '1px solid var(--glass-border-strong)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'transparent'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {icon && <div style={{ color: 'var(--accent-primary)' }}>{icon}</div>}
                  <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {title}
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  style={{
                    background: 'rgba(0,0,0,0.05)',
                    border: 'none',
                    borderRadius: '50%',
                    width: 32,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'var(--text-secondary)'
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Toolbar: Tabs & Search */}
              <div style={{
                padding: '1rem 1.5rem',
                borderBottom: '1px solid var(--glass-border)',
                display: 'flex',
                gap: '1rem',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap'
              }}>
                {tabs && tabs.length > 0 && onTabChange ? (
                  <div style={{
                    display: 'flex',
                    background: 'rgba(0,0,0,0.04)',
                    padding: '4px',
                    borderRadius: '24px',
                    gap: '4px',
                    height: '42px',
                    alignItems: 'center'
                  }}>
                    {tabs.map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        style={{
                          height: '100%',
                          padding: '0 16px',
                          borderRadius: '20px',
                          border: 'none',
                          background: activeTab === tab.id ? '#fff' : 'transparent',
                          color: activeTab === tab.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
                          fontWeight: activeTab === tab.id ? 600 : 500,
                          fontSize: '0.9rem',
                          cursor: 'pointer',
                          boxShadow: activeTab === tab.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                ) : null}

                {toolbarExtra && (
                  <div style={{ flex: 1, display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {toolbarExtra}
                  </div>
                )}

                <div style={{ position: 'relative', width: '280px', maxWidth: '100%', marginLeft: (!tabs || tabs.length === 0) && !toolbarExtra ? 'auto' : 0 }}>
                  <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#64748b', zIndex: 10, pointerEvents: 'none' }} />
                  <input
                    type="text"
                    className="glass-input"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={e => onSearchChange(e.target.value)}
                    style={{ 
                      paddingLeft: '2.5rem', 
                      paddingRight: '1rem', 
                      width: '100%',
                      height: '42px',
                      borderRadius: '24px',
                      margin: 0,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Scrollable Content Area */}
              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '1.5rem'
              }}>
                {children}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
