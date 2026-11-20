import React from 'react'
import {
  FileText, ExternalLink, CheckCircle2, User, Clock,
  Calendar, Link as LinkIcon, HelpCircle
} from 'lucide-react'
import type { CustomFormConfig, FormField } from '@/types/form'
import './forms.css'

interface CustomFormResponseViewerProps {
  formConfig?: CustomFormConfig | null
  response?: any // custom_form_response object
}

export const CustomFormResponseViewer: React.FC<CustomFormResponseViewerProps> = ({
  formConfig,
  response,
}) => {
  if (!response || !response.answers) {
    return (
      <div style={{
        padding: '16px',
        borderRadius: '20px',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        color: '#71717a',
        fontSize: '13px',
        textAlign: 'center',
      }}>
        No application form responses submitted yet.
      </div>
    )
  }

  const answers: Record<string, any> = response.answers || {}
  const fields: FormField[] = formConfig?.fields || []

  // Create question mapping: fieldId -> label
  const fieldMap = new Map<string, FormField>()
  fields.forEach(f => fieldMap.set(f.id, f))

  // Collect entries: either from formConfig fields, or fallback to answers keys
  const renderedItems: { id: string; label: string; type?: string; value: any }[] = []

  if (fields.length > 0) {
    fields.forEach(f => {
      renderedItems.push({
        id: f.id,
        label: f.label,
        type: f.type,
        value: answers[f.id],
      })
    })
  } else {
    Object.keys(answers).forEach((k, idx) => {
      renderedItems.push({
        id: k,
        label: `Question ${idx + 1}`,
        value: answers[k],
      })
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Submitter & Timestamp header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderRadius: '20px',
        background: 'rgba(99, 102, 241, 0.08)',
        border: '1px solid rgba(99, 102, 241, 0.2)',
        fontSize: '12px',
        color: '#a5b4fc',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <User size={14} />
          <span>Submitted by: <strong>{response.submitted_by_name || 'Team Leader'}</strong></span>
        </div>
        {response.submitted_at && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8' }}>
            <Clock size={12} />
            <span>{new Date(response.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        )}
      </div>

      {/* Answers list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {renderedItems.map((item, idx) => {
          const val = item.value

          return (
            <div key={item.id} className="cf-resp-row">
              <div className="cf-resp-q">
                {idx + 1}. {item.label}
              </div>

              <div className="cf-resp-a">
                {val === undefined || val === null || val === '' ? (
                  <span style={{ color: '#71717a', fontStyle: 'italic' }}>No answer provided</span>
                ) : Array.isArray(val) ? (
                  <div>
                    {val.map((chip, cIdx) => (
                      <span key={cIdx} className="cf-resp-badge">
                        {chip}
                      </span>
                    ))}
                  </div>
                ) : typeof val === 'string' && (val.startsWith('http://') || val.startsWith('https://')) ? (
                  <a href={val} target="_blank" rel="noopener noreferrer" className="cf-resp-link">
                    <ExternalLink size={14} />
                    <span>{val}</span>
                  </a>
                ) : (
                  <span>{String(val)}</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
export default CustomFormResponseViewer
