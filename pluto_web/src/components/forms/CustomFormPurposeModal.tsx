import React from 'react'
import { createPortal } from 'react-dom'
import {
  X, Eye, HelpCircle, FileText, CheckCircle2,
  Tag, ListFilter, AlignLeft, Link as LinkIcon
} from 'lucide-react'
import type { CustomFormConfig } from '@/types/form'
import './forms.css'

interface CustomFormPurposeModalProps {
  isOpen: boolean
  onClose: () => void
  formConfig?: CustomFormConfig | null
  onEdit?: () => void
  onOpenForm?: () => void
}

export const CustomFormPurposeModal: React.FC<CustomFormPurposeModalProps> = ({
  isOpen,
  onClose,
  formConfig,
  onEdit,
  onOpenForm,
}) => {
  if (!isOpen || !formConfig) return null

  return createPortal(
    <div className="cf-overlay" onClick={onClose}>
      <div className="cf-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '580px' }}>
        <div className="cf-header">
          <div className="cf-header-left">
            <div className="cf-icon-badge" style={{ background: 'rgba(56, 189, 248, 0.15)', borderColor: 'rgba(56, 189, 248, 0.3)', color: '#38bdf8' }}>
              <Eye size={20} />
            </div>
            <div>
              <h2 className="cf-title">Form Purpose & Overview</h2>
              <p className="cf-subtitle">{formConfig.title || 'Application Form'}</p>
            </div>
          </div>
          <button className="cf-btn-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="cf-body">
          {/* Purpose Card */}
          <div className="cf-purpose-card info">
            <div className="cf-purpose-icon">
              <HelpCircle size={20} />
            </div>
            <div className="cf-purpose-content">
              <div className="cf-purpose-title" style={{ color: '#7dd3fc' }}>Why this form was created</div>
              <p className="cf-purpose-desc" style={{ color: '#bae6fd' }}>
                {formConfig.purpose || 'This form was created to collect necessary information from students and team leaders during registration for verification and shortlisting.'}
              </p>
            </div>
          </div>

          {formConfig.description && (
            <div style={{ padding: '12px 14px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', marginBottom: '4px' }}>
                Applicant Instructions
              </div>
              <div style={{ fontSize: '13px', color: '#e4e4e7', lineHeight: '1.5' }}>
                {formConfig.description}
              </div>
            </div>
          )}

          {/* Questions summary */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', marginBottom: '8px' }}>
              Form Questions ({formConfig.fields?.length || 0})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(formConfig.fields || []).map((f, idx) => (
                <div
                  key={f.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: '#18181b',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '12px', color: '#71717a', fontWeight: 700 }}>{idx + 1}.</span>
                    <span style={{ fontSize: '13px', color: '#fff', fontWeight: 500 }}>{f.label}</span>
                    {f.required && (
                      <span style={{ fontSize: '10px', color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                        Required
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '11px', color: '#a1a1aa', background: 'rgba(255, 255, 255, 0.05)', padding: '2px 8px', borderRadius: '6px' }}>
                    {f.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="cf-footer">
          <div style={{ display: 'flex', gap: 8 }}>
            {onEdit && (
              <button
                type="button"
                className="cf-btn-ghost"
                onClick={() => {
                  onClose()
                  onEdit()
                }}
              >
                Edit Questions
              </button>
            )}
            {onOpenForm && (
              <button
                type="button"
                className="cf-btn-save"
                onClick={() => {
                  onClose()
                  onOpenForm()
                }}
              >
                Fill Form
              </button>
            )}
          </div>
          <button className="cf-btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
export default CustomFormPurposeModal
