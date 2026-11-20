/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, User as UserIcon, Users, Trophy, Ticket,
  Search, CheckCircle2, AlertTriangle, Clock,
  MapPin, Wifi, Plus, X, Trash2, Copy, ChevronRight, ChevronDown, Loader2, Tag, User, Hash, CreditCard, AlertCircle, Inbox, Calendar,
  Eye, FileText, MessageSquare, ShieldCheck, GraduationCap
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useCompetitionRegistrationLogic, calculateBreakdown, getOrdinal } from '@/hooks/useCompetitionRegistrationLogic';
import { competitionRegistrationService } from '@/services/competitionRegistrationService';
import { CustomFormFillModal } from '@/components/forms/CustomFormFillModal';
import { CustomFormPurposeModal } from '@/components/forms/CustomFormPurposeModal';
import './CompetitionRegistration.css';

declare global {
  interface Window { Razorpay: any }
}

function MobileView() {
  const logic = useCompetitionRegistrationLogic();
  const {
    id, competitionId, navigate, queryClient, user,
    comp, loading, existingReg, checkingReg,
    processing, setProcessing, error, setError,
    flowMode, setFlowMode, isIndividualOnly,
    teamName, setTeamName, lookingForTeammates, setLookingForTeammates,
    addedMembers, setAddedMembers, memberSearchQuery, setMemberSearchQuery,
    searchResults, setSearchResults, searchingMembers, searchModalVisible, setSearchModalVisible,
    inviteCode, setInviteCode, teamPreview, setTeamPreview, lookingUp, setLookingUp, joinTab, setJoinTab,
    toastMessage, showToast, draftTeamInviteCode, draftTeam,
    isActualLeader, isTeamLeaderView, isMemberView, isFullyRegistered, isPendingInvite, draftMembers, allVerified,
    regCount, openTeams, loadingOpenTeams, myJoinRequests, myTeams, loadingMyTeams,
    registerIndividual, createTeamAndRegister, joinTeamByCode, sendJoinRequest, addMember, importTeamBuilder, removeMember, updateTeamDetails, finalizeTeamRegistration,
    isExistingDraft, setIsExistingDraft, hasUnsavedChanges, searchMembers, lookupTeam,
    customFormConfig, formResponse, isFormSubmitted,
    isFormFillModalOpen, setIsFormFillModalOpen,
    isFormPurposeModalOpen, setIsFormPurposeModalOpen,
    handleIndividualRegister, handleCreateTeam, handleUpdateTeam, handleFinalizeRegistration, handleCopyCode,
    handleSendJoinRequest, handleJoinByCode, handleRejectInvite, handleAcceptInvite, handleImportTeam,
    handleFormSubmit
  } = logic;

  if (!comp && !loading && !checkingReg) {
    return (
      <div className="crm-container">
        <div className="crm-bg" />
        <div className="crm-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <Trophy size={48} color="rgba(255,255,255,0.15)" />
          <div style={{ fontSize: 18, fontWeight: 700, color: '#e4e4e7', marginTop: 16 }}>Competition Not Found</div>
          <button className="crm-back-btn" style={{ marginTop: 20 }} onClick={() => navigate(-1)}>Go Back</button>
        </div>
      </div>
    );
  }

  if (existingReg && existingReg.registration_type === 'individual') {
    return (
      <div className="crm-container" style={{ backgroundColor: '#121212' }}>
        <div className="crm-bg" />
        <div className="crm-content" style={{ display: 'flex', flexDirection: 'column', padding: '24px 20px 80px', minHeight: '100vh', boxSizing: 'border-box' }}>
          
          {/* Header */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 20, marginTop: 10 }}>
            <div style={{ width: 68, height: 68, borderRadius: 34, backgroundColor: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <CheckCircle2 size={34} color="#34d399" />
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.25)', padding: '4px 12px', borderRadius: 20, marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#34d399', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                Registration Confirmed
              </span>
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: 0, lineHeight: 1.3 }}>{comp?.title}</h2>
            <p style={{ fontSize: 13, color: '#a1a1aa', margin: '6px 0 0 0' }}>You are officially registered as a solo participant.</p>
          </div>

          {/* Participant Profile Card */}
          <div className="crm-glass-card" style={{ padding: '16px', marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>Participant Profile</div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, fontSize: 18, fontWeight: 800, color: '#a78bfa' }}>
                {(user as any)?.profile_avatar || (user as any)?.avatar_url ? (
                  <img src={(user as any)?.profile_avatar || (user as any)?.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span>{(user?.name || user?.email || 'U')[0].toUpperCase()}</span>
                )}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name || 'Candidate'}</span>
                  <span style={{ backgroundColor: 'rgba(99,102,241,0.2)', color: '#a78bfa', fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 6, flexShrink: 0 }}>SOLO</span>
                </div>
                <div style={{ fontSize: 12, color: '#a1a1aa', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
                {((user as any)?.college || (user as any)?.college_name) && (
                  <div style={{ fontSize: 11, color: '#818cf8', marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <GraduationCap size={12} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{(user as any)?.college || (user as any)?.college_name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Registration Details Card */}
          <div className="crm-glass-card" style={{ padding: '16px', marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>Registration Details</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                <span style={{ color: '#71717a' }}>Format</span>
                <span style={{ color: '#e4e4e7', fontWeight: 600 }}>Individual Candidate</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                <span style={{ color: '#71717a' }}>Status</span>
                <span style={{ color: '#34d399', fontWeight: 700, textTransform: 'uppercase' }}>{existingReg.status || 'Confirmed'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                <span style={{ color: '#71717a' }}>Registration ID</span>
                <span style={{ color: '#e4e4e7', fontFamily: 'monospace', fontSize: 12 }}>#{existingReg.id.slice(0, 8).toUpperCase()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                <span style={{ color: '#71717a' }}>Entry Fee</span>
                <span style={{ color: '#e4e4e7', fontWeight: 600 }}>{(existingReg.entry_fee_paid || 0) === 0 ? 'Free Entry' : `₹${existingReg.entry_fee_paid} Paid`}</span>
              </div>
            </div>
          </div>

          {/* Form responses review (if form exists) */}
          {customFormConfig && (
            <div style={{ padding: '14px 16px', background: '#18181b', borderRadius: 16, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(52,211,153,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={16} color="#34d399" />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#34d399' }}>Application Form</div>
                  <div style={{ fontSize: 11, color: '#a1a1aa' }}>Submitted screening answers</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFormFillModalOpen(true)}
                style={{
                  background: 'rgba(52,211,153,0.15)',
                  border: 'none',
                  borderRadius: 10,
                  padding: '6px 14px',
                  color: '#34d399',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Edit Answers
              </button>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 'auto' }}>
            <button
              onClick={() => navigate(`/competition/${competitionId}`)}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: 24,
                border: 'none',
                background: 'linear-gradient(90deg, #8b5cf6, #6366f1)',
                color: '#fff',
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8
              }}
            >
              View Competition Details <ChevronRight size={16} />
            </button>
            <button
              onClick={() => navigate('/explore')}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 24,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.04)',
                color: '#d4d4d8',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Explore More Competitions
            </button>
          </div>

        </div>

        {customFormConfig && (
          <CustomFormFillModal
            isOpen={isFormFillModalOpen}
            onClose={() => setIsFormFillModalOpen(false)}
            formConfig={customFormConfig}
            initialValues={formResponse?.answers}
            onSubmit={handleFormSubmit}
            readOnly={false}
            isSubmitting={processing}
          />
        )}
      </div>
    );
  }

  const c: any = comp || {};
  const deadlinePassed = c.registration_deadline && new Date() > new Date(c.registration_deadline);
  const isFull = c.max_participants > 0 && (regCount || 0) >= c.max_participants;

  if (!loading && !checkingReg && !isFullyRegistered && (deadlinePassed || isFull)) {
    return (
      <div className="crm-container">
        <div className="crm-bg" />
        <div className="crm-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 30px' }}>
          <div style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <AlertTriangle size={36} color="#ef4444" />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 8 }}>{deadlinePassed ? 'Registration Closed' : 'Registrations Full'}</h2>
          <p style={{ fontSize: 14, color: '#a1a1aa', textAlign: 'center', marginBottom: 24 }}>{deadlinePassed ? 'The registration deadline has passed.' : 'This competition has reached maximum registrations.'}</p>
          <button className="crm-back-btn" onClick={() => navigate(-1)}>← Go Back</button>
        </div>
      </div>
    );
  }

  const fee = Number(c.entry_fee) || 0;
  const maxSize = c.team_size_max || 5;
  const minSize = c.team_size_min || 1;
  const showTeamOption = c && (c.registration_type === 'team' || c.registration_type === 'both');
  const showIndividualOption = c && (c.registration_type === 'individual' || c.registration_type === 'both');
  const renderedAddedMembers = isMemberView
    ? (draftTeam?.members || []).filter((m: any) => m.user_id !== user?.id && m.user_id !== draftTeam?.leader_id && m.team_role !== 'leader').map((m: any) => ({ ...(m.users || m.user), id: m.user_id || m.id, registration_id: m.id, verified: m.verified }))
    : addedMembers;


  return (
    <>
      <Helmet><title>Register — {c.title || 'PLUTO'}</title></Helmet>
      <div className="crm-container" style={{ backgroundColor: '#121212' }}>
        <div className="crm-bg" />

        <div className="crm-content">
          <div className="crm-header-row">
            <div className="crm-header-image">
              {loading || checkingReg ? <div className="crm-pulse" style={{ width: '100%', height: '100%' }} /> : c.banner_url ? <img src={c.banner_url} alt="Banner" /> : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(rgba(139,92,246,0.15), rgba(99,102,241,0.08))', height: '100%' }}>
                  <Trophy color="rgba(255,255,255,0.2)" size={28} />
                </div>
              )}
            </div>
            <div className="crm-header-info">
              {loading || checkingReg ? (
                <>
                  <div className="crm-pulse" style={{ width: '80%', height: 20, borderRadius: 6, marginBottom: 8 }} />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div className="crm-pulse" style={{ width: 60, height: 16, borderRadius: 8 }} />
                    <div className="crm-pulse" style={{ width: 80, height: 16, borderRadius: 8 }} />
                  </div>
                </>
              ) : (
                <>
                  <h2 className="crm-header-title">{c.title}</h2>
                  <div className="crm-badges">
                    {c.category && <div className="crm-badge"><Tag size={10} color="#fff" /><span className="crm-badge-text">{c.category}</span></div>}
                    {c.is_online ? <div className="crm-badge"><Wifi size={10} color="#fff" /><span className="crm-badge-text">Online</span></div> : c.venue && <div className="crm-badge"><MapPin size={10} color="#fff" /><span className="crm-badge-text">{c.venue}</span></div>}
                    <div className="crm-badge"><Ticket size={10} color="#fff" /><span className="crm-badge-text">{fee === 0 ? 'Free' : `₹${fee}/member`}</span></div>
                  </div>
                </>
              )}
            </div>
          </div>

          {(!flowMode && !isIndividualOnly) && (
            <div className="crm-section" style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 10 }}>
              {showIndividualOption && (
                <button className="crm-glass-card" onClick={() => { setFlowMode('individual'); setError(''); }} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '20px 16px', border: '1px solid rgba(99,102,241,0.3)', cursor: 'pointer', textAlign: 'left', margin: 0 }}>
                  <div style={{ backgroundColor: 'rgba(99,102,241,0.1)', padding: 12, borderRadius: 16 }}><UserIcon size={24} color="#8b5cf6" /></div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Individual</div>
                    <div style={{ fontSize: 13, color: '#a1a1aa', marginTop: 4 }}>Register as a solo participant</div>
                  </div>
                </button>
              )}
              {showTeamOption && (
                <>
                  <button className="crm-glass-card" onClick={() => { setFlowMode('create'); setError(''); }} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '20px 16px', border: '1px solid rgba(52,211,153,0.3)', cursor: 'pointer', textAlign: 'left', margin: 0 }}>
                    <div style={{ backgroundColor: 'rgba(52,211,153,0.1)', padding: 12, borderRadius: 16 }}><Users size={24} color="#34d399" /></div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Create a Team</div>
                      <div style={{ fontSize: 13, color: '#a1a1aa', marginTop: 4 }}>Start a new team and invite members</div>
                    </div>
                  </button>
                  <button className="crm-glass-card" onClick={() => { setFlowMode('join'); setError(''); }} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '20px 16px', border: '1px solid rgba(251,191,36,0.3)', cursor: 'pointer', textAlign: 'left', margin: 0 }}>
                    <div style={{ backgroundColor: 'rgba(251,191,36,0.1)', padding: 12, borderRadius: 16 }}><Hash size={24} color="#fbbf24" /></div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Join a Team</div>
                      <div style={{ fontSize: 13, color: '#a1a1aa', marginTop: 4 }}>Join using an invite code</div>
                    </div>
                  </button>
                  <button className="crm-glass-card" onClick={() => { setFlowMode('existing'); setError(''); }} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '20px 16px', border: '1px solid rgba(56,189,248,0.3)', cursor: 'pointer', textAlign: 'left', margin: 0 }}>
                    <div style={{ backgroundColor: 'rgba(56,189,248,0.1)', padding: 12, borderRadius: 16 }}><Inbox size={24} color="#38bdf8" /></div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Add Existing Team</div>
                      <div style={{ fontSize: 13, color: '#a1a1aa', marginTop: 4 }}>Use a team you already built</div>
                    </div>
                  </button>
                </>
              )}
            </div>
          )}

          {!isIndividualOnly && !isTeamLeaderView && !isMemberView && (flowMode === 'create' || flowMode === 'join' || flowMode === 'existing') && (
            <div className="crm-tabs">
              {['create', 'join', 'existing'].map((tab) => (
                <button key={tab} className={`crm-tab ${flowMode === tab ? 'active' : ''}`} onClick={() => { setFlowMode(tab as any); setError(''); }}>
                  {tab === 'create' ? 'Create a team' : tab === 'join' ? 'Join a team' : 'Existing team'}
                </button>
              ))}
            </div>
          )}

          {error && (
            <div className="crm-error-banner">
              <AlertTriangle size={14} />
              <span>{error}</span>
            </div>
          )}

          {/* CREATE TEAM TAB */}
          {flowMode === 'create' && (
            <div className="crm-section">
              <div className="crm-glass-card" style={{ padding: '20px' }}>
                {(isMemberView || isTeamLeaderView) && (
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: '#d4d4d8', textAlign: 'center', marginBottom: 20 }}>Your Team</h3>
                )}

                {/* Custom Application Form Banner */}
                {customFormConfig && customFormConfig.fields && customFormConfig.fields.length > 0 && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                    padding: '12px 14px',
                    background: isFormSubmitted ? 'rgba(52, 211, 153, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                    border: `1px solid ${isFormSubmitted ? 'rgba(52, 211, 153, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`,
                    borderRadius: 12,
                    marginBottom: 16
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                      <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: isFormSubmitted ? 'rgba(52, 211, 153, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <FileText size={16} color={isFormSubmitted ? '#34d399' : '#fbbf24'} />
                      </div>
                      <div style={{ minWidth: 0, overflow: 'hidden' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: isFormSubmitted ? '#34d399' : '#fbbf24', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span>{isFormSubmitted ? 'Form Submitted' : 'Application Form Required'}</span>
                          {isFormSubmitted && <CheckCircle2 size={13} color="#34d399" />}
                        </div>
                        <div style={{ fontSize: 11, color: '#a1a1aa', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {isFormSubmitted ? (customFormConfig.title || 'Screening Questions') : 'Fill required questions'}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      <button
                        type="button"
                        onClick={() => setIsFormPurposeModalOpen(true)}
                        title="View Form Purpose"
                        style={{
                          background: 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: 8,
                          padding: '6px 10px',
                          color: '#e4e4e7',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 12,
                          cursor: 'pointer'
                        }}
                      >
                        <Eye size={13} />
                        <span>Purpose</span>
                      </button>
                      {!isFullyRegistered && !isMemberView && (
                        <button
                          type="button"
                          onClick={() => setIsFormFillModalOpen(true)}
                          style={{
                            background: isFormSubmitted ? 'rgba(99,102,241,0.15)' : '#f59e0b',
                            border: isFormSubmitted ? '1px solid rgba(99,102,241,0.3)' : 'none',
                            borderRadius: 8,
                            padding: '6px 12px',
                            color: isFormSubmitted ? '#a78bfa' : '#000',
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          {isFormSubmitted ? 'Edit Answers' : 'Fill Form'}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <span className="crm-input-label">Team Name</span>
                <input
                  className="crm-input"
                  style={(isMemberView || isFullyRegistered) ? { opacity: 0.7 } : {}}
                  placeholder="e.g., Code Crusaders"
                  value={teamName}
                  onChange={e => setTeamName(e.target.value)}
                  maxLength={50}
                  disabled={isMemberView || isFullyRegistered}
                />

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#e4e4e7' }}>Teammates</span>
                    <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: '#e4e4e7' }}>
                        {isMemberView ? 2 + renderedAddedMembers.length : 1 + renderedAddedMembers.length}/{maxSize}
                      </span>
                    </div>
                  </div>
                  {draftTeamInviteCode && (
                    <button onClick={handleCopyCode} style={{ display: 'flex', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: 8, border: 'none', cursor: 'pointer' }}>
                      <span style={{ color: '#a1a1aa', fontSize: 12, fontWeight: 600 }}>Code: {draftTeamInviteCode.toUpperCase()}</span>
                      <Copy size={12} color="#a1a1aa" />
                    </button>
                  )}
                </div>

                {!isFullyRegistered && (isMemberView ? 2 + renderedAddedMembers.length : 1 + renderedAddedMembers.length) < minSize && (
                  <div style={{ fontSize: 12, color: '#f59e0b', marginBottom: 10 }}>
                    Add {minSize - (isMemberView ? 2 + renderedAddedMembers.length : 1 + renderedAddedMembers.length)} more member(s) to meet minimum team size
                  </div>
                )}

                {/* Leader Card */}
                {(() => {
                  const isCurrentUserLeader = draftTeam ? draftTeam.leader_id === user?.id : !isMemberView;
                  let leaderUser = isCurrentUserLeader ? user : ((draftTeam as any)?.leader || (existingReg as any)?.team?.leader || (existingReg as any)?.competition_teams?.leader);
                  if (!isCurrentUserLeader && !leaderUser) leaderUser = { name: 'Team Leader', email: 'Loading leader details...' } as any;
                  if (!leaderUser) return null;
                  return (
                    <div className="crm-member-card">
                      <div className="crm-avatar">
                        {(leaderUser as any)?.avatar_url || (leaderUser as any)?.profile_avatar || (leaderUser as any)?.avatar ? (
                          <img src={(leaderUser as any)?.avatar_url || (leaderUser as any)?.profile_avatar || (leaderUser as any)?.avatar} alt="" />
                        ) : (
                          <span>{(leaderUser?.name || 'U')[0].toUpperCase()}</span>
                        )}
                      </div>
                      <div className="crm-member-info">
                        <div className="crm-member-name">
                          {leaderUser?.name || (isTeamLeaderView ? 'You' : 'Leader')} {isTeamLeaderView && '(You)'}
                          <span style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: 6, fontSize: 9, fontWeight: 800, color: '#d4d4d8' }}>LEADER</span>
                        </div>
                        <div className="crm-member-email">{leaderUser?.email}</div>
                      </div>
                      <CheckCircle2 size={20} color="#34d399" />
                    </div>
                  )
                })()}

                {/* Current User Card */}
                {isMemberView && (
                  <div className="crm-member-card">
                    <div className="crm-avatar">
                      {(user as any)?.avatar_url || (user as any)?.profile_avatar || (user as any)?.avatar ? (
                        <img src={(user as any)?.avatar_url || (user as any)?.profile_avatar || (user as any)?.avatar} alt="" />
                      ) : <span>{(user?.name || 'U')[0].toUpperCase()}</span>}
                    </div>
                    <div className="crm-member-info">
                      <div className="crm-member-name">{user?.name || 'You'} (You)</div>
                      <div className="crm-member-email">{user?.email}</div>
                    </div>
                    {!isPendingInvite ? <CheckCircle2 size={20} color="#34d399" /> : <Clock size={20} color="#a1a1aa" />}
                  </div>
                )}

                {/* Added Members */}
                {renderedAddedMembers.map((member) => (
                  <div key={member.id} className="crm-member-card">
                    <div className="crm-avatar" style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#a1a1aa' }}>
                      {(member as any)?.avatar_url || (member as any)?.profile_avatar || (member as any)?.avatar ? (
                        <img src={(member as any)?.avatar_url || (member as any)?.profile_avatar || (member as any)?.avatar} alt="" />
                      ) : <span>{(member.name || 'M')[0].toUpperCase()}</span>}
                    </div>
                    <div className="crm-member-info">
                      <div className="crm-member-name">{member.name}</div>
                      <div className="crm-member-email">{member.email}</div>
                    </div>
                    <div className="crm-member-actions">
                      {member.verified !== false ? <CheckCircle2 size={20} color="#34d399" /> : <Clock size={20} color="#a1a1aa" />}
                      {!isMemberView && !isFullyRegistered && (
                        <button className="crm-icon-btn" onClick={() => {
                          if (member.registration_id && draftTeam) removeMember.mutate({ registrationId: member.registration_id, teamId: draftTeam.id });
                          setAddedMembers(prev => prev.filter(m => m.id !== member.id));
                        }}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {!isMemberView && !isFullyRegistered && (1 + renderedAddedMembers.length) < maxSize && (
                  <div style={{ marginTop: 10 }}>
                    {!searchModalVisible ? (
                      <button className="crm-add-btn" onClick={() => setSearchModalVisible(true)}>
                        <Plus size={16} /> Add {getOrdinal(renderedAddedMembers.length + 2)} Member
                      </button>
                    ) : (
                      <div style={{ marginTop: 8 }}>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                          <input
                            className="crm-input"
                            style={{ marginBottom: 0, flex: 1 }}
                            placeholder="Search by name or email..."
                            value={memberSearchQuery}
                            onChange={e => setMemberSearchQuery(e.target.value)}
                            autoFocus
                          />
                          <button className="crm-icon-btn" style={{ padding: 12 }} onClick={() => { setSearchModalVisible(false); setMemberSearchQuery(''); setSearchResults([]); }}>
                            <X size={20} />
                          </button>
                        </div>

                        {searchResults.length > 0 && (
                          <div className="crm-search-dropdown" style={{ marginTop: 4 }}>
                            {searchResults.map(u => {
                              const isRegistered = Boolean(u.isAlreadyRegistered);
                              return (
                                <div key={u.id} className="crm-search-item"
                                  style={{ cursor: isRegistered ? 'not-allowed' : 'pointer', opacity: isRegistered ? 0.6 : 1 }}
                                  onClick={() => {
                                    if (isRegistered) {
                                      showToast(`${u.name} is already registered in another team`);
                                      return;
                                    }
                                    setAddedMembers(prev => [...prev, { ...u, verified: false }]);
                                    setMemberSearchQuery(''); setSearchResults([]); setSearchModalVisible(false);
                                  }}>
                                  <div className="crm-avatar" style={{ width: 32, height: 32, fontSize: 13 }}>
                                    {(u as any)?.profile_avatar || (u as any)?.avatar_url || (u as any)?.avatar ? <img src={(u as any)?.profile_avatar || (u as any)?.avatar_url || (u as any)?.avatar} alt="" /> : <span>{(u.name || 'U')[0].toUpperCase()}</span>}
                                  </div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: '#e4e4e7', display: 'flex', alignItems: 'center', gap: 6 }}>
                                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</span>
                                      {isRegistered && (
                                        <span style={{ fontSize: 9, fontWeight: 700, color: '#f87171', background: 'rgba(239,68,68,0.15)', padding: '1px 5px', borderRadius: 4, flexShrink: 0 }}>
                                          In another team
                                        </span>
                                      )}
                                    </div>
                                    <div style={{ fontSize: 11, color: '#71717a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
                                  </div>
                                  {!isRegistered && <Plus size={16} color="#a78bfa" />}
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {!searchingMembers && memberSearchQuery.trim().length >= 1 && searchResults.length === 0 && (
                          <div style={{ padding: '12px 16px', fontSize: 12, color: '#71717a', textAlign: 'center' }}>
                            No users found matching "{memberSearchQuery.trim()}"
                          </div>
                        )}
                        {searchingMembers && <Loader2 size={16} color="#a78bfa" className="spin" style={{ margin: '12px auto', display: 'block' }} />}
                      </div>
                    )}
                  </div>
                )}

                {(isTeamLeaderView || isMemberView) && (
                  <div style={{ display: 'flex', gap: 16, marginTop: 12, padding: '0 4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><CheckCircle2 size={14} color="#34d399" /><span style={{ fontSize: 11, color: '#a1a1aa' }}>Verified</span></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Clock size={14} color="#a1a1aa" /><span style={{ fontSize: 11, color: '#a1a1aa' }}>Pending confirmation</span></div>
                  </div>
                )}

                {!isMemberView && !isFullyRegistered && (
                  <div className="crm-switch-card">
                    <div style={{ flex: 1, marginRight: 12 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#e4e4e7' }}>Looking for Teammates</div>
                      <div style={{ fontSize: 11, color: '#71717a', marginTop: 2 }}>Allow others to find & request to join your team</div>
                    </div>
                    <div className={`crm-switch ${lookingForTeammates ? 'on' : ''}`} onClick={() => setLookingForTeammates(!lookingForTeammates)}>
                      <div className="crm-switch-thumb" />
                    </div>
                  </div>
                )}

                {(() => {
                  const totalTeamMembers = isMemberView ? (2 + renderedAddedMembers.length) : (1 + renderedAddedMembers.length);
                  return (
                    <div className="crm-price-card">
                      <div className="crm-price-row"><span className="crm-price-label">Entry Fee × {totalTeamMembers} members</span><span className="crm-price-value">{fee === 0 ? 'Free' : `₹${fee * totalTeamMembers}`}</span></div>
                      {fee > 0 && <div className="crm-price-row"><span className="crm-price-label">Platform Fee (2.5%)</span><span className="crm-price-value">₹{calculateBreakdown(fee, totalTeamMembers).platformFee}</span></div>}
                      <div className="crm-price-row" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10, marginTop: 4 }}>
                        <span className="crm-price-label" style={{ color: '#e4e4e7', fontWeight: 700 }}>Total</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {isFullyRegistered && fee > 0 && <span style={{ backgroundColor: 'rgba(16,185,129,0.15)', padding: '2px 6px', borderRadius: 6, color: '#10b981', fontSize: 10, fontWeight: 800 }}>PAID</span>}
                          <span style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{fee === 0 ? 'Free' : `₹${calculateBreakdown(fee, totalTeamMembers).total}`}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
                {(isMemberView || isTeamLeaderView) && <div style={{ fontSize: 12, color: '#a1a1aa', textAlign: 'center', marginTop: 12 }}>Note: All registration fees are paid collectively by the team leader.</div>}
              </div>
            </div>
          )}

          {/* JOIN TEAM TAB */}
          {flowMode === 'join' && (
            <div className="crm-section">
              <div className="crm-sub-tabs">
                <button className={`crm-sub-tab ${joinTab === 'browse' ? 'active' : ''}`} onClick={() => setJoinTab('browse')}>Browse Teams</button>
                <button className={`crm-sub-tab ${joinTab === 'code' ? 'active' : ''}`} onClick={() => setJoinTab('code')}>Invite Code</button>
              </div>

              {joinTab === 'browse' && (
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#a1a1aa', marginBottom: 14 }}>Teams looking for members</div>
                  {loadingOpenTeams ? <Loader2 size={24} color="#a78bfa" className="spin" style={{ margin: '20px auto' }} /> : (openTeams || []).length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px 0' }}><Users size={32} color="rgba(255,255,255,0.1)" /><div style={{ fontSize: 14, color: '#52525b', marginTop: 10 }}>No open teams found</div></div>
                  ) : (openTeams || []).map(team => {
                    const hasRequested = myJoinRequests?.some((req: any) => req.team_id === team.id);
                    return (
                      <div key={team.id} className="crm-team-list-card">
                        <div className="crm-avatar">{team.leader?.profile_avatar ? <img src={team.leader.profile_avatar} alt="" /> : <span>{(team.name || 'T')[0].toUpperCase()}</span>}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#e4e4e7' }}>{team.name}</div>
                          <div style={{ fontSize: 11, color: '#71717a' }}>{team.leader?.name || 'Unknown'} · {team.team_size}/{maxSize} members</div>
                        </div>
                        {hasRequested ? (
                          <div className="crm-request-btn" style={{ backgroundColor: 'rgba(52,211,153,0.1)', borderColor: 'rgba(52,211,153,0.3)', color: '#34d399' }}><Clock size={12} /> Requested</div>
                        ) : (
                          <button className="crm-request-btn" onClick={() => handleSendJoinRequest(team.id)} disabled={processing}><Plus size={12} /> Request</button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {joinTab === 'code' && (
                <div>
                  <span className="crm-input-label">Invite Code</span>
                  <div className="crm-lookup-input">
                    <input placeholder="Enter invite code" value={inviteCode} onChange={e => { setInviteCode(e.target.value.toUpperCase()); setTeamPreview(null); setError(''); }} maxLength={10} />
                    <button className="crm-lookup-btn" onClick={lookupTeam} disabled={lookingUp || inviteCode.length < 4}>
                      {lookingUp ? <Loader2 size={16} className="spin" /> : <Search size={16} />}
                    </button>
                  </div>

                  {teamPreview && (
                    <div className="crm-team-preview">
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                        <div className="crm-avatar">{teamPreview.leader?.profile_avatar ? <img src={teamPreview.leader.profile_avatar} alt="" /> : <Users size={16} color="#a78bfa" />}</div>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: '#e4e4e7' }}>{teamPreview.name}</div>
                          <div style={{ fontSize: 11, color: '#71717a' }}>{teamPreview.team_size}/{maxSize} members · Leader: {teamPreview.leader?.name || '—'}</div>
                        </div>
                      </div>
                      {teamPreview.members && teamPreview.members.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {teamPreview.members.map((m: any) => (
                            <div key={m.id} style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: 8, fontSize: 11, color: '#d4d4d8' }}>{m.user?.name || m.user?.email || '—'}</div>
                          ))}
                        </div>
                      )}
                      {myJoinRequests?.some((req: any) => req.team_id === teamPreview.id) ? (
                        <div className="crm-cta-btn requested" style={{ marginTop: 14 }}><Clock size={16} /> Already Requested</div>
                      ) : (
                        <button className="crm-cta-btn primary" style={{ marginTop: 14 }} onClick={() => handleSendJoinRequest(teamPreview.id)} disabled={processing}>
                          {processing ? <Loader2 size={16} className="spin" /> : 'Request to join'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ADD EXISTING TEAM TAB */}
          {flowMode === 'existing' && (
            <div className="crm-section">
              <div style={{ fontSize: 14, fontWeight: 600, color: '#a1a1aa', marginBottom: 14 }}>Select a team from Team Builder</div>
              {loadingMyTeams ? <Loader2 size={24} color="#a78bfa" className="spin" style={{ margin: '20px auto' }} /> : (myTeams || []).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 0' }}><Users size={32} color="rgba(255,255,255,0.1)" /><div style={{ fontSize: 14, color: '#52525b', marginTop: 10 }}>No teams found. Create a team in Team Builder first.</div></div>
              ) : (myTeams || []).map(team => {
                const approvedCount = (team.team_members || []).filter((m: any) => m.status === 'approved').length;
                const totalSize = 1 + approvedCount;
                const fitsMax = totalSize <= maxSize;
                return (
                  <div key={team.id} className="crm-team-list-card" style={!fitsMax ? { opacity: 0.5 } : {}}>
                    <div className="crm-avatar" style={{ backgroundColor: 'rgba(251,191,36,0.12)', color: '#fbbf24' }}>{team.creator_avatar ? <img src={team.creator_avatar} alt="" /> : <span>{(team.team_name || 'T')[0].toUpperCase()}</span>}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#e4e4e7' }}>{team.team_name}</div>
                      <div style={{ fontSize: 11, color: '#71717a' }}>{team.competition_name} · {totalSize} members</div>
                      {!fitsMax && <div style={{ fontSize: 10, color: '#ef4444', marginTop: 2 }}>Too many members (max {maxSize})</div>}
                    </div>
                    <button className="crm-request-btn" onClick={() => handleImportTeam(team.id)} disabled={processing || !fitsMax} style={!fitsMax ? { opacity: 0.3 } : {}}>
                      Import <ChevronRight size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* INDIVIDUAL TAB */}
          {flowMode === 'individual' && (
            <div className="crm-section">
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#d4d4d8', marginBottom: 14 }}>Candidate Registration</h3>

              {/* Custom Application Form Banner */}
              {customFormConfig && customFormConfig.fields && customFormConfig.fields.length > 0 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                  padding: '12px 14px',
                  background: isFormSubmitted ? 'rgba(52, 211, 153, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                  border: `1px solid ${isFormSubmitted ? 'rgba(52, 211, 153, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`,
                  borderRadius: 12,
                  marginBottom: 16
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: isFormSubmitted ? 'rgba(52, 211, 153, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <FileText size={16} color={isFormSubmitted ? '#34d399' : '#fbbf24'} />
                    </div>
                    <div style={{ minWidth: 0, overflow: 'hidden' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: isFormSubmitted ? '#34d399' : '#fbbf24', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span>{isFormSubmitted ? 'Form Submitted' : 'Application Form Required'}</span>
                        {isFormSubmitted && <CheckCircle2 size={13} color="#34d399" />}
                      </div>
                      <div style={{ fontSize: 11, color: '#a1a1aa', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {isFormSubmitted ? (customFormConfig.title || 'Screening Questions') : 'Fill required screening questions'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={() => setIsFormPurposeModalOpen(true)}
                      title="View Form Purpose"
                      style={{
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 8,
                        padding: '6px 10px',
                        color: '#e4e4e7',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 12,
                        cursor: 'pointer'
                      }}
                    >
                      <Eye size={13} />
                      <span>Purpose</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsFormFillModalOpen(true)}
                      style={{
                        background: isFormSubmitted ? 'rgba(99,102,241,0.15)' : '#f59e0b',
                        border: isFormSubmitted ? '1px solid rgba(99,102,241,0.3)' : 'none',
                        borderRadius: 8,
                        padding: '6px 12px',
                        color: isFormSubmitted ? '#a78bfa' : '#000',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {isFormSubmitted ? 'Edit Answers' : 'Fill Form'}
                    </button>
                  </div>
                </div>
              )}

              {/* Candidate Details Card */}
              <div className="crm-glass-card" style={{ padding: '16px', marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Candidate Details</span>
                  <span style={{ backgroundColor: 'rgba(99,102,241,0.15)', color: '#a78bfa', fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 8 }}>SOLO ENTRY</span>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div className="crm-avatar" style={{ width: 44, height: 44, borderRadius: 22, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(139,92,246,0.15)' }}>
                    {((user as any)?.profile_avatar || (user as any)?.avatar_url || (user as any)?.avatar) ? (
                      <img src={(user as any)?.profile_avatar || (user as any)?.avatar_url || (user as any)?.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: 18, fontWeight: 800, color: '#a78bfa' }}>
                        {(user?.name || user?.email || 'U')[0].toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#e4e4e7', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user?.name || 'Student Candidate'}
                    </div>
                    <div style={{ fontSize: 12, color: '#71717a', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user?.email}
                    </div>
                    {((user as any)?.college || (user as any)?.college_name) && (
                      <div style={{ fontSize: 11, color: '#818cf8', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <GraduationCap size={12} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{(user as any)?.college || (user as any)?.college_name}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Constraint box (Unstop style) */}
                <div style={{
                  marginTop: 14,
                  padding: '10px 12px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <ShieldCheck size={16} color="#a78bfa" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: '#a1a1aa', lineHeight: 1.3 }}>
                    Individual competition constraint: Locked to 1 member. No teammates can be invited or added.
                  </span>
                </div>

                <div className="crm-price-card" style={{ marginTop: 14, padding: '12px' }}>
                  <div className="crm-price-row"><span className="crm-price-label">Entry Fee (Solo)</span><span className="crm-price-value">{fee === 0 ? 'Free' : `₹${fee}`}</span></div>
                  {fee > 0 && <div className="crm-price-row"><span className="crm-price-label">Platform Fee (2.5%)</span><span className="crm-price-value">₹{calculateBreakdown(fee, 1).platformFee}</span></div>}
                  <div className="crm-price-row" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10, marginTop: 4 }}>
                    <span className="crm-price-label" style={{ color: '#e4e4e7', fontWeight: 700 }}>Total Payable</span>
                    <span style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{fee === 0 ? 'Free' : `₹${calculateBreakdown(fee, 1).total}`}</span>
                  </div>
                </div>
              </div>

              <button className="crm-cta-btn primary" onClick={handleIndividualRegister} disabled={processing} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {processing ? (
                  <Loader2 size={16} className="spin" />
                ) : fee === 0 ? (
                  <>
                    <CheckCircle2 size={16} /> Confirm Registration
                  </>
                ) : (
                  <>
                    <CreditCard size={16} /> Pay ₹{calculateBreakdown(fee, 1).total}
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Floating Message Bubble */}
        {((flowMode === 'create' && isExistingDraft && !allVerified && isTeamLeaderView) || isPendingInvite || isMemberView || isFullyRegistered) && (
          <div className="crm-floating-msg">
            <MessageSquare size={14} color="#a78bfa" />
            <span style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>
              {isFullyRegistered ? 'Your team is registered!' : (isPendingInvite ? 'Pending your acceptance' : isMemberView ? 'Team is not registered yet' : 'Verify all members to register')}
            </span>
            <div className="crm-floating-arrow" />
          </div>
        )}

        <div className="crm-bottom-bar">

          <button className="crm-back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} />
            <span style={{ marginLeft: 4 }}>Back</span>
          </button>

          {isPendingInvite ? (
            <div style={{ display: 'flex', gap: 6, flex: 1 }}>
              <button className="crm-update-btn" style={{ backgroundColor: '#f87171' }} disabled={processing} onClick={async () => {
                setProcessing(true);
                try {
                  await competitionRegistrationService.rejectInvite(existingReg!.id);
                  setFlowMode(null); setTeamName(''); setAddedMembers([]); setIsExistingDraft(false);
                  queryClient.invalidateQueries({ queryKey: ['comp-registrations'] }); navigate(-1);
                } catch (e: any) { alert(e.message); } finally { setProcessing(false); }
              }}>{processing ? <Loader2 size={16} className="spin" /> : 'Reject'}</button>
              <button className="crm-update-btn" style={{ backgroundColor: '#10b981' }} disabled={processing} onClick={async () => {
                setProcessing(true);
                try {
                  await competitionRegistrationService.verifyRegistration(existingReg!.id);
                  queryClient.invalidateQueries({ queryKey: ['comp-registrations'] }); queryClient.invalidateQueries({ queryKey: ['draft-team'] });
                } catch (e: any) { alert(e.message); } finally { setProcessing(false); }
              }}>{processing ? <Loader2 size={16} className="spin" /> : 'Accept'}</button>
            </div>
          ) : isMemberView ? (
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
              <span style={{ backgroundColor: 'rgba(16,185,129,0.15)', padding: '8px 14px', borderRadius: 20, color: '#10b981', fontWeight: 700, fontSize: 13 }}>You are a member of this team</span>
            </div>
          ) : isFullyRegistered ? (
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
              <div style={{ backgroundColor: 'rgba(16,185,129,0.15)', padding: '12px 24px', borderRadius: 24, display: 'flex', alignItems: 'center', gap: 8, color: '#10b981', fontWeight: 800, fontSize: 14 }}>
                <CheckCircle2 size={18} /> REGISTERED
              </div>
            </div>
          ) : flowMode === 'create' && isExistingDraft ? (
            (hasUnsavedChanges || !allVerified) ? (
              <button className="crm-update-btn" disabled={processing || loading || checkingReg} onClick={handleUpdateTeam}>
                {processing ? <Loader2 size={16} className="spin" /> : 'Update Details'}
              </button>
            ) : (
              <button className="crm-update-btn" disabled={processing || loading || checkingReg} onClick={handleFinalizeRegistration}>
                {processing ? <Loader2 size={16} className="spin" /> : fee > 0 ? `Pay & Register ₹${calculateBreakdown(fee, draftMembers.length).total}` : 'Register Team'}
              </button>
            )
          ) : (
            <button className="crm-update-btn" disabled={processing || loading || checkingReg || flowMode === 'join'} onClick={() => {
              if (flowMode === 'individual') handleIndividualRegister(); else if (flowMode === 'create') handleCreateTeam();
            }}>
              {processing ? <Loader2 size={16} className="spin" /> : (
                flowMode === 'create' ? (addedMembers.length > 0 ? 'Save & Send Invites' : 'Save & Proceed') : (flowMode === 'individual' ? (fee === 0 ? 'Confirm Registration' : `Pay ₹${calculateBreakdown(fee, 1).total}`) : 'Join Team')
              )}
            </button>
          )}
        </div>

        {toastMessage && <div className="crm-toast"><CheckCircle2 size={16} color="#22c55e" /><span style={{ color: '#22c55e', fontSize: 13, fontWeight: 700 }}>{toastMessage}</span></div>}

        {customFormConfig && (
          <>
            <CustomFormFillModal
              isOpen={isFormFillModalOpen}
              onClose={() => setIsFormFillModalOpen(false)}
              formConfig={customFormConfig}
              initialValues={formResponse?.answers}
              onSubmit={handleFormSubmit}
              readOnly={Boolean(isMemberView)}
              isSubmitting={processing}
            />
            <CustomFormPurposeModal
              isOpen={isFormPurposeModalOpen}
              onClose={() => setIsFormPurposeModalOpen(false)}
              formConfig={customFormConfig}
              onOpenForm={() => {
                setIsFormPurposeModalOpen(false);
                setIsFormFillModalOpen(true);
              }}
            />
          </>
        )}
      </div>
    </>
  );
}

function DesktopView() {
  const logic = useCompetitionRegistrationLogic();
  const {
    id, competitionId, navigate, queryClient, user,
    comp, loading, existingReg, checkingReg,
    processing, setProcessing, error, setError,
    flowMode, setFlowMode, isIndividualOnly,
    teamName, setTeamName, lookingForTeammates, setLookingForTeammates,
    addedMembers, setAddedMembers, memberSearchQuery, setMemberSearchQuery,
    searchResults, setSearchResults, searchingMembers, searchModalVisible, setSearchModalVisible,
    inviteCode, setInviteCode, teamPreview, setTeamPreview, lookingUp, setLookingUp, joinTab, setJoinTab,
    toastMessage, showToast, draftTeamInviteCode, draftTeam,
    isActualLeader, isTeamLeaderView, isMemberView, isFullyRegistered, isPendingInvite, draftMembers, allVerified,
    regCount, openTeams, loadingOpenTeams, myJoinRequests, myTeams, loadingMyTeams,
    registerIndividual, createTeamAndRegister, joinTeamByCode, sendJoinRequest, addMember, importTeamBuilder, removeMember, updateTeamDetails, finalizeTeamRegistration,
    isExistingDraft, setIsExistingDraft, hasUnsavedChanges, searchMembers, lookupTeam,
    customFormConfig, formResponse, isFormSubmitted,
    isFormFillModalOpen, setIsFormFillModalOpen,
    isFormPurposeModalOpen, setIsFormPurposeModalOpen,
    handleIndividualRegister, handleCreateTeam, handleUpdateTeam, handleFinalizeRegistration, handleCopyCode,
    handleSendJoinRequest, handleJoinByCode, handleRejectInvite, handleAcceptInvite, handleImportTeam,
    handleFormSubmit
  } = logic;

  const [rightScrollable, setRightScrollable] = useState(false);
  const [rightAtBottom, setRightAtBottom] = useState(false);
  const rightPanelRef = useRef<HTMLDivElement>(null);

  const checkScroll = () => {
    if (rightPanelRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = rightPanelRef.current;
      setRightScrollable(scrollHeight > clientHeight);
      setRightAtBottom(scrollTop + clientHeight >= scrollHeight - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    const timer = setTimeout(checkScroll, 100);
    window.addEventListener('resize', checkScroll);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkScroll);
    };
  }, [flowMode, addedMembers.length, openTeams?.length, joinTab]);

  if (loading || checkingReg) {
    return <div className="crd-wrapper"><Loader2 size={40} className="spin" color="#6366f1" /></div>;
  }

  if (!comp) {
    return <div className="crd-wrapper"><div style={{ color: '#fff', fontSize: 24 }}>Competition not found</div></div>;
  }

  if (existingReg && existingReg.registration_type === 'individual') {
    return (
      <div className="crd-wrapper">
        <Helmet><title>Registration Confirmed — {comp?.title || 'PLUTO'}</title></Helmet>
        <div className="crd-container">
          {/* LEFT PANEL */}
          <div className="crd-left" style={{ justifyContent: 'space-between' }}>
            <div>
              <button className="crd-back" onClick={() => navigate(`/competition/${id}`)}>
                <ArrowLeft size={18} /> Back to Competition
              </button>

              <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                <div style={{ width: 80, height: 80, borderRadius: 16, overflow: 'hidden', flexShrink: 0, background: 'linear-gradient(rgba(139,92,246,0.15), rgba(99,102,241,0.08))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {comp?.banner_url ? <img src={comp.banner_url} alt="Banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Trophy color="rgba(255,255,255,0.3)" size={28} />}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4 }}>
                  <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: 0, lineHeight: 1.2 }}>{comp?.title}</h2>
                  <div style={{ fontSize: 13, color: '#a1a1aa', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Calendar size={14} />
                    {comp?.start_date ? new Date(comp.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'TBA'} {comp?.end_date ? `- ${new Date(comp.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : ''}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
                {comp?.category && <div style={{ background: 'rgba(255,255,255,0.06)', padding: '3px 10px', borderRadius: 8, fontSize: 11, color: '#a1a1aa', display: 'flex', alignItems: 'center', gap: 4 }}><Tag size={10} /> {comp.category}</div>}
                <div style={{ background: 'rgba(255,255,255,0.06)', padding: '3px 10px', borderRadius: 8, fontSize: 11, color: '#a1a1aa', display: 'flex', alignItems: 'center', gap: 4 }}>{comp?.is_online ? <><Wifi size={10} /> Online</> : <><MapPin size={10} /> {comp?.venue || 'Offline'}</>}</div>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="crd-right" style={{ padding: '36px 40px', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: '0 0 6px 0' }}>Registration Overview</h3>
            <p style={{ fontSize: 13, color: '#a1a1aa', margin: '0 0 20px 0' }}>Candidate details and submission confirmation for {comp?.title}.</p>

            {/* Application Screening Form (directly below Registration Overview, without Done badge) */}
            {customFormConfig && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                background: '#18181b',
                borderRadius: 16,
                marginBottom: 16
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(52,211,153,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileText size={18} color="#34d399" />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#34d399' }}>Application Screening Form</div>
                    <div style={{ fontSize: 12, color: '#a1a1aa', marginTop: 2 }}>Your screening responses have been submitted</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFormFillModalOpen(true)}
                  style={{
                    background: 'rgba(52,211,153,0.15)',
                    border: 'none',
                    borderRadius: 10,
                    padding: '8px 16px',
                    color: '#34d399',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  View Submitted Answers
                </button>
              </div>
            )}

            {/* REGISTRATION CONFIRMED (in right panel below Application Screening Form, borderless like app) */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '16px 20px',
              background: '#18181b',
              borderRadius: 16,
              marginBottom: 20
            }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(52,211,153,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <CheckCircle2 size={20} color="#34d399" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#34d399', letterSpacing: '0.5px' }}>
                  REGISTRATION CONFIRMED
                </div>
                <div style={{ fontSize: 12, color: '#a1a1aa', marginTop: 2, lineHeight: 1.4 }}>
                  You have successfully registered as an individual candidate. Your entry ticket and status are active.
                </div>
              </div>
            </div>

            {/* Candidate Card (with initial fallback if no profile pic) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)', marginBottom: 20 }}>
              <div style={{ width: 52, height: 52, borderRadius: 26, background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, fontSize: 20, fontWeight: 800, color: '#a78bfa' }}>
                {(user as any)?.profile_avatar || (user as any)?.avatar_url ? (
                  <img src={(user as any)?.profile_avatar || (user as any)?.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span>{(user?.name || user?.email || 'U')[0].toUpperCase()}</span>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name || 'Registered Candidate'}</span>
                  <span style={{ backgroundColor: 'rgba(99,102,241,0.2)', color: '#a78bfa', fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 8, flexShrink: 0 }}>SOLO CANDIDATE</span>
                </div>
                <div style={{ fontSize: 13, color: '#a1a1aa', marginTop: 3 }}>{user?.email}</div>
                {((user as any)?.college || (user as any)?.college_name) && (
                  <div style={{ fontSize: 12, color: '#818cf8', marginTop: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <GraduationCap size={13} />
                    <span>{(user as any)?.college || (user as any)?.college_name}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Metadata Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: 11, color: '#71717a', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Participation Mode</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginTop: 4 }}>Individual / Solo</div>
              </div>
              <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: 11, color: '#71717a', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Status</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#34d399', marginTop: 4, textTransform: 'uppercase' }}>{existingReg.status || 'Confirmed'}</div>
              </div>
              <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: 11, color: '#71717a', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Registration ID</div>
                <div style={{ fontSize: 13, fontFamily: 'monospace', color: '#e4e4e7', marginTop: 4 }}>#{existingReg.id.slice(0, 8).toUpperCase()}</div>
              </div>
              <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: 11, color: '#71717a', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Entry Fee</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginTop: 4 }}>{(existingReg.entry_fee_paid || 0) === 0 ? 'Free Entry' : `₹${existingReg.entry_fee_paid} Paid`}</div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 12, marginTop: 'auto' }}>
              <button
                className="crd-btn"
                onClick={() => navigate(`/competition/${id}`)}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                View Competition Page <ChevronRight size={16} />
              </button>
              <button
                onClick={() => navigate('/explore')}
                style={{
                  padding: '14px 20px',
                  borderRadius: 14,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#d4d4d8',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Explore More
              </button>
            </div>
          </div>
        </div>

        {customFormConfig && (
          <CustomFormFillModal
            isOpen={isFormFillModalOpen}
            onClose={() => setIsFormFillModalOpen(false)}
            formConfig={customFormConfig}
            initialValues={formResponse?.answers}
            onSubmit={handleFormSubmit}
            readOnly={false}
            isSubmitting={processing}
          />
        )}
      </div>
    );
  }

  const c: any = comp || {};
  const fee = Number(c.entry_fee) || 0;
  const maxSize = c.team_size_max || 5;
  const minSize = c.team_size_min || 1;
  const isPaid = fee > 0;
  const showTeamOption = c.registration_type === 'team' || c.registration_type === 'both';
  const showIndividualOption = c.registration_type === 'individual' || c.registration_type === 'both';
  const deadlinePassed = c.registration_deadline && new Date() > new Date(c.registration_deadline);
  const isFull = c.max_participants > 0 && (regCount || 0) >= c.max_participants;

  const renderedAddedMembers = isMemberView
    ? (draftTeam?.members || []).filter((m: any) => m.user_id !== user?.id && m.user_id !== draftTeam?.leader_id && m.team_role !== 'leader').map((m: any) => ({ ...(m.users || m.user), id: m.user_id || m.id, registration_id: m.id, verified: m.verified }))
    : addedMembers;

  if (!loading && !checkingReg && !isFullyRegistered && (deadlinePassed || isFull)) {
    return (
      <div className="crd-wrapper">
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <AlertTriangle size={36} color="#ef4444" />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 8 }}>{deadlinePassed ? 'Registration Closed' : 'Registrations Full'}</h2>
          <p style={{ fontSize: 14, color: '#a1a1aa', marginBottom: 24 }}>{deadlinePassed ? 'The registration deadline has passed.' : 'This competition has reached maximum registrations.'}</p>
          <button className="crd-back" style={{ margin: '0 auto' }} onClick={() => navigate(-1)}>← Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="crd-wrapper">
      <Helmet><title>Register — {c.title || 'PLUTO'}</title></Helmet>
      <div className="crd-container">

        {/* LEFT PANEL: Competition Info + Options/Tabs */}
        <div className="crd-left">
          <button className="crd-back" onClick={() => navigate(`/competition/${id}`)}>
            <ArrowLeft size={18} /> Back to Competition
          </button>

          {/* Banner + Info */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
              <div style={{ width: 80, height: 80, borderRadius: 16, overflow: 'hidden', flexShrink: 0, background: 'linear-gradient(rgba(139,92,246,0.15), rgba(99,102,241,0.08))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {c.banner_url ? <img src={c.banner_url} alt="Banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Trophy color="rgba(255,255,255,0.3)" size={28} />}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4 }}>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: 0, lineHeight: 1.2 }}>{c.title}</h2>
                <div style={{ fontSize: 13, color: '#a1a1aa', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Calendar size={14} />
                  {c.start_date ? new Date(c.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'TBA'} {c.end_date ? `- ${new Date(c.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : ''}
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {c.category && <div style={{ background: 'rgba(255,255,255,0.06)', padding: '3px 10px', borderRadius: 8, fontSize: 11, color: '#a1a1aa', display: 'flex', alignItems: 'center', gap: 4 }}><Tag size={10} /> {c.category}</div>}
                <div style={{ background: 'rgba(255,255,255,0.06)', padding: '3px 10px', borderRadius: 8, fontSize: 11, color: '#a1a1aa', display: 'flex', alignItems: 'center', gap: 4 }}><Ticket size={10} /> {fee === 0 ? 'Free' : `₹${fee}/member`}</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ background: 'rgba(255,255,255,0.06)', padding: '3px 10px', borderRadius: 8, fontSize: 11, color: '#a1a1aa', display: 'flex', alignItems: 'center', gap: 4 }}>{c.is_online ? <><Wifi size={10} /> Online</> : <><MapPin size={10} /> {c.venue || 'Offline'}</>}</div>
              </div>
            </div>
          </div>

          {/* Mode Selection Cards */}
          {(!flowMode && !isIndividualOnly) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
              {showIndividualOption && (
                <div className="crd-option" onClick={() => { setFlowMode('individual'); setError(''); }}>
                  <div className="crd-option-icon" style={{ background: 'rgba(96,165,250,0.1)', color: '#60a5fa' }}><UserIcon size={24} /></div>
                  <div>
                    <div className="crd-option-title">Individual</div>
                    <div className="crd-option-desc">Register as a solo participant</div>
                  </div>
                </div>
              )}
              {showTeamOption && (
                <>
                  <div className="crd-option" onClick={() => { setFlowMode('create'); setError(''); }}>
                    <div className="crd-option-icon" style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399' }}><Users size={24} /></div>
                    <div>
                      <div className="crd-option-title">Create a Team</div>
                      <div className="crd-option-desc">Start a new team and invite members</div>
                    </div>
                  </div>
                  <div className="crd-option" onClick={() => { setFlowMode('join'); setError(''); }}>
                    <div className="crd-option-icon" style={{ background: 'rgba(251,191,36,0.1)', color: '#fbbf24' }}><Hash size={24} /></div>
                    <div>
                      <div className="crd-option-title">Join a Team</div>
                      <div className="crd-option-desc">Join using an invite code</div>
                    </div>
                  </div>
                  <div className="crd-option" onClick={() => { setFlowMode('existing'); setError(''); }}>
                    <div className="crd-option-icon" style={{ background: 'rgba(56,189,248,0.1)', color: '#38bdf8' }}><Inbox size={24} /></div>
                    <div>
                      <div className="crd-option-title">Add Existing Team</div>
                      <div className="crd-option-desc">Use a team you already built</div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Tabs when in team flow */}
          {!isIndividualOnly && !isTeamLeaderView && !isMemberView && (flowMode === 'create' || flowMode === 'join' || flowMode === 'existing') && (
            <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 4, marginBottom: 20 }}>
              {['create', 'join', 'existing'].map((tab) => (
                <button key={tab} onClick={() => { setFlowMode(tab as any); setError(''); }}
                  style={{
                    flex: 1, padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, transition: 'all 0.2s', whiteSpace: 'nowrap',
                    background: flowMode === tab ? 'rgba(99,102,241,0.25)' : 'transparent',
                    color: flowMode === tab ? '#a78bfa' : '#71717a'
                  }}>
                  {tab === 'create' ? 'Create a team' : tab === 'join' ? 'Join a team' : 'Existing team'}
                </button>
              ))}
            </div>
          )}


          {error && (
            <div style={{ padding: 14, background: 'rgba(239,68,68,0.1)', borderRadius: 12, border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', display: 'flex', gap: 8, marginBottom: 16, fontSize: 13 }}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} /> <span>{error}</span>
            </div>
          )}

          {/* Fee Summary at bottom of left panel */}
          {flowMode && (
            <div style={{ marginTop: 'auto', paddingTop: 20 }}>

              {/* Desktop Registration Status Tag */}
              {flowMode === 'create' && (!isPendingInvite || isFullyRegistered || isMemberView) && (
                <div style={{ marginBottom: 16, width: 'max-content', marginLeft: 'auto', padding: '10px 14px', backgroundColor: '#1f1f1f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
                  <MessageSquare size={14} color="#a78bfa" />
                  <span style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>
                    {isFullyRegistered ? 'Your team is registered!' : (isPendingInvite ? 'Pending your acceptance' : isMemberView ? 'Team is not registered yet' : 'Verify all members to register')}
                  </span>
                  <div style={{ position: 'absolute', bottom: -10, right: 24, width: 18, height: 18, backgroundColor: '#1f1f1f', borderRight: '1px solid rgba(255,255,255,0.1)', borderBottom: '1px solid rgba(255,255,255,0.1)', transform: 'rotate(45deg)' }} />
                </div>
              )}

              {(() => {
                const totalTeamMembers = flowMode === 'create' ? (isMemberView ? (2 + renderedAddedMembers.length) : (1 + renderedAddedMembers.length)) : 1;
                return (
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 14, padding: '16px 20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: '#a1a1aa', fontSize: 13 }}>
                      <span>Entry Fee {flowMode === 'create' ? `× ${totalTeamMembers} members` : ''}</span>
                      <span>{fee === 0 ? 'Free' : `₹${fee * totalTeamMembers}`}</span>
                    </div>
                    {fee > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: '#71717a', fontSize: 12 }}>
                        <span>Platform Fee (2.5%)</span>
                        <span>₹{calculateBreakdown(fee, totalTeamMembers).platformFee}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)', color: '#fff', fontSize: 16, fontWeight: 700 }}>
                      <span>Total</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {isFullyRegistered && fee > 0 && <span style={{ backgroundColor: 'rgba(16,185,129,0.15)', padding: '2px 6px', borderRadius: 6, color: '#10b981', fontSize: 10, fontWeight: 800 }}>PAID</span>}
                        <span>{fee === 0 ? 'Free' : `₹${calculateBreakdown(fee, totalTeamMembers).total}`}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
              {(isMemberView || isTeamLeaderView) && <div style={{ fontSize: 11, color: '#71717a', textAlign: 'center', marginTop: 10 }}>Note: All registration fees are paid collectively by the team leader.</div>}
            </div>
          )}
        </div>

        {/* RIGHT PANEL: Forms & Team Details */}
        <div style={{ flex: 1.2, position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'hidden', borderTopRightRadius: 24, borderBottomRightRadius: 24 }}>
          <div className="crd-right" style={{ flex: 1, paddingBottom: 60 }} ref={rightPanelRef} onScroll={checkScroll}>

          {/* INDIVIDUAL */}
          {flowMode === 'individual' && !isFullyRegistered && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: '0 0 4px 0' }}>Candidate Registration</h3>
                <p style={{ fontSize: 13, color: '#a1a1aa', margin: 0 }}>Review candidate details and complete solo registration.</p>
              </div>

              {/* Custom Application Form Banner */}
              {customFormConfig && customFormConfig.fields && customFormConfig.fields.length > 0 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: '14px 18px',
                  background: isFormSubmitted ? 'rgba(52, 211, 153, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                  border: `1px solid ${isFormSubmitted ? 'rgba(52, 211, 153, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`,
                  borderRadius: 14,
                  marginBottom: 20
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: isFormSubmitted ? 'rgba(52, 211, 153, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <FileText size={18} color={isFormSubmitted ? '#34d399' : '#fbbf24'} />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: isFormSubmitted ? '#34d399' : '#fbbf24', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>{isFormSubmitted ? 'Application Form: Completed' : 'Application Form Required'}</span>
                        {isFormSubmitted && <CheckCircle2 size={14} color="#34d399" />}
                      </div>
                      <div style={{ fontSize: 12, color: '#a1a1aa' }}>
                        {isFormSubmitted ? (customFormConfig.title || 'Screening Questions') : 'Please fill out required screening questions to submit'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => setIsFormPurposeModalOpen(true)}
                      title="View Form Purpose"
                      style={{
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 8,
                        padding: '6px 14px',
                        color: '#e4e4e7',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: 12,
                        cursor: 'pointer'
                      }}
                    >
                      <Eye size={14} />
                      <span>Purpose</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsFormFillModalOpen(true)}
                      style={{
                        background: isFormSubmitted ? 'rgba(99,102,241,0.15)' : '#f59e0b',
                        border: isFormSubmitted ? '1px solid rgba(99,102,241,0.3)' : 'none',
                        borderRadius: 8,
                        padding: '6px 16px',
                        color: isFormSubmitted ? '#a78bfa' : '#000',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {isFormSubmitted ? 'Edit Answers' : 'Fill Form'}
                    </button>
                  </div>
                </div>
              )}

              {/* Candidate Profile Card */}
              <div style={{ padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)', marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Candidate Details</span>
                  <span style={{ backgroundColor: 'rgba(99,102,241,0.2)', color: '#a78bfa', fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 8 }}>SOLO CANDIDATE</span>
                </div>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <div style={{ width: 52, height: 52, borderRadius: 26, background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, fontSize: 20, fontWeight: 800, color: '#a78bfa' }}>
                    {(user as any)?.profile_avatar || (user as any)?.avatar_url ? (
                      <img src={(user as any)?.profile_avatar || (user as any)?.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span>{(user?.name || user?.email || 'U')[0].toUpperCase()}</span>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#e4e4e7', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user?.name || 'Student Candidate'}
                    </div>
                    <div style={{ fontSize: 13, color: '#71717a', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user?.email}
                    </div>
                    {((user as any)?.college || (user as any)?.college_name) && (
                      <div style={{ fontSize: 12, color: '#818cf8', marginTop: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
                        <GraduationCap size={13} />
                        <span>{(user as any)?.college || (user as any)?.college_name}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Individual constraint notice (Unstop style) */}
                <div style={{
                  marginTop: 16,
                  padding: '12px 14px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10
                }}>
                  <ShieldCheck size={18} color="#a78bfa" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: '#a1a1aa', lineHeight: 1.4 }}>
                    Individual competition constraint: You are registered as a single candidate. Adding or inviting team members is disabled.
                  </span>
                </div>
              </div>

              <button
                className="crd-btn"
                style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                onClick={handleIndividualRegister}
                disabled={processing}
              >
                {processing ? (
                  <Loader2 className="spin" size={20} />
                ) : fee === 0 ? (
                  <>
                    <CheckCircle2 size={18} /> Confirm Registration
                  </>
                ) : (
                  <>
                    <CreditCard size={18} /> Proceed to Pay ₹{calculateBreakdown(fee, 1).total}
                  </>
                )}
              </button>
            </div>
          )}

          {/* CREATE TEAM */}
          {flowMode === 'create' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              {(isMemberView || isTeamLeaderView) && (
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#d4d4d8', textAlign: 'center', marginBottom: 16 }}>Your Team</h3>
              )}

              {/* Custom Application Form Banner */}
              {customFormConfig && customFormConfig.fields && customFormConfig.fields.length > 0 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: '12px 16px',
                  background: isFormSubmitted ? 'rgba(52, 211, 153, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                  border: `1px solid ${isFormSubmitted ? 'rgba(52, 211, 153, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`,
                  borderRadius: 12,
                  marginBottom: 16
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 34,
                      height: 34,
                      borderRadius: 8,
                      background: isFormSubmitted ? 'rgba(52, 211, 153, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <FileText size={17} color={isFormSubmitted ? '#34d399' : '#fbbf24'} />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: isFormSubmitted ? '#34d399' : '#fbbf24', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>{isFormSubmitted ? 'Application Form: Submitted' : 'Application Form Required'}</span>
                        {isFormSubmitted && <CheckCircle2 size={14} color="#34d399" />}
                      </div>
                      <div style={{ fontSize: 12, color: '#a1a1aa' }}>
                        {isFormSubmitted ? (customFormConfig.title || 'Screening Questions') : 'Please fill out required screening questions to proceed'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => setIsFormPurposeModalOpen(true)}
                      title="View Form Purpose"
                      style={{
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 8,
                        padding: '6px 12px',
                        color: '#e4e4e7',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: 12,
                        cursor: 'pointer'
                      }}
                    >
                      <Eye size={14} />
                      <span>Purpose</span>
                    </button>
                    {!isFullyRegistered && !isMemberView && (
                      <button
                        type="button"
                        onClick={() => setIsFormFillModalOpen(true)}
                        style={{
                          background: isFormSubmitted ? 'rgba(99,102,241,0.15)' : '#f59e0b',
                          border: isFormSubmitted ? '1px solid rgba(99,102,241,0.3)' : 'none',
                          borderRadius: 8,
                          padding: '6px 14px',
                          color: isFormSubmitted ? '#a78bfa' : '#000',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        {isFormSubmitted ? 'Edit Answers' : 'Fill Form'}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Team Name */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#a1a1aa', marginBottom: 8 }}>Team Name</label>
                <input className="crd-input" placeholder="e.g., Code Crusaders" value={teamName} onChange={e => setTeamName(e.target.value)} maxLength={50} disabled={isMemberView || isFullyRegistered} style={(isMemberView || isFullyRegistered) ? { opacity: 0.7 } : {}} />
              </div>

              {/* Teammates Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#e4e4e7' }}>Teammates</span>
                  <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#e4e4e7' }}>
                      {isMemberView ? 2 + renderedAddedMembers.length : 1 + renderedAddedMembers.length}/{maxSize}
                    </span>
                  </div>
                </div>
                {draftTeamInviteCode && (
                  <button onClick={handleCopyCode} style={{ display: 'flex', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: 8, border: 'none', cursor: 'pointer' }}>
                    <span style={{ color: '#a1a1aa', fontSize: 12, fontWeight: 600 }}>Code: {draftTeamInviteCode.toUpperCase()}</span>
                    <Copy size={12} color="#a1a1aa" />
                  </button>
                )}
              </div>

              {/* Min size warning */}
              {!isFullyRegistered && (isMemberView ? 2 + renderedAddedMembers.length : 1 + renderedAddedMembers.length) < minSize && (
                <div style={{ fontSize: 12, color: '#f59e0b', marginBottom: 10 }}>
                  Add {minSize - (isMemberView ? 2 + renderedAddedMembers.length : 1 + renderedAddedMembers.length)} more member(s) to meet minimum team size
                </div>
              )}

              {/* Leader Card */}
              {(() => {
                const isCurrentUserLeader = draftTeam ? draftTeam.leader_id === user?.id : !isMemberView;
                let leaderUser = isCurrentUserLeader ? user : ((draftTeam as any)?.leader || (existingReg as any)?.team?.leader || (existingReg as any)?.competition_teams?.leader);
                if (!isCurrentUserLeader && !leaderUser) leaderUser = { name: 'Team Leader', email: 'Loading...' } as any;
                if (!leaderUser) return null;
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)', marginBottom: 8 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 20, background: 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', fontSize: 16, fontWeight: 700, color: '#a78bfa' }}>
                      {(leaderUser as any)?.avatar_url || (leaderUser as any)?.profile_avatar || (leaderUser as any)?.avatar
                        ? <img src={(leaderUser as any)?.avatar_url || (leaderUser as any)?.profile_avatar || (leaderUser as any)?.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <span>{(leaderUser?.name || 'U')[0].toUpperCase()}</span>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#e4e4e7', display: 'flex', alignItems: 'center', gap: 8 }}>
                        {leaderUser?.name || (isTeamLeaderView ? 'You' : 'Leader')} {isTeamLeaderView && '(You)'}
                        <span style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: 6, fontSize: 9, fontWeight: 800, color: '#d4d4d8' }}>LEADER</span>
                      </div>
                      <div style={{ fontSize: 12, color: '#71717a', marginTop: 2 }}>{leaderUser?.email}</div>
                    </div>
                    <CheckCircle2 size={20} color="#34d399" />
                  </div>
                );
              })()}

              {/* Current User Card (if member) */}
              {isMemberView && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)', marginBottom: 8 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 20, background: 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', fontSize: 16, fontWeight: 700, color: '#a78bfa' }}>
                    {(user as any)?.avatar_url || (user as any)?.profile_avatar || (user as any)?.avatar
                      ? <img src={(user as any)?.avatar_url || (user as any)?.profile_avatar || (user as any)?.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span>{(user?.name || 'U')[0].toUpperCase()}</span>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#e4e4e7' }}>{user?.name || 'You'} (You)</div>
                    <div style={{ fontSize: 12, color: '#71717a', marginTop: 2 }}>{user?.email}</div>
                  </div>
                  {!isPendingInvite ? <CheckCircle2 size={20} color="#34d399" /> : <Clock size={20} color="#a1a1aa" />}
                </div>
              )}

              {/* Added Members */}
              {renderedAddedMembers.map((member) => (
                <div key={member.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)', marginBottom: 8 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 20, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', fontSize: 16, fontWeight: 700, color: '#a1a1aa' }}>
                    {(member as any)?.avatar_url || (member as any)?.profile_avatar || (member as any)?.avatar
                      ? <img src={(member as any)?.avatar_url || (member as any)?.profile_avatar || (member as any)?.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span>{(member.name || 'M')[0].toUpperCase()}</span>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#e4e4e7' }}>{member.name}</div>
                    <div style={{ fontSize: 12, color: '#71717a', marginTop: 2 }}>{member.email}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {member.verified !== false ? <CheckCircle2 size={20} color="#34d399" /> : <Clock size={20} color="#a1a1aa" />}
                    {!isMemberView && !isFullyRegistered && (
                      <button onClick={() => { if (member.registration_id && draftTeam) removeMember.mutate({ registrationId: member.registration_id, teamId: draftTeam.id }); setAddedMembers(prev => prev.filter(m => m.id !== member.id)); }}
                        style={{ background: 'transparent', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer', color: '#71717a', transition: 'color 0.2s' }}>
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {/* Add Member Button / Search */}
              {!isMemberView && !isFullyRegistered && (1 + renderedAddedMembers.length) < maxSize && (
                <div style={{ marginTop: 8, marginBottom: 12 }}>
                  {!searchModalVisible ? (
                    <button onClick={() => setSearchModalVisible(true)} style={{ width: '100%', padding: '14px', background: 'rgba(99,102,241,0.08)', border: '1px dashed rgba(99,102,241,0.3)', borderRadius: 12, color: '#a78bfa', cursor: 'pointer', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <Plus size={16} /> Add {getOrdinal(renderedAddedMembers.length + 2)} Member
                    </button>
                  ) : (
                    <div>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                        <input className="crd-input" style={{ marginBottom: 0, flex: 1 }} placeholder="Search by name or email..." value={memberSearchQuery} onChange={e => setMemberSearchQuery(e.target.value)} autoFocus />
                        <button onClick={() => { setSearchModalVisible(false); setMemberSearchQuery(''); setSearchResults([]); }} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 10, padding: 12, cursor: 'pointer', color: '#a1a1aa' }}>
                          <X size={20} />
                        </button>
                      </div>
                      {searchResults.length > 0 && (
                        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                          {searchResults.map(u => {
                            const isRegistered = Boolean(u.isAlreadyRegistered);
                            return (
                              <div key={u.id}
                                onClick={() => {
                                  if (isRegistered) {
                                    showToast(`${u.name} is already registered in another team`);
                                    return;
                                  }
                                  setAddedMembers(prev => [...prev, { ...u, verified: false }]);
                                  setMemberSearchQuery('');
                                  setSearchResults([]);
                                  setSearchModalVisible(false);
                                }}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 12,
                                  padding: '12px 16px',
                                  cursor: isRegistered ? 'not-allowed' : 'pointer',
                                  opacity: isRegistered ? 0.6 : 1,
                                  borderBottom: '1px solid rgba(255,255,255,0.03)',
                                  transition: 'background 0.15s'
                                }}
                                onMouseEnter={e => { if (!isRegistered) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                                onMouseLeave={e => { if (!isRegistered) e.currentTarget.style.background = 'transparent'; }}>
                                <div style={{ width: 32, height: 32, borderRadius: 16, background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', fontSize: 13, fontWeight: 700, color: '#a78bfa' }}>
                                  {(u as any)?.profile_avatar || (u as any)?.avatar_url || (u as any)?.avatar ? <img src={(u as any)?.profile_avatar || (u as any)?.avatar_url || (u as any)?.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span>{(u.name || 'U')[0].toUpperCase()}</span>}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: 13, fontWeight: 600, color: '#e4e4e7', display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span>{u.name}</span>
                                    {isRegistered && (
                                      <span style={{ fontSize: 10, fontWeight: 700, color: '#f87171', background: 'rgba(239,68,68,0.15)', padding: '1px 6px', borderRadius: 4 }}>
                                        Already in a team
                                      </span>
                                    )}
                                  </div>
                                  <div style={{ fontSize: 11, color: '#71717a' }}>{u.email}</div>
                                </div>
                                {!isRegistered && <Plus size={16} color="#a78bfa" />}
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {!searchingMembers && memberSearchQuery.trim().length >= 1 && searchResults.length === 0 && (
                        <div style={{ padding: '12px 16px', fontSize: 12, color: '#71717a', textAlign: 'center' }}>
                          No users found matching "{memberSearchQuery.trim()}"
                        </div>
                      )}
                      {searchingMembers && <Loader2 size={16} color="#a78bfa" className="spin" style={{ margin: '12px auto', display: 'block' }} />}
                    </div>
                  )}
                </div>
              )}

              {/* Verified/Pending legend */}
              {(isTeamLeaderView || isMemberView) && (
                <div style={{ display: 'flex', gap: 16, marginBottom: 12, padding: '0 4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><CheckCircle2 size={14} color="#34d399" /><span style={{ fontSize: 11, color: '#a1a1aa' }}>Verified</span></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Clock size={14} color="#a1a1aa" /><span style={{ fontSize: 11, color: '#a1a1aa' }}>Pending</span></div>
                </div>
              )}

              {/* Looking for Teammates Toggle */}
              {!isMemberView && !isFullyRegistered && (
                <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', background: 'rgba(255,255,255,0.03)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.05)', marginBottom: 8 }}>
                  <div style={{ flex: 1, marginRight: 12 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#e4e4e7' }}>Looking for Teammates</div>
                    <div style={{ fontSize: 11, color: '#71717a', marginTop: 2 }}>Allow others to find & request to join your team</div>
                  </div>
                  <div onClick={() => setLookingForTeammates(!lookingForTeammates)}
                    style={{ width: 44, height: 24, borderRadius: 12, background: lookingForTeammates ? '#8b5cf6' : 'rgba(255,255,255,0.15)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                    <div style={{ width: 18, height: 18, borderRadius: 9, background: '#fff', position: 'absolute', top: 3, left: lookingForTeammates ? 23 : 3, transition: 'left 0.2s' }} />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ marginTop: 12, display: 'flex', gap: 10, paddingBottom: 20 }}>
                {isPendingInvite ? (
                  <>
                    <button className="crd-btn" style={{ background: '#f87171', flex: 1 }} disabled={processing} onClick={async () => {
                      setProcessing(true);
                      try { await competitionRegistrationService.rejectInvite(existingReg!.id); setFlowMode(null); setTeamName(''); setAddedMembers([]); setIsExistingDraft(false); queryClient.invalidateQueries({ queryKey: ['comp-registrations'] }); navigate(-1); }
                      catch (e: any) { alert(e.message); } finally { setProcessing(false); }
                    }}>{processing ? <Loader2 size={16} className="spin" /> : 'Reject'}</button>
                    <button className="crd-btn" style={{ background: '#10b981', flex: 1 }} disabled={processing} onClick={async () => {
                      setProcessing(true);
                      try { await competitionRegistrationService.verifyRegistration(existingReg!.id); queryClient.invalidateQueries({ queryKey: ['comp-registrations'] }); queryClient.invalidateQueries({ queryKey: ['draft-team'] }); }
                      catch (e: any) { alert(e.message); } finally { setProcessing(false); }
                    }}>{processing ? <Loader2 size={16} className="spin" /> : 'Accept Invite'}</button>
                  </>
                ) : isMemberView ? (
                  <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                    <span style={{ backgroundColor: 'rgba(16,185,129,0.15)', padding: '10px 16px', borderRadius: 20, color: '#10b981', fontWeight: 700, fontSize: 13 }}>You are a member of this team</span>
                  </div>
                ) : isFullyRegistered ? (
                  <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                    <div style={{ backgroundColor: 'rgba(16,185,129,0.15)', padding: '12px 24px', borderRadius: 24, display: 'flex', alignItems: 'center', gap: 8, color: '#10b981', fontWeight: 800, fontSize: 14 }}>
                      <CheckCircle2 size={18} /> REGISTERED
                    </div>
                  </div>
                ) : isExistingDraft ? (
                  (hasUnsavedChanges || !allVerified) ? (
                    <button className="crd-btn" style={{ flex: 1 }} disabled={processing} onClick={handleUpdateTeam}>
                      {processing ? <Loader2 size={16} className="spin" /> : 'Update Details'}
                    </button>
                  ) : (
                    <button className="crd-btn" style={{ flex: 1 }} disabled={processing} onClick={handleFinalizeRegistration}>
                      {processing ? <Loader2 size={16} className="spin" /> : fee > 0 ? `Pay & Register ₹${calculateBreakdown(fee, draftMembers.length).total}` : 'Register Team'}
                    </button>
                  )
                ) : (
                  <button className="crd-btn" style={{ flex: 1 }} disabled={processing || !teamName.trim()} onClick={handleCreateTeam}>
                    {processing ? <Loader2 size={16} className="spin" /> : (addedMembers.length > 0 ? 'Save & Send Invites' : 'Save & Proceed')}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* JOIN TEAM */}
          {flowMode === 'join' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 4, marginBottom: 20 }}>
                <button onClick={() => setJoinTab('browse')} style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: joinTab === 'browse' ? 'rgba(99,102,241,0.2)' : 'transparent', color: joinTab === 'browse' ? '#a78bfa' : '#71717a' }}>Browse Teams</button>
                <button onClick={() => setJoinTab('code')} style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: joinTab === 'code' ? 'rgba(99,102,241,0.2)' : 'transparent', color: joinTab === 'code' ? '#a78bfa' : '#71717a' }}>Invite Code</button>
              </div>

              {joinTab === 'browse' && (
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#a1a1aa', marginBottom: 14 }}>Teams looking for members</div>
                  {loadingOpenTeams ? <Loader2 size={24} color="#a78bfa" className="spin" style={{ margin: '20px auto', display: 'block' }} /> : (openTeams || []).length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}><Users size={32} color="rgba(255,255,255,0.1)" /><div style={{ fontSize: 14, color: '#52525b', marginTop: 10 }}>No open teams found</div></div>
                  ) : (openTeams || []).map(team => {
                    const hasRequested = myJoinRequests?.some((req: any) => req.team_id === team.id);
                    return (
                      <div key={team.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)', marginBottom: 8 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 20, background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', fontSize: 16, fontWeight: 700, color: '#a78bfa' }}>
                          {team.leader?.profile_avatar ? <img src={team.leader.profile_avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span>{(team.name || 'T')[0].toUpperCase()}</span>}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#e4e4e7' }}>{team.name}</div>
                          <div style={{ fontSize: 11, color: '#71717a' }}>{team.leader?.name || 'Unknown'} · {team.team_size}/{maxSize} members</div>
                        </div>
                        {hasRequested ? (
                          <div style={{ backgroundColor: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', color: '#34d399', padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={12} /> Requested</div>
                        ) : (
                          <button onClick={() => handleSendJoinRequest(team.id)} disabled={processing} style={{ backgroundColor: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#a78bfa', padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}><Plus size={12} /> Request</button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {joinTab === 'code' && (
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#a1a1aa', marginBottom: 8 }}>Invite Code</label>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                    <input className="crd-input" placeholder="Enter invite code" value={inviteCode} onChange={e => { setInviteCode(e.target.value.toUpperCase()); setTeamPreview(null); setError(''); }} maxLength={10} style={{ flex: 1, textTransform: 'uppercase' }} />
                    <button onClick={lookupTeam} disabled={lookingUp || inviteCode.length < 4} style={{ background: 'rgba(99,102,241,0.2)', border: 'none', borderRadius: 12, padding: '0 16px', cursor: 'pointer', color: '#a78bfa', display: 'flex', alignItems: 'center' }}>
                      {lookingUp ? <Loader2 size={16} className="spin" /> : <Search size={16} />}
                    </button>
                  </div>

                  {teamPreview && (
                    <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.05)', padding: 20, marginBottom: 16 }}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 20, background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                          {teamPreview.leader?.profile_avatar ? <img src={teamPreview.leader.profile_avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Users size={16} color="#a78bfa" />}
                        </div>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: '#e4e4e7' }}>{teamPreview.name}</div>
                          <div style={{ fontSize: 11, color: '#71717a' }}>{teamPreview.team_size}/{maxSize} members · Leader: {teamPreview.leader?.name || '—'}</div>
                        </div>
                      </div>
                      {teamPreview.members && teamPreview.members.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                          {teamPreview.members.map((m: any) => (
                            <div key={m.id} style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: 8, fontSize: 11, color: '#d4d4d8' }}>{m.user?.name || m.user?.email || '—'}</div>
                          ))}
                        </div>
                      )}
                      {myJoinRequests?.some((req: any) => req.team_id === teamPreview.id) ? (
                        <div style={{ padding: '10px 16px', background: 'rgba(52,211,153,0.1)', borderRadius: 10, color: '#34d399', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><Clock size={16} /> Already Requested</div>
                      ) : (
                        <button className="crd-btn" onClick={() => handleSendJoinRequest(teamPreview.id)} disabled={processing}>
                          {processing ? <Loader2 size={16} className="spin" /> : 'Request to join'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* EXISTING TEAM */}
          {flowMode === 'existing' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#a1a1aa', marginBottom: 14 }}>Select a team from Team Builder</div>
              {loadingMyTeams ? <Loader2 size={24} color="#a78bfa" className="spin" style={{ margin: '20px auto', display: 'block' }} /> : (myTeams || []).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}><Users size={32} color="rgba(255,255,255,0.1)" /><div style={{ fontSize: 14, color: '#52525b', marginTop: 10 }}>No teams found. Create a team in Team Builder first.</div></div>
              ) : (myTeams || []).map(team => {
                const approvedCount = (team.team_members || []).filter((m: any) => m.status === 'approved').length;
                const totalSize = 1 + approvedCount;
                const fitsMax = totalSize <= maxSize;
                return (
                  <div key={team.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)', marginBottom: 8, opacity: fitsMax ? 1 : 0.5 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 20, background: 'rgba(251,191,36,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', fontSize: 16, fontWeight: 700, color: '#fbbf24' }}>
                      {team.creator_avatar ? <img src={team.creator_avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span>{(team.team_name || 'T')[0].toUpperCase()}</span>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#e4e4e7' }}>{team.team_name}</div>
                      <div style={{ fontSize: 11, color: '#71717a' }}>{team.competition_name} · {totalSize} members</div>
                      {!fitsMax && <div style={{ fontSize: 10, color: '#ef4444', marginTop: 2 }}>Too many members (max {maxSize})</div>}
                    </div>
                    <button onClick={() => handleImportTeam(team.id)} disabled={processing || !fitsMax}
                      style={{ backgroundColor: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#a78bfa', padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: fitsMax ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 4, opacity: fitsMax ? 1 : 0.3 }}>
                      Import <ChevronRight size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty state */}
          {!flowMode && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'rgba(255,255,255,0.15)' }}>
              <Trophy size={64} style={{ marginBottom: 24 }} />
              <h3 style={{ fontSize: 20, fontWeight: 600 }}>Ready to Compete?</h3>
              <p style={{ fontSize: 14, marginTop: 8 }}>Select an option on the left to begin.</p>
            </div>
          )}

          </div>

          {/* Scroll Indicator */}
          {rightScrollable && !rightAtBottom && (
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, background: 'linear-gradient(to top, #121212 10%, transparent)', pointerEvents: 'none', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 16 }}>
              <ChevronDown size={24} color="rgba(255,255,255,0.5)" className="animate-bounce" />
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toastMessage && (
        <div style={{ position: 'fixed', bottom: 40, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.9)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 12, padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 8, zIndex: 1000 }}>
          <CheckCircle2 size={16} color="#22c55e" /><span style={{ color: '#22c55e', fontSize: 13, fontWeight: 700 }}>{toastMessage}</span>
        </div>
      )}

      {customFormConfig && (
        <>
          <CustomFormFillModal
            isOpen={isFormFillModalOpen}
            onClose={() => setIsFormFillModalOpen(false)}
            formConfig={customFormConfig}
            initialValues={formResponse?.answers}
            onSubmit={handleFormSubmit}
            readOnly={Boolean(isMemberView)}
            isSubmitting={processing}
          />
          <CustomFormPurposeModal
            isOpen={isFormPurposeModalOpen}
            onClose={() => setIsFormPurposeModalOpen(false)}
            formConfig={customFormConfig}
            onOpenForm={() => {
              setIsFormPurposeModalOpen(false);
              setIsFormFillModalOpen(true);
            }}
          />
        </>
      )}
    </div>
  );
}

export default function CompetitionRegistration() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  if (isMobile) {
    return <MobileView />
  }

  return <DesktopView />
}
