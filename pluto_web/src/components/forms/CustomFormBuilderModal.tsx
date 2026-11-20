import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  X, Plus, Trash2, Copy, ArrowUp, ArrowDown, Eye, EyeOff,
  CheckCircle2, AlertCircle, FileText, Sparkles, HelpCircle,
  Link as LinkIcon, Hash, CheckSquare, ListFilter, AlignLeft, Type, Check
} from 'lucide-react'
import { SelectDropdown } from '@/components/ui/SelectDropdown'
import type { CustomFormConfig, FormField, FormFieldType } from '@/types/form'
import './forms.css'

interface CustomFormBuilderModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (config: CustomFormConfig) => void
  initialConfig?: CustomFormConfig | null
  competitionTitle?: string
}

const FIELD_TYPE_OPTIONS: { type: FormFieldType; label: string; icon: any }[] = [
  { type: 'text', label: 'Short Answer', icon: Type },
  { type: 'textarea', label: 'Paragraph / Long Answer', icon: AlignLeft },
  { type: 'url', label: 'Link / URL (GitHub, Portfolio, Drive)', icon: LinkIcon },
  { type: 'radio', label: 'Multiple Choice (Single)', icon: CheckCircle2 },
  { type: 'checkbox', label: 'Checkboxes (Multi-Select)', icon: CheckSquare },
  { type: 'select', label: 'Dropdown Menu', icon: ListFilter },
  { type: 'number', label: 'Number', icon: Hash },
]

