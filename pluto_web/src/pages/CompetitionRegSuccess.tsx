import { useEffect, useState } from 'react'
import { useParams, useSearchParams, Link, useLocation } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { CheckCircle2, Users, Trophy, ArrowRight, Home, Send, UserCheck, Loader2, GraduationCap, FileText, ShieldCheck } from 'lucide-react'
import { competitionRegistrationService } from '@/services/competitionRegistrationService'
import { useAuthStore } from '@/stores/authStore'

import './CompetitionRegistration.css' // Reuse the same CSS for generic styles if needed

export default function CompetitionRegSuccess() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const mode = searchParams.get('mode')
  const location = useLocation()
  const { user } = useAuthStore()

  const {
    competitionTitle = 'Competition',
    registrationType = 'individual',
    teamName,
    inviteCode,
    teamId,
    competitionBanner,
    registrationId,
    hasFormResponse,
    participant,
  } = (location.state || {}) as any

  const candidateName = participant?.name || user?.name || 'Candidate'
  const candidateEmail = participant?.email || user?.email || ''
  const candidateAvatar = participant?.avatar || (user as any)?.profile_avatar || (user as any)?.avatar_url
  const candidateCollege = participant?.college || (user as any)?.college || (user as any)?.college_name

  const [members, setMembers] = useState<any[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)

  useEffect(() => {
    if (registrationType === 'team' && teamId) {
      setLoadingMembers(true)
      competitionRegistrationService.getTeamMembers(teamId)
        .then(data => {
          const sorted = (data || []).sort((a: any, b: any) => {
            if (a.team_role === 'leader' && b.team_role !== 'leader') return -1;
            if (a.team_role !== 'leader' && b.team_role === 'leader') return 1;
            return 0;
          });
          setMembers(sorted);
        })
        .catch(err => console.error("Error fetching team members:", err))
        .finally(() => setLoadingMembers(false))
    }
  }, [teamId, registrationType])

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const leftContent = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '400px' }}>
      {/* Success Icon or Banner */}
      {competitionBanner ? (
        <div style={{ 
          width: '100%', 
          height: '180px', 
          borderRadius: '24px', 
          overflow: 'hidden', 
          position: 'relative',
          marginBottom: '12px' 
        }}>
          <img src={competitionBanner} alt="Banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            backgroundColor: '#10b981',
            padding: '4px 12px',
            borderRadius: '50px',
            border: '2px solid #000',
            zIndex: 3
          }}>
            <span style={{ color: '#000', fontSize: '10px', fontWeight: 800, letterSpacing: '1px' }}>REGISTERED</span>
          </div>
        </div>
      ) : (
        <>
          <div style={{
            width: 72, height: 72, borderRadius: 36,
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            marginBottom: '-12px', zIndex: 2, position: 'relative'
          }}>
            <CheckCircle2 size={32} color="#10b981" />
          </div>
          <div style={{
            backgroundColor: '#10b981', padding: '4px 12px',
            borderRadius: '50px', border: '2px solid #000',
            zIndex: 3, position: 'relative'
          }}>
            <span style={{ color: '#000', fontSize: '10px', fontWeight: 800, letterSpacing: '1px' }}>REGISTERED</span>
          </div>
        </>
      )}

      <h1 style={{ margin: '16px 0 0 0', fontSize: '26px', fontWeight: 800, color: '#fff', textAlign: 'center' }}>
        {competitionTitle}
      </h1>
      <p style={{ margin: '8px 0 0 0', color: '#a1a1aa', fontSize: '14px', textAlign: 'center', marginBottom: '12px', padding: '0 20px' }}>
        Your registration is confirmed.
      </p>
    </div>
  )

  const rightContent = (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', maxWidth: isMobile ? 'none' : '500px', margin: isMobile ? '0' : '0 auto' }}>
      {/* Registration Card */}
      <div style={{
        width: '100%',
        backgroundColor: '#1e1e1e',
        borderRadius: '20px',
        border: '1px solid rgba(255,255,255,0.05)',
        padding: '18px',
        marginBottom: '16px',
        boxSizing: 'border-box'
      }}>
        {/* Registration type */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '4px 0' }}>
          <div style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: '#27272a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {registrationType === 'team' ? <Users size={16} color="#818cf8" /> : <UserCheck size={16} color="#818cf8" />}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '10px', fontWeight: 600, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Type</div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginTop: '2px' }}>
              {registrationType === 'team' ? `Team — ${teamName || 'Your Team'}` : 'Individual Candidate (Solo)'}
            </div>
          </div>
          <div style={{ backgroundColor: 'rgba(52,211,153,0.12)', color: '#34d399', fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '8px' }}>
            CONFIRMED
          </div>
        </div>

        {/* Solo Candidate Profile Card */}
        {registrationType === 'individual' && (
          <>
            <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.05)', margin: '14px 0' }} />
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>Candidate Details</div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              backgroundColor: 'rgba(255,255,255,0.02)', padding: '12px 14px',
              borderRadius: '16px', border: '1px solid rgba(255,255,255,0.04)'
            }}>
              {candidateAvatar ? (
                <img src={candidateAvatar} alt="" style={{ width: 40, height: 40, borderRadius: 20, objectFit: 'cover' }} />
              ) : (
                <div style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '15px', fontWeight: 800, color: '#a78bfa' }}>
                    {(candidateName || 'C')[0].toUpperCase()}
                  </span>
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#e4e4e7', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{candidateName}</span>
                  <span style={{ backgroundColor: 'rgba(99,102,241,0.2)', color: '#a78bfa', fontSize: '9px', fontWeight: 800, padding: '2px 6px', borderRadius: '6px' }}>SOLO</span>
                </div>
                <div style={{ fontSize: '12px', color: '#71717a', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{candidateEmail}</div>
                {candidateCollege && (
                  <div style={{ fontSize: '11px', color: '#818cf8', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <GraduationCap size={12} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{candidateCollege}</span>
                  </div>
                )}
              </div>
              <CheckCircle2 size={18} color="#34d399" />
            </div>

            {hasFormResponse && (
              <div style={{
                marginTop: '12px',
                padding: '10px 12px',
                backgroundColor: 'rgba(52,211,153,0.06)',
                border: '1px solid rgba(52,211,153,0.2)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <FileText size={15} color="#34d399" />
                <span style={{ fontSize: '12px', color: '#34d399', fontWeight: 600 }}>Screening Application Form submitted</span>
              </div>
            )}
          </>
        )}

        {/* Invite code */}
        {inviteCode && (
          <>
            <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.05)', margin: '12px 0' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '4px 0' }}>
              <div style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: '#27272a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={16} color="#f59e0b" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '10px', fontWeight: 600, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Invite Code</div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#f59e0b', marginTop: '2px', letterSpacing: '2px' }}>
                  {inviteCode.toUpperCase()}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Team Members List */}
        {registrationType === 'team' && (
          <div style={{ marginTop: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#a1a1aa', marginBottom: '12px', marginTop: '10px' }}>Team Members</div>
            {loadingMembers ? (
              <div style={{ padding: '10px 0', textAlign: 'center' }}><Loader2 className="spin" size={20} color="#10b981" /></div>
            ) : members.length > 0 ? (
              members.map((member, idx) => (
                <div key={member.id || idx} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  backgroundColor: 'rgba(255,255,255,0.02)', padding: '12px',
                  borderRadius: '16px', marginBottom: '8px',
                  border: '1px solid rgba(255,255,255,0.04)'
                }}>
                  {member.user?.profile_avatar ? (
                    <img src={member.user.profile_avatar} alt="avatar" style={{ width: 36, height: 36, borderRadius: 18, objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '14px', fontWeight: 800, color: '#a1a1aa' }}>
                        {(member.user?.name || 'M')[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#e4e4e7' }}>{member.user?.name}</span>
                      {member.team_role === 'leader' && (
                        <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '6px' }}>
                          <span style={{ fontSize: '9px', fontWeight: 800, color: '#d4d4d8' }}>LEADER</span>
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: '11px', color: '#71717a' }}>{member.user?.email}</span>
                  </div>
                  <CheckCircle2 size={16} color="#34d399" />
                </div>
              ))
            ) : (
              <div style={{ fontSize: '13px', color: '#71717a', fontStyle: 'italic' }}>No members found</div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <Link to={`/competition/${id}`} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          padding: '15px', borderRadius: '50px',
          background: 'linear-gradient(90deg, #8b5cf6, #6366f1)',
          color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: '16px'
        }}>
          View Competition <ArrowRight size={16} />
        </Link>
        <Link to="/dashboard" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          padding: '14px', borderRadius: '50px',
          backgroundColor: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.06)',
          color: '#a1a1aa', textDecoration: 'none', fontWeight: 600, fontSize: '15px'
        }}>
          <Home size={16} /> Go to Dashboard
        </Link>
      </div>
    </div>
  )

  if (!isMobile) {
    return (
      <>
        <Helmet><title>Registration Success | PLUTO</title></Helmet>
        <div className="crd-wrapper" style={{ zIndex: 10 }}>
          <div className="crd-container">
            <div className="crd-left" style={{ alignItems: 'center', justifyContent: 'center', padding: '40px', overflowX: 'hidden' }}>
              {leftContent}
            </div>
            <div className="crd-right" style={{ padding: '40px 40px 60px 40px' }}>
              {rightContent}
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      <Helmet><title>Registration Success | PLUTO</title></Helmet>
      <div className="hide-scrollbar" style={{
        height: 'calc(100vh - 70px)',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        padding: '80px 1rem 40px',
      }}>
        <div style={{
          maxWidth: '500px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
          margin: '0 auto',
        }}>
          {leftContent}
          {rightContent}
        </div>
      </div>
    </>
  )
}
