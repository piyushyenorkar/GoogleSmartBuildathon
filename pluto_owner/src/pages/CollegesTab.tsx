import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2, Clock, CheckCircle, XCircle, ChevronRight,
  Users, Calendar, Trophy, MapPin, Globe, Phone, Mail,
  GraduationCap, Copy, Eye, X, AlertTriangle, Search
} from 'lucide-react'
import { useCollegeRequests, useAllColleges, useApproveCollege, useRejectCollege } from '@/hooks/useCollegeRequests'
import type { CollegeRequest, ApproveResult, CollegeWithStats } from '@/services/plutoHQService'
import Dropdown from '@/components/Dropdown'

type SubTab = 'requests' | 'approved'
type RequestFilter = 'pending' | 'approved' | 'rejected' | undefined

export default function CollegesTab() {
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [selectedRequest, setSelectedRequest] = useState<CollegeRequest | null>(null)
  const [credentials, setCredentials] = useState<ApproveResult['credentials'] | null>(null)
  const [rejectModal, setRejectModal] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [stateFilter, setStateFilter] = useState<string>('')
  const [cityFilter, setCityFilter] = useState<string>('')

  const { data: allRequests, isLoading: loadingReqs } = useCollegeRequests()
  const filteredRequests = allRequests?.filter(r => r.status === filter) || []
  const { data: colleges, isLoading: loadingColleges } = useAllColleges()
  const approveMutation = useApproveCollege()
  const rejectMutation = useRejectCollege()

  const handleApprove = async (id: string) => {
    if (!confirm('Approve this college? This will create admin credentials.')) return
    try {
      const result = await approveMutation.mutateAsync(id)
      setCredentials(result.credentials)
      setSelectedRequest(null)
    } catch (err: any) {
      alert(`Approval failed: ${err.message}`)
    }
  }

  const handleReject = async () => {
    if (!rejectModal) return
    try {
      await rejectMutation.mutateAsync({ id: rejectModal, reason: rejectReason })
      setRejectModal(null)
      setRejectReason('')
      setSelectedRequest(null)
    } catch (err: any) {
      alert(`Reject failed: ${err.message}`)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const filteredColleges = colleges?.filter(c => {
    const matchesSearch = !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesState = !stateFilter || c.state === stateFilter
    const matchesCity = !cityFilter || c.city === cityFilter
    return matchesSearch && matchesState && matchesCity
  })

  const availableStates = Array.from(new Set(colleges?.map(c => c.state).filter(Boolean))).sort()
  const availableCities = Array.from(new Set(colleges?.filter(c => !stateFilter || c.state === stateFilter).map(c => c.city).filter(Boolean))).sort()

  const counts = {
    all: colleges?.length || 0,
    pending: allRequests?.filter(r => r.status === 'pending').length || 0,
    approved: allRequests?.filter(r => r.status === 'approved').length || 0,
    rejected: allRequests?.filter(r => r.status === 'rejected').length || 0,
  }

  return (
    <div className="hq-tab-content">
      {/* Filter pills */}
      <div className="hq-filter-row" style={{ marginBottom: '1.5rem' }}>
        {(['pending', 'approved', 'rejected', 'all'] as const).map(f => (
          <button
            key={f}
            className={`hq-filter-pill ${filter === f ? 'active' : ''} ${f !== 'all' ? f : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'All Colleges' : f === 'pending' ? 'Requests' : f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})
          </button>
        ))}
      </div>

      {/* ── LISTINGS ────────────────────────── */}
      {filter !== 'all' && (
        <div>
{loadingReqs ? (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {[...Array(3)].map((_, i) => (
                <div key={i} className="spatial-card skeleton-shimmer" style={{ height: 100 }} />
              ))}
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="spatial-card" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
              <Building2 size={40} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
              <p>No {filter} college requests.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {filteredRequests.map((req) => (
                <motion.div
                  key={req.id}
                  className="spatial-card clickable"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setSelectedRequest(req)}
                  style={{ cursor: 'pointer', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: req.status === 'pending' ? 'rgba(245,158,11,0.15)' : req.status === 'approved' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                      color: req.status === 'pending' ? '#f59e0b' : req.status === 'approved' ? '#10b981' : '#ef4444',
                      overflow: 'hidden'
                    }}>
                      {req.logo_url ? (
                        <img src={req.logo_url} alt={req.college_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        req.status === 'pending' ? <Clock size={22} /> : req.status === 'approved' ? <CheckCircle size={22} /> : <XCircle size={22} />
                      )}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: '#64748b', fontSize: '0.95rem' }}>{req.college_name}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', gap: '0.75rem', marginTop: 2 }}>
                        <span><MapPin size={12} style={{ marginRight: 3 }} />{req.city}, {req.state}</span>
                        <span><Mail size={12} style={{ marginRight: 3 }} />{req.college_email}</span>
                        <span>{new Date(req.submitted_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={20} style={{ color: '#64748b' }} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── COLLEGES TAB ────────────────────────── */}
      {filter === 'all' && (
        <div>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'center' }}>
            <Dropdown
              value={stateFilter}
              onChange={val => { setStateFilter(val); setCityFilter('') }}
              style={{ width: '200px' }}
              buttonStyle={{ padding: '10px 32px 10px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, color: '#64748b' }}
              options={[
                { label: 'All States', value: '' },
                ...availableStates.map(s => ({ label: s as string, value: s as string }))
              ]}
            />
            <Dropdown
              value={cityFilter}
              onChange={val => setCityFilter(val)}
              style={{ width: '200px' }}
              buttonStyle={{ padding: '10px 32px 10px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, color: '#64748b' }}
              options={[
                { label: 'All Cities', value: '' },
                ...availableCities.map(c => ({ label: c as string, value: c as string }))
              ]}
            />
            <div style={{ position: 'relative', marginLeft: 'auto', width: '550px' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search colleges..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px 10px 36px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, color: '#64748b', fontSize: '0.85rem', outline: 'none' }}
              />
            </div>
          </div>

          {loadingColleges ? (
            <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
              {[...Array(4)].map((_, i) => (
                <div key={i} className="spatial-card skeleton-shimmer" style={{ height: 140 }} />
              ))}
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
              {(filteredColleges || []).map(col => (
                <motion.div
                  key={col.id}
                  className="spatial-card"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', height: '100%' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      {col.logo_url ? (
                        <img src={col.logo_url} alt={col.name} style={{ width: 44, height: 44, borderRadius: 12, objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,23,42,0.05)', color: '#64748b' }}>
                          <Building2 size={20} />
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: 700, color: '#64748b', fontSize: '1rem', marginBottom: 4 }}>{col.name}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                          <MapPin size={12} style={{ marginRight: 3 }} />{col.city}, {col.state}
                        </div>
                      </div>
                    </div>
                    {col.is_verified && (
                      <div style={{ padding: '3px 8px', borderRadius: 6, background: 'rgba(16,185,129,0.15)', color: '#10b981', fontSize: '0.7rem', fontWeight: 700 }}>Verified</div>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginTop: 'auto' }}>
                    <div style={{ textAlign: 'center', padding: '0.5rem', background: '#ffffff', borderRadius: 10, boxShadow: '2px 4px 8px rgba(0,0,0,0.06)' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1.1rem' }}>{col.user_count}</div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Students</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '0.5rem', background: '#ffffff', borderRadius: 10, boxShadow: '2px 4px 8px rgba(0,0,0,0.06)' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1.1rem' }}>{col.event_count}</div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Events</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '0.5rem', background: '#ffffff', borderRadius: 10, boxShadow: '2px 4px 8px rgba(0,0,0,0.06)' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1.1rem' }}>{col.competition_count}</div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Competitions</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── REQUEST DETAIL MODAL ────────────────── */}
      <AnimatePresence>
        {selectedRequest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
            onClick={() => setSelectedRequest(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 20, width: '100%', maxWidth: 600, maxHeight: '85vh', overflow: 'auto', padding: '2rem', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#64748b', margin: 0 }}>{selectedRequest.college_name}</h2>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 4 }}>
                    Submitted {new Date(selectedRequest.submitted_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                </div>
                <button onClick={() => setSelectedRequest(null)} style={{ background: '#f1f5f9', border: 'none', borderRadius: 10, padding: 8, cursor: 'pointer', color: '#64748b' }}>
                  <X size={18} />
                </button>
              </div>

              {/* Campus Details */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: '#4e93d8ff', marginBottom: '0.75rem', display: 'flex', alignItems: 'center' }}>
                  <Building2 size={14} style={{ marginRight: 6 }} />
                  Campus Details
                </h3>
                <div style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 16, padding: '1.25rem' }}>
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>College Logo</div>
                    {selectedRequest.logo_url ? (
                      <img src={selectedRequest.logo_url} alt="College Logo" style={{ height: 64, width: 64, objectFit: 'contain', borderRadius: 12, border: '1px solid #e2e8f0', background: '#fff', padding: 4 }} />
                    ) : (
                      <div style={{ color: '#94a3b8', fontSize: '0.9rem', fontStyle: 'italic' }}>Not Uploaded</div>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Email</div>
                      <div style={{ color: '#64748b', fontSize: '0.9rem' }}>{selectedRequest.college_email}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Phone</div>
                      <div style={{ color: '#64748b', fontSize: '0.9rem' }}>{selectedRequest.contact_phone}</div>
                    </div>
                    {selectedRequest.address && (
                      <div style={{ gridColumn: '1 / -1' }}>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Full Address</div>
                        <div style={{ color: '#64748b', fontSize: '0.9rem' }}>{selectedRequest.address}</div>
                      </div>
                    )}
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Location</div>
                      <div style={{ color: '#64748b', fontSize: '0.9rem' }}>{selectedRequest.city}, {selectedRequest.state}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Affiliation</div>
                      <div style={{ color: '#64748b', fontSize: '0.9rem' }}>{selectedRequest.affiliation || 'N/A'}</div>
                    </div>
                    {selectedRequest.website_url && (
                      <div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Website</div>
                        <a href={selectedRequest.website_url} target="_blank" rel="noreferrer" style={{ color: '#6366f1', fontSize: '0.9rem' }}>{selectedRequest.website_url}</a>
                      </div>
                    )}
                    {selectedRequest.student_count && (
                      <div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Students</div>
                        <div style={{ color: '#64748b', fontSize: '0.9rem' }}>~{selectedRequest.student_count.toLocaleString()}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Courses & Departments */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: '#4e93d8ff', marginBottom: '0.75rem', display: 'flex', alignItems: 'center' }}>
                  <GraduationCap size={14} style={{ marginRight: 6 }} />
                  Courses & Departments
                </h3>
                {(selectedRequest.courses || []).map((course, i) => (
                  <div key={i} style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 16, padding: '0.75rem 1rem', marginBottom: '0.5rem' }}>
                    <div style={{ fontWeight: 600, color: '#64748b', fontSize: '0.9rem', marginBottom: 6 }}>{course.name}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                      {course.departments.map(dept => (
                        <span key={dept} style={{ padding: '2px 10px', borderRadius: 8, background: '#eef2ff', color: '#4f46e5', fontSize: '0.75rem' }}>{dept}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Rejection reason (if rejected) */}
              {selectedRequest.status === 'rejected' && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ef4444', marginBottom: 4 }}>Rejection Reason</div>
                  <div style={{ color: '#991b1b', fontSize: '0.9rem' }}>{selectedRequest.rejection_reason || 'No reason provided.'}</div>
                </div>
              )}

              {/* Actions */}
              {selectedRequest.status === 'pending' && (
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    onClick={() => handleApprove(selectedRequest.id)}
                    disabled={approveMutation.isPending}
                    style={{ flex: 1, padding: '0.85rem', borderRadius: 16, border: 'none', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', opacity: approveMutation.isPending ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 8px 16px rgba(16,185,129,0.2)' }}
                  >
                    <CheckCircle size={18} />
                    {approveMutation.isPending ? 'Approving...' : 'Approve & Generate Credentials'}
                  </button>
                  <button
                    onClick={() => { setRejectModal(selectedRequest.id) }}
                    style={{ padding: '0.85rem 1.5rem', borderRadius: 16, border: '1px solid #fecaca', background: '#fff1f2', color: '#e11d48', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 8px 16px rgba(225,29,72,0.1)' }}
                  >
                    <XCircle size={18} />
                    Reject
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CREDENTIALS MODAL ──────────────────── */}
      <AnimatePresence>
        {credentials && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
            onClick={() => setCredentials(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 20, width: '100%', maxWidth: 560, maxHeight: '80vh', overflow: 'auto', padding: '2rem', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
            >
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                  <CheckCircle size={30} color="#10b981" />
                </div>
                <h2 style={{ color: '#64748b', fontWeight: 700, fontSize: '1.3rem', margin: 0 }}>College Approved!</h2>
                <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: 4 }}>
                  Generated {credentials.length} admin credential{credentials.length !== 1 ? 's' : ''}. Save these now — passwords are shown only once.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {credentials.map((cred, i) => (
                  <div key={i} style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 16, padding: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{
                        padding: '4px 10px', borderRadius: 8, fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
                        background: cred.admin_type === 'college_admin' ? '#eef2ff' : '#fce7f3',
                        color: cred.admin_type === 'college_admin' ? '#4f46e5' : '#db2777',
                      }}>
                        {cred.admin_type === 'college_admin' ? 'College Admin' : `Dept: ${cred.department}`}
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.5rem', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: 2 }}>Username</div>
                        <div style={{ color: '#64748b', fontFamily: 'monospace', fontSize: '0.9rem' }}>{cred.username}</div>
                      </div>
                      <button onClick={() => copyToClipboard(cred.username)} style={{ background: '#e2e8f0', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer', color: '#64748b' }} title="Copy username">
                        <Copy size={14} />
                      </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.5rem', alignItems: 'center', marginTop: '0.5rem' }}>
                      <div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: 2 }}>Password</div>
                        <div style={{ color: '#059669', fontFamily: 'monospace', fontSize: '0.9rem' }}>{cred.password}</div>
                      </div>
                      <button onClick={() => copyToClipboard(cred.password)} style={{ background: '#e2e8f0', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer', color: '#64748b' }} title="Copy password">
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  const text = credentials.map(c => `${c.admin_type}${c.department ? ` (${c.department})` : ''}\nUsername: ${c.username}\nPassword: ${c.password}`).join('\n\n')
                  copyToClipboard(text)
                  alert('All credentials copied to clipboard!')
                }}
                style={{ width: '100%', marginTop: '1rem', padding: '0.85rem', borderRadius: 16, border: 'none', background: '#eef2ff', color: '#4f46e5', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <Copy size={16} /> Copy All Credentials
              </button>

              <button
                onClick={() => setCredentials(null)}
                style={{ width: '100%', marginTop: '0.5rem', padding: '0.85rem', borderRadius: 16, border: 'none', background: '#f1f5f9', color: '#64748b', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer' }}
              >
                Done
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── REJECT MODAL ───────────────────────── */}
      <AnimatePresence>
        {rejectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
            onClick={() => setRejectModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 20, width: '100%', maxWidth: 440, padding: '2rem', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
            >
              <h3 style={{ color: '#64748b', fontWeight: 700, fontSize: '1.2rem', margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center' }}>
                <AlertTriangle size={20} style={{ marginRight: 8, color: '#ef4444' }} />
                Reject College Request
              </h3>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Reason for rejection (optional)..."
                style={{ width: '100%', boxSizing: 'border-box', height: 120, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, padding: '1rem', color: '#64748b', fontSize: '0.9rem', resize: 'none', outline: 'none', marginBottom: '1.5rem' }}
              />
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={() => setRejectModal(null)}
                  style={{ flex: 1, padding: '0.85rem', borderRadius: 16, border: 'none', background: '#f1f5f9', color: '#64748b', fontWeight: 600, cursor: 'pointer', fontSize: '0.95rem' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={rejectMutation.isPending}
                  style={{ flex: 1, padding: '0.85rem', borderRadius: 16, border: 'none', background: '#ef4444', color: '#fff', fontWeight: 700, cursor: 'pointer', opacity: rejectMutation.isPending ? 0.6 : 1, fontSize: '0.95rem', boxShadow: '0 8px 16px rgba(239,68,68,0.2)' }}
                >
                  {rejectMutation.isPending ? 'Rejecting...' : 'Confirm Reject'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