export const CustomFormBuilderModal: React.FC<CustomFormBuilderModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialConfig,
  competitionTitle = 'Competition',
}) => {
  const [title, setTitle] = useState(initialConfig?.title || 'Application & Screening Form')
  const [description, setDescription] = useState(
    initialConfig?.description || 'Please complete this form with your project details and qualifications.'
  )
  const [purpose, setPurpose] = useState(
    initialConfig?.purpose || 'Used by the competition organizers to verify team member technical backgrounds, github repositories, and shortlist candidates.'
  )
  const [fields, setFields] = useState<FormField[]>(
    initialConfig?.fields && initialConfig.fields.length > 0
      ? initialConfig.fields
      : [
          {
            id: 'f_github_' + Date.now(),
            label: 'GitHub Repository or Portfolio URL',
            placeholder: 'https://github.com/...',
            helpText: 'Provide a link to your code repository or project showcase',
            type: 'url',
            required: true,
          },
          {
            id: 'f_skills_' + (Date.now() + 1),
            label: 'Primary Tech Stack & Tools',
            placeholder: 'e.g. React, Python, Flutter, Node.js',
            type: 'text',
            required: true,
          },
        ]
  )

  const [previewMode, setPreviewMode] = useState(false)
  const [previewAnswers, setPreviewAnswers] = useState<Record<string, any>>({})
  const [error, setError] = useState('')

  const answeredCount = fields.filter(f => {
    const a = previewAnswers[f.id]
    if (a === undefined || a === null || a === '') return false
    if (Array.isArray(a) && a.length === 0) return false
    return true
  }).length

  const progressPercent = fields.length > 0 ? Math.round((answeredCount / fields.length) * 100) : 0

  useEffect(() => {
    if (initialConfig) {
      setTitle(initialConfig.title || 'Application & Screening Form')
      setDescription(initialConfig.description || '')
      setPurpose(initialConfig.purpose || '')
      if (initialConfig.fields?.length) {
        setFields(initialConfig.fields)
      }
    }
  }, [initialConfig])

  if (!isOpen) return null

  // Add question helper
  const handleAddField = (type: FormFieldType = 'text', customLabel?: string) => {
    const newField: FormField = {
      id: 'f_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      label: customLabel || `Question ${fields.length + 1}`,
      type,
      required: false,
      placeholder: '',
      helpText: '',
      options: ['select', 'radio', 'checkbox'].includes(type) ? ['Option 1', 'Option 2'] : undefined,
    }
    setFields([...fields, newField])
  }

  // Update question
  const handleUpdateField = (id: string, updates: Partial<FormField>) => {
    setFields(fields.map(f => (f.id === id ? { ...f, ...updates } : f)))
  }

  // Remove question
  const handleDeleteField = (id: string) => {
    if (fields.length <= 1) {
      setError('Form must contain at least one question.')
      return
    }
    setError('')
    setFields(fields.filter(f => f.id !== id))
  }

  // Duplicate question
  const handleDuplicateField = (field: FormField) => {
    const clone: FormField = {
      ...field,
      id: 'f_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      label: field.label + ' (Copy)',
      options: field.options ? [...field.options] : undefined,
    }
    const idx = fields.findIndex(f => f.id === field.id)
    const newFields = [...fields]
    newFields.splice(idx + 1, 0, clone)
    setFields(newFields)
  }

  // Reorder
  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1
    if (targetIdx < 0 || targetIdx >= fields.length) return
    const newFields = [...fields]
    const temp = newFields[index]
    newFields[index] = newFields[targetIdx]
    newFields[targetIdx] = temp
    setFields(newFields)
  }

  // Add Option
  const handleAddOption = (fieldId: string) => {
    setFields(
      fields.map(f => {
        if (f.id === fieldId) {
          const opts = f.options || []
          return { ...f, options: [...opts, `Option ${opts.length + 1}`] }
        }
        return f
      })
    )
  }

  // Update Option
  const handleUpdateOption = (fieldId: string, optIdx: number, val: string) => {
    setFields(
      fields.map(f => {
        if (f.id === fieldId && f.options) {
          const next = [...f.options]
          next[optIdx] = val
          return { ...f, options: next }
        }
        return f
      })
    )
  }

  // Delete Option
  const handleDeleteOption = (fieldId: string, optIdx: number) => {
    setFields(
      fields.map(f => {
        if (f.id === fieldId && f.options && f.options.length > 1) {
          const next = f.options.filter((_, i) => i !== optIdx)
          return { ...f, options: next }
        }
        return f
      })
    )
  }

  // Save validation
  const handleSave = () => {
    if (!title.trim()) {
      setError('Please provide a form title.')
      return
    }
    for (let i = 0; i < fields.length; i++) {
      if (!fields[i].label.trim()) {
        setError(`Question #${i + 1} is missing a question prompt.`)
        return
      }
      if (['select', 'radio', 'checkbox'].includes(fields[i].type)) {
        if (!fields[i].options || fields[i].options!.length === 0) {
          setError(`Question "${fields[i].label}" must have at least one choice option.`)
          return
        }
      }
    }

    const seenIds = new Set<string>()
    const sanitizedFields = fields.map((f, idx) => {
      let uniqueId = f.id && typeof f.id === 'string' && f.id.trim() ? f.id.trim() : `f_${idx}_${Date.now()}`
      if (seenIds.has(uniqueId)) {
        uniqueId = `${uniqueId}_${idx}_${Math.random().toString(36).substring(2, 6)}`
      }
      seenIds.add(uniqueId)
      return { ...f, id: uniqueId }
    })

    const config: CustomFormConfig = {
      id: initialConfig?.id || 'form_' + Date.now(),
      title: title.trim(),
      description: description.trim(),
      purpose: purpose.trim(),
      fields: sanitizedFields,
      is_active: true,
      updated_at: new Date().toISOString(),
    }

    onSave(config)
    onClose()
  }

  return createPortal(
    <div className="cf-overlay" onClick={onClose}>
      <div className="cf-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="cf-header">
          <div className="cf-header-left">
            <div className="cf-icon-badge">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="cf-title">
                {previewMode ? 'Form Preview (Applicant View)' : 'Custom Application Form Builder'}
              </h2>
              <p className="cf-subtitle">
                {previewMode ? 'How students and team leaders will see and answer this form' : `Collect student information for ${competitionTitle}`}
              </p>
            </div>
          </div>
          <div className="cf-header-actions">
            <button
              className="cf-btn-ghost"
              onClick={() => setPreviewMode(!previewMode)}
              title={previewMode ? 'Back to Editor' : 'Preview Form'}
            >
              {previewMode ? <EyeOff size={16} /> : <Eye size={16} />}
              <span>{previewMode ? 'Edit Mode' : 'Preview'}</span>
            </button>
            <button className="cf-btn-close" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="cf-body">
          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 12,
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: '#f87171',
              fontSize: 13,
            }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* PREVIEW MODE */}
          {previewMode ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="cf-fill-header-banner" style={{ borderRadius: 16 }}>
                <span className="cf-fill-badge">
                  <Sparkles size={12} /> Application Form
                </span>
                <h3 className="cf-fill-title">{title}</h3>
                {description && <p className="cf-fill-desc">{description}</p>}
              </div>

              {purpose && (
                <div className="cf-purpose-card">
                  <div className="cf-purpose-icon">
                    <HelpCircle size={18} />
                  </div>
                  <div className="cf-purpose-content">
                    <div className="cf-purpose-title">Purpose of this form</div>
                    <p className="cf-purpose-desc">{purpose}</p>
                  </div>
                </div>
              )}

              {/* Progress Bar */}
              <div style={{
                background: '#19191e',
                borderRadius: '20px',
                padding: '12px 18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span style={{ color: '#a78bfa', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={12} /> Live Preview Progress
                  </span>
                  <span style={{ color: '#34d399', fontWeight: 600 }}>
                    {answeredCount} of {fields.length} Answered ({progressPercent}%)
                  </span>
                </div>
                <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '10px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${progressPercent}%`, background: '#8b5cf6', borderRadius: '10px', transition: 'width 0.2s ease' }} />
                </div>
              </div>

              {fields.map((field, idx) => (
                <div key={field.id} className="cf-fill-question">
                  <label className="cf-fill-q-label">
                    <span>{idx + 1}. {field.label}</span>
                    {field.required && <span className="cf-required-star">*</span>}
                  </label>
                  {field.helpText && <div className="cf-fill-q-help">{field.helpText}</div>}

                  {field.type === 'text' && (
                    <input
                      className="cf-input"
                      placeholder={field.placeholder || 'Your answer...'}
                      value={previewAnswers[field.id] || ''}
                      onChange={e => setPreviewAnswers({ ...previewAnswers, [field.id]: e.target.value })}
                    />
                  )}

                  {field.type === 'textarea' && (
                    <textarea
                      className="cf-textarea"
                      placeholder={field.placeholder || 'Your answer...'}
                      value={previewAnswers[field.id] || ''}
                      onChange={e => setPreviewAnswers({ ...previewAnswers, [field.id]: e.target.value })}
                    />
                  )}

                  {field.type === 'url' && (
                    <div style={{ position: 'relative' }}>
                      <LinkIcon size={14} style={{ position: 'absolute', left: 12, top: 12, color: '#71717a' }} />
                      <input
                        className="cf-input"
                        style={{ paddingLeft: 34 }}
                        placeholder={field.placeholder || 'https://...'}
                        value={previewAnswers[field.id] || ''}
                        onChange={e => setPreviewAnswers({ ...previewAnswers, [field.id]: e.target.value })}
                      />
                    </div>
                  )}

                  {field.type === 'number' && (
                    <input
                      type="number"
                      className="cf-input"
                      placeholder={field.placeholder || '0'}
                      value={previewAnswers[field.id] || ''}
                      onChange={e => setPreviewAnswers({ ...previewAnswers, [field.id]: e.target.value })}
                    />
                  )}

                  {field.type === 'select' && (
                    <SelectDropdown
                      value={previewAnswers[field.id] || ''}
                      onChange={val => setPreviewAnswers({ ...previewAnswers, [field.id]: val })}
                      options={(field.options && field.options.length > 0) ? field.options : ['Option 1', 'Option 2']}
                      placeholder={field.placeholder || 'Select an option...'}
                      className="cf-preview-select"
                      showPlaceholderOption={false}
                    />
                  )}

                  {field.type === 'radio' && (
                    <div className="cf-fill-options-list">
                      {(field.options || []).map((opt, i) => {
                        const isSelected = previewAnswers[field.id] === opt
                        return (
                          <div
                            key={i}
                            className={`cf-fill-option-item ${isSelected ? 'selected' : ''}`}
                            onClick={() => setPreviewAnswers({ ...previewAnswers, [field.id]: opt })}
                          >
                            <div className="cf-custom-radio">
                              {isSelected && <div className="cf-custom-radio-inner" />}
                            </div>
                            <span>{opt}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {field.type === 'checkbox' && (
                    <div className="cf-fill-options-list">
                      {(field.options || []).map((opt, i) => {
                        const current = Array.isArray(previewAnswers[field.id]) ? previewAnswers[field.id] : []
                        const isSelected = current.includes(opt)
                        return (
                          <div
                            key={i}
                            className={`cf-fill-option-item ${isSelected ? 'selected' : ''}`}
                            onClick={() => {
                              const next = isSelected ? current.filter((x: string) => x !== opt) : [...current, opt]
                              setPreviewAnswers({ ...previewAnswers, [field.id]: next })
                            }}
                          >
                            <div className="cf-custom-checkbox">
                              {isSelected && <Check size={12} color="#fff" />}
                            </div>
                            <span>{opt}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            /* BUILDER MODE */
            <>
              {/* Form Metadata */}
              <div className="cf-meta-section">
                <div className="cf-field-group">
                  <label className="cf-label">Form Title</label>
                  <input
                    className="cf-input"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Team Screening & Project Information Form"
                  />
                </div>

                <div className="cf-field-group">
                  <label className="cf-label">Description / Instructions for Applicants</label>
                  <textarea
                    className="cf-textarea"
                    rows={2}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Short instructions shown to applicants at the top of the form..."
                  />
                </div>

                <div className="cf-field-group">
                  <label className="cf-label">
                    <span>Why are you collecting this information? (Form Purpose)</span>
                    <span style={{ fontSize: 11, color: '#818cf8' }}>Shown to applicants via eye icon</span>
                  </label>
                  <input
                    className="cf-input"
                    value={purpose}
                    onChange={e => setPurpose(e.target.value)}
                    placeholder="e.g. To evaluate candidate tech stack, verify prior hackathon participation, and shortlist genuine teams."
                  />
                </div>
              </div>

              {/* Quick Template Buttons */}
              <div className="cf-quick-templates">
                <span style={{ fontSize: 11, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase' }}>
                  Quick Add:
                </span>
                <button
                  type="button"
                  className="cf-quick-btn"
                  onClick={() => handleAddField('url', 'GitHub / Project Demo Link')}
                >
                  <LinkIcon size={12} /> + GitHub Link
                </button>
                <button
                  type="button"
                  className="cf-quick-btn"
                  onClick={() => handleAddField('text', 'Primary Tech Stack & Tools')}
                >
                  <Type size={12} /> + Tech Stack
                </button>
                <button
                  type="button"
                  className="cf-quick-btn"
                  onClick={() => handleAddField('textarea', 'Describe your project idea in 3-4 sentences')}
                >
                  <AlignLeft size={12} /> + Project Idea
                </button>
                <button
                  type="button"
                  className="cf-quick-btn"
                  onClick={() => handleAddField('text', 'College ID / Registration Number')}
                >
                  <Hash size={12} /> + Student College ID
                </button>
              </div>

              {/* Questions List */}
              <div className="cf-questions-list">
                {fields.map((field, index) => (
                  <div key={field.id} className="cf-question-card">
                    <div className="cf-question-header">
                      <div className="cf-q-number">{index + 1}</div>
                      <div className="cf-question-title-row">
                        <input
                          className="cf-input"
                          value={field.label}
                          onChange={e => handleUpdateField(field.id, { label: e.target.value })}
                          placeholder="Type question prompt..."
                        />
                        <SelectDropdown
                          value={field.type}
                          onChange={(val) => {
                            const newType = val as FormFieldType
                            const updates: Partial<FormField> = { type: newType }
                            if (['select', 'radio', 'checkbox'].includes(newType) && (!field.options || field.options.length === 0)) {
                              updates.options = ['Option 1', 'Option 2']
                            }
                            if (newType === 'select' && (!field.placeholder || field.placeholder.startsWith('http'))) {
                              updates.placeholder = 'Select an option...'
                            } else if (newType === 'radio' || newType === 'checkbox') {
                              updates.placeholder = ''
                            }
                            handleUpdateField(field.id, updates)
                          }}
                          options={FIELD_TYPE_OPTIONS.map(opt => ({
                            value: opt.type,
                            label: opt.label,
                            icon: <opt.icon size={15} />
                          }))}
                          placeholder="Select Type"
                          className="cf-field-type-dropdown"
                          triggerStyle={{ borderRadius: 12, height: 44 }}
                          showPlaceholderOption={false}
                        />
                      </div>
                    </div>

                    {/* Placeholder & Help Text */}
                    {field.type !== 'radio' && field.type !== 'checkbox' ? (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <input
                          className="cf-input"
                          value={field.placeholder || ''}
                          onChange={e => handleUpdateField(field.id, { placeholder: e.target.value })}
                          placeholder={field.type === 'select' ? "Dropdown placeholder (e.g. Select an option...)" : "Placeholder text (optional)..."}
                        />
                        <input
                          className="cf-input"
                          value={field.helpText || ''}
                          onChange={e => handleUpdateField(field.id, { helpText: e.target.value })}
                          placeholder="Help text / guidance hint (optional)..."
                        />
                      </div>
                    ) : (
                      <div>
                        <input
                          className="cf-input"
                          value={field.helpText || ''}
                          onChange={e => handleUpdateField(field.id, { helpText: e.target.value })}
                          placeholder="Help text / guidance hint (optional)..."
                        />
                      </div>
                    )}

                    {/* Options Editor (for select, radio, checkbox) */}
                    {['select', 'radio', 'checkbox'].includes(field.type) && (
                      <div className="cf-options-builder">
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', marginBottom: 4 }}>
                          Answer Options
                        </div>
                        {(field.options || []).map((opt, optIdx) => (
                          <div key={optIdx} className="cf-option-row">
                            <div className={`cf-option-bullet ${field.type === 'radio' ? 'circle' : ''}`} />
                            <input
                              className="cf-option-input"
                              value={opt}
                              onChange={e => handleUpdateOption(field.id, optIdx, e.target.value)}
                              placeholder={`Option ${optIdx + 1}`}
                            />
                            {(field.options?.length || 0) > 1 && (
                              <button
                                type="button"
                                className="cf-btn-icon-del"
                                onClick={() => handleDeleteOption(field.id, optIdx)}
                                title="Delete Option"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          className="cf-btn-add-option"
                          onClick={() => handleAddOption(field.id)}
                        >
                          <Plus size={14} /> Add Option
                        </button>
                      </div>
                    )}

                    {/* Question Card Footer Controls */}
                    <div className="cf-question-footer">
                      <div
                        className="cf-toggle-label"
                        onClick={() => handleUpdateField(field.id, { required: !field.required })}
                      >
                        <div className={`cf-switch ${field.required ? 'active' : ''}`}>
                          <div className="cf-switch-knob" />
                        </div>
                        <span>Required field</span>
                      </div>

                      <div className="cf-actions-group">
                        <button
                          type="button"
                          className="cf-btn-action"
                          disabled={index === 0}
                          onClick={() => handleMove(index, 'up')}
                          title="Move Up"
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          type="button"
                          className="cf-btn-action"
                          disabled={index === fields.length - 1}
                          onClick={() => handleMove(index, 'down')}
                          title="Move Down"
                        >
                          <ArrowDown size={14} />
                        </button>
                        <button
                          type="button"
                          className="cf-btn-action"
                          onClick={() => handleDuplicateField(field)}
                          title="Duplicate Question"
                        >
                          <Copy size={14} />
                        </button>
                        <button
                          type="button"
                          className="cf-btn-action delete"
                          onClick={() => handleDeleteField(field.id)}
                          title="Delete Question"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Question Button */}
              <button
                type="button"
                className="cf-btn-add-q"
                onClick={() => handleAddField()}
              >
                <Plus size={18} /> Add New Question
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="cf-footer">
          <div style={{ fontSize: 12, color: '#71717a' }}>
            {fields.length} {fields.length === 1 ? 'question' : 'questions'} in this form
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="cf-btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button className="cf-btn-save" onClick={handleSave}>
              <CheckCircle2 size={16} /> Save Application Form
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
export default CustomFormBuilderModal
