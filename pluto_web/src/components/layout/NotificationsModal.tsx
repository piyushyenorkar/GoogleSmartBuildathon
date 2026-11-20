import { useEffect, useState } from 'react';
import { X, Bell, CheckCircle2, XCircle, ArrowRight, Calendar, MapPin, Users, Tag, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { competitionRegistrationService } from '@/services/competitionRegistrationService';
import { supabase } from '@/lib/supabase';
import './NotificationsModal.css';

interface NotificationsModalProps {
  open: boolean;
  onClose: () => void;
  isMobile?: boolean;
}

export function NotificationsModal({ open, onClose, isMobile = false }: NotificationsModalProps) {
  const [invites, setInvites] = useState<any[]>([]);
  const [joinRequests, setJoinRequests] = useState<any[]>([]);
  const [generalNotifications, setGeneralNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchData = async () => {
    if (!open) return;
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const [invData, reqData, notifRes] = await Promise.all([
        competitionRegistrationService.getPendingInvites(),
        competitionRegistrationService.getLeaderJoinRequests(),
        session?.user?.id 
          ? supabase.from('notifications').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }).limit(20)
          : Promise.resolve({ data: [] })
      ]);
      setInvites(invData || []);
      setJoinRequests(reqData || []);
      setGeneralNotifications(notifRes?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [open]);

  const handleAccept = async (id: string) => {
    setProcessingId(id);
    try {
      await competitionRegistrationService.verifyRegistration(id);
      setInvites(prev => prev.map(inv => inv.id === id ? { ...inv, actionStatus: 'accepted' } : inv));
    } catch (err: any) {
      alert(err.message || 'Failed to accept invitation');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setProcessingId(id);
    try {
      await competitionRegistrationService.rejectInvite(id);
      setInvites(prev => prev.map(inv => inv.id === id ? { ...inv, actionStatus: 'rejected' } : inv));
    } catch (err: any) {
      alert(err.message || 'Failed to reject invitation');
    } finally {
      setProcessingId(null);
    }
  };

  const handleAcceptJoinRequest = async (id: string) => {
    setProcessingId(id);
    try {
      await competitionRegistrationService.respondToJoinRequest(id, true);
      setJoinRequests(prev => prev.map(req => req.id === id ? { ...req, actionStatus: 'accepted' } : req));
    } catch (err: any) {
      alert(err.message || 'Failed to accept request');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectJoinRequest = async (id: string) => {
    setProcessingId(id);
    try {
      await competitionRegistrationService.respondToJoinRequest(id, false);
      setJoinRequests(prev => prev.map(req => req.id === id ? { ...req, actionStatus: 'rejected' } : req));
    } catch (err: any) {
      alert(err.message || 'Failed to reject request');
    } finally {
      setProcessingId(null);
    }
  };

  const handleView = (competitionId: string) => {
    onClose();
    navigate(`/competition/${competitionId}`);
  };

  const handleGeneralNotificationClick = async (notif: any) => {
    if (!notif.read) {
      await supabase.from('notifications').update({ read: true }).eq('id', notif.id);
      setGeneralNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
    }
    
    if (notif.data?.route) {
      onClose();
      navigate(notif.data.route);
    }
  };

  if (!open) return null;

  const allNotifications = [
    ...generalNotifications.map(n => ({ ...n, _type: 'general', _date: new Date(n.created_at).getTime() })),
    ...invites.map(i => ({ ...i, _type: 'invite', _date: new Date(i.created_at).getTime() })),
    ...joinRequests.map(r => ({ ...r, _type: 'joinRequest', _date: new Date(r.created_at || r.applied_at || 0).getTime() }))
  ].sort((a, b) => b._date - a._date);

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && <div className="nm-overlay" onClick={onClose} />}
      
      <div className={`nm-container ${isMobile ? 'nm-mobile' : 'nm-desktop'}`} onClick={e => e.stopPropagation()}>
        <div className="nm-header">
          <div className="nm-header-left">
            <div className="nm-icon-container">
              <Bell color="#fff" size={20} />
            </div>
            <span className="nm-title">Notifications</span>
          </div>
          {isMobile && (
            <button className="nm-close-btn" onClick={onClose}>
              <X color="#a1a1aa" size={20} />
            </button>
          )}
        </div>

        <div className="nm-content">
          {loading ? (
            <div className="nm-center-box">
              <Loader2 className="spin" color="#a78bfa" size={32} />
              <p className="nm-loading-text">Loading notifications...</p>
            </div>
          ) : allNotifications.length === 0 ? (
            <div className="nm-center-box">
              <Bell color="rgba(255,255,255,0.1)" size={48} />
              <p className="nm-empty-text">No new notifications</p>
              <p className="nm-empty-subtext">You're all caught up!</p>
            </div>
          ) : (
            <div className="nm-list">
              {allNotifications.map((notif) => {
                if (notif._type === 'general') {
                  return (
                    <div key={`gen-${notif.id}`} className="nm-card clickable" onClick={() => handleGeneralNotificationClick(notif)}>
                      <div className="nm-card-header" style={{ marginBottom: 0 }}>
                        <div className="nm-banner-placeholder" style={{ borderRadius: '50%' }}>
                          <Bell color="#a78bfa" size={20} />
                        </div>
                        <div className="nm-card-info">
                          <div className="nm-card-title-row">
                            <span className="nm-comp-title">{notif.title}</span>
                            {!notif.read && <div className="nm-unread-dot" />}
                          </div>
                          <p className="nm-invite-text">{notif.body}</p>
                        </div>
                      </div>
                    </div>
                  );
                }

                if (notif._type === 'invite') {
                  const invite = notif;
                  return (
                    <div key={`inv-${invite.id}`} className="nm-card">
                      <div className="nm-card-header">
                        {invite.competition?.banner_url ? (
                          <img src={invite.competition.banner_url} alt="" className="nm-banner" />
                        ) : (
                          <div className="nm-banner-placeholder" />
                        )}
                        <div className="nm-card-info">
                          <div className="nm-card-title-row">
                            <span className="nm-comp-title">{invite.competition?.title}</span>
                            {invite.competition?.category && (
                              <div className="nm-category-tag">{invite.competition.category}</div>
                            )}
                          </div>
                          <p className="nm-invite-text">
                            {invite.team?.leader?.name || 'Someone'} invited you to join team <strong>{invite.team?.name}</strong>
                          </p>
                        </div>
                      </div>
                      
                      <div className="nm-event-info-row">
                        <div className="nm-info-chip">
                          <Calendar size={12} color="#a1a1aa" />
                          <span>
                            {invite.competition?.registration_deadline 
                              ? new Date(invite.competition.registration_deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                              : 'No deadline'}
                          </span>
                        </div>
                        <div className="nm-info-chip">
                          <MapPin size={12} color="#a1a1aa" />
                          <span>{invite.competition?.is_online ? 'Online' : (invite.competition?.city || 'Venue')}</span>
                        </div>
                        <div className="nm-info-chip">
                          <Users size={12} color="#a1a1aa" />
                          <span>
                            {invite.competition?.team_size_min && invite.competition?.team_size_max 
                              ? (invite.competition.team_size_min === invite.competition.team_size_max 
                                  ? `${invite.competition.team_size_max}` 
                                  : `${invite.competition.team_size_min}-${invite.competition.team_size_max}`)
                              : 'Team'}
                          </span>
                        </div>
                        <div className="nm-info-chip">
                          <Tag size={12} color="#a1a1aa" />
                          <span>{invite.competition?.entry_fee > 0 ? `₹${invite.competition.entry_fee}` : 'Free'}</span>
                        </div>
                      </div>
                      
                      <div className="nm-card-actions">
                        <button className="nm-view-btn" onClick={() => handleView(invite.competition_id)} disabled={processingId === invite.id}>
                          View <ArrowRight size={14} color="#a1a1aa" />
                        </button>

                        <div className="nm-action-buttons">
                          {invite.actionStatus ? (
                            <div className={`nm-status-tag ${invite.actionStatus === 'accepted' ? 'accepted' : 'rejected'}`}>
                              {invite.actionStatus === 'accepted' ? <CheckCircle2 size={14} color="#34d399" /> : <XCircle size={14} color="#f87171" />}
                              <span>You {invite.actionStatus} the invite</span>
                            </div>
                          ) : (
                            <>
                              <button className="nm-reject-btn" onClick={() => handleReject(invite.id)} disabled={processingId === invite.id}>
                                {processingId === invite.id ? <Loader2 size={16} className="spin" color="#fff" /> : (
                                  <><XCircle size={16} color="#fff" /> Reject</>
                                )}
                              </button>
                              <button className="nm-accept-btn" onClick={() => handleAccept(invite.id)} disabled={processingId === invite.id}>
                                {processingId === invite.id ? <Loader2 size={16} className="spin" color="#fff" /> : (
                                  <><CheckCircle2 size={16} color="#fff" /> Accept</>
                                )}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }

                if (notif._type === 'joinRequest') {
                  const req = notif;
                  return (
                    <div key={`req-${req.id}`} className="nm-card">
                      <div className="nm-card-header">
                        {req.users?.profile_avatar ? (
                          <img src={req.users.profile_avatar} alt="" className="nm-banner" style={{ borderRadius: '50%' }} />
                        ) : (
                          <div className="nm-banner-placeholder" style={{ borderRadius: '50%' }}>
                            <Users size={20} color="#a78bfa" />
                          </div>
                        )}
                        <div className="nm-card-info">
                          <div className="nm-card-title-row">
                            <span className="nm-comp-title">{req.competition_teams?.name}</span>
                            <div className="nm-category-tag" style={{ color: '#34d399', backgroundColor: 'rgba(52,211,153,0.1)' }}>REQUEST</div>
                          </div>
                          <p className="nm-invite-text">
                            <strong>{req.users?.name || 'Someone'}</strong> requested to join your team for {req.competition_teams?.competitions?.title}
                          </p>
                        </div>
                      </div>
                      
                      <div className="nm-card-actions">
                        <button className="nm-view-btn" onClick={() => handleView(req.competition_id)} disabled={processingId === req.id}>
                          View Event <ArrowRight size={14} color="#a1a1aa" />
                        </button>

                        <div className="nm-action-buttons">
                          {req.actionStatus ? (
                            <div className={`nm-status-tag ${req.actionStatus === 'accepted' ? 'accepted' : 'rejected'}`}>
                              {req.actionStatus === 'accepted' ? <CheckCircle2 size={14} color="#34d399" /> : <XCircle size={14} color="#f87171" />}
                              <span>You {req.actionStatus} the request</span>
                            </div>
                          ) : (
                            <>
                              <button className="nm-reject-btn" onClick={() => handleRejectJoinRequest(req.id)} disabled={processingId === req.id}>
                                {processingId === req.id ? <Loader2 size={16} className="spin" color="#fff" /> : (
                                  <><XCircle size={16} color="#fff" /> Reject</>
                                )}
                              </button>
                              <button className="nm-accept-btn" onClick={() => handleAcceptJoinRequest(req.id)} disabled={processingId === req.id}>
                                {processingId === req.id ? <Loader2 size={16} className="spin" color="#fff" /> : (
                                  <><CheckCircle2 size={16} color="#fff" /> Accept</>
                                )}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }
                
                return null;
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
