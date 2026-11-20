import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { competitionRegistrationService } from '@/services/competitionRegistrationService';
import { useCompetition } from '@/hooks/useCompetitions';
import {
  useRegisterIndividual, useCreateTeamAndRegister, useJoinTeamByCode,
  useCompRegistration, useRegistrationCount, useMyJoinRequests,
  useOpenTeams, useSendJoinRequest, useAddMember, useImportTeamBuilderTeam,
  useRemoveMember, useUpdateTeamDetails, useFinalizeTeamRegistration
} from '@/hooks/useCompetitionRegistrations';
import { useMyCreatedTeams } from '@/hooks/usePortfolio';
import type { CustomFormConfig } from '@/types/form';

export function calculateBreakdown(entryFee: number, memberCount: number = 1) {
  const isFree = entryFee === 0;
  const totalEntry = entryFee * memberCount;
  const platformFee = isFree ? 0 : Number((totalEntry * 0.025).toFixed(2));
  const total = totalEntry + platformFee;
  return { entryFee, totalEntry, platformFee, total, isFree };
}

export function getOrdinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function useCompetitionRegistrationLogic() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  
  const urlMode = new URLSearchParams(window.location.search).get('mode') as any;
  const initialInviteCode = new URLSearchParams(window.location.search).get('inviteCode');
  
  const competitionId = id;
  const { data: comp, isLoading: loading } = useCompetition(competitionId);
  const { data: existingReg, isLoading: checkingReg } = useCompRegistration(competitionId);
  
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  
  const isIndividualOnly = Boolean(
    comp && (comp.registration_type === 'individual' || (comp.team_size_max ?? 1) <= 1)
  );

  const [flowMode, setFlowMode] = useState<'create' | 'join' | 'existing' | 'individual' | null>(
    urlMode || (initialInviteCode ? 'join' : null)
  );

  // ── Create Team State ──
  const [teamName, setTeamName] = useState('');
  const [lookingForTeammates, setLookingForTeammates] = useState(true);
  const [addedMembers, setAddedMembers] = useState<any[]>([]);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchingMembers, setSearchingMembers] = useState(false);
  const [searchModalVisible, setSearchModalVisible] = useState(false);

  // ── Join Team State ──
  const [inviteCode, setInviteCode] = useState(initialInviteCode || '');
  const [teamPreview, setTeamPreview] = useState<any>(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [joinTab, setJoinTab] = useState<'browse' | 'code'>(initialInviteCode ? 'code' : 'browse');

  // ── Toast State ──
  const [toastMessage, setToastMessage] = useState('');
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  }, []);

  const draftTeamInviteCode = existingReg?.registration_type === 'team' ? ((existingReg as any)?.team?.invite_code || (existingReg as any)?.competition_teams?.invite_code) : undefined;
  
  const { data: draftTeam } = useQuery({
    queryKey: ['draft-team', draftTeamInviteCode, comp?.id],
    queryFn: () => competitionRegistrationService.getTeamByInviteCode(draftTeamInviteCode!, comp!.id),
    enabled: !!draftTeamInviteCode && !!comp?.id,
  });

  const isActualLeader = draftTeam ? draftTeam.leader_id === user?.id : existingReg?.team_role === 'leader';
  const isTeamLeaderView = existingReg && existingReg.registration_type === 'team' && isActualLeader;
  const isMemberView = existingReg && existingReg.registration_type === 'team' && !isActualLeader;
  const isFullyRegistered = ['registered', 'approved', 'complete', 'confirmed'].includes((existingReg?.team as any)?.status || existingReg?.status || '');
  const isPendingInvite = existingReg && existingReg.status === 'draft' && existingReg.verified === false && !isActualLeader;
  const draftMembers = draftTeam?.members || [];
  const allVerified = draftMembers.length > 0 && draftMembers.every((m: any) => m.verified !== false);

  // ── Custom Form States ──
  const [localFormResponse, setLocalFormResponse] = useState<any>(null);
  const customFormConfig: CustomFormConfig | null = (comp as any)?.custom_form || (comp as any)?.eligibility?.custom_form || null;
  const formResponse = localFormResponse || (draftTeam as any)?.submissions?.custom_form_response || (existingReg as any)?.submissions?.custom_form_response || null;
  const isFormSubmitted = !!formResponse;
  const [isFormFillModalOpen, setIsFormFillModalOpen] = useState(false);
  const [isFormPurposeModalOpen, setIsFormPurposeModalOpen] = useState(false);

  const { data: regCount } = useRegistrationCount(competitionId);
  const { data: openTeams, isLoading: loadingOpenTeams } = useOpenTeams(flowMode === 'join' ? competitionId : undefined);
  const { data: myJoinRequests } = useMyJoinRequests(flowMode === 'join' ? competitionId : undefined);
  const { data: myTeams, isLoading: loadingMyTeams } = useMyCreatedTeams(user?.id || '');
  
  const registerIndividual = useRegisterIndividual();
  const createTeamAndRegister = useCreateTeamAndRegister();
  const joinTeamByCode = useJoinTeamByCode();
  const sendJoinRequest = useSendJoinRequest();
  const addMember = useAddMember();
  const importTeamBuilder = useImportTeamBuilderTeam();
  const removeMember = useRemoveMember();
  const updateTeamDetails = useUpdateTeamDetails();
  const finalizeTeamRegistration = useFinalizeTeamRegistration();

  const [isExistingDraft, setIsExistingDraft] = useState(false);

  const hasUnsavedChanges = isExistingDraft && (
    teamName.trim() !== draftTeam?.name ||
    lookingForTeammates !== (draftTeam?.looking_for_teammates ?? true) ||
    addedMembers.some((m: any) => !m.registration_id) ||
    addedMembers.length !== draftMembers.length - 1
  );

  useEffect(() => {
    if (draftTeam && (isTeamLeaderView || isMemberView) && !isExistingDraft) {
      setFlowMode('create');
      setTeamName(draftTeam.name || '');
      setLookingForTeammates(draftTeam.looking_for_teammates ?? true);
      const membersToSet = (draftTeam.members || [])
        .filter((m: any) => m.user_id !== user?.id && m.user_id !== draftTeam.leader_id && m.team_role !== 'leader')
        .map((m: any) => ({
          ...(m.users || m.user),
          registration_id: m.id,
          verified: m.verified
        }));
      setAddedMembers(membersToSet);
      setIsExistingDraft(true);
    }
  }, [draftTeam, isTeamLeaderView, isMemberView, isExistingDraft, user?.id]);

  useEffect(() => {
    if (!checkingReg && existingReg === null) {
      setTeamName('');
      setLookingForTeammates(true);
      setAddedMembers([]);
      setIsExistingDraft(false);
      if (flowMode === 'create') setFlowMode(urlMode || (initialInviteCode ? 'join' : null));
    }
  }, [existingReg, checkingReg, urlMode, initialInviteCode, flowMode]);

  useEffect(() => {
    if (comp) {
      if (isIndividualOnly) {
        if (flowMode !== 'individual') setFlowMode('individual');
      } else if (!flowMode) {
        setFlowMode(urlMode || (comp.registration_type === 'individual' ? 'individual' : 'create'));
      }
    }
  }, [comp, isIndividualOnly, flowMode, urlMode]);

  const searchMembers = useCallback(async (query: string) => {
    const q = query.trim();
    if (q.length < 1) { setSearchResults([]); return; }
    setSearchingMembers(true);
    try {
      let queryBuilder = supabase
        .from('users')
        .select('id, name, email, profile_avatar, college_id, roles, admin_type, department, course, year')
        .or(`name.ilike.%${q}%,email.ilike.%${q}%`)
        .neq('id', user?.id || '')
        .limit(20);

      if (comp?.college_id && !comp?.is_universal) {
        queryBuilder = queryBuilder.eq('college_id', comp.college_id);
      }

      let { data, error } = await queryBuilder;

      if (error) {
        let fallbackBuilder = supabase
          .from('users')
          .select('id, name, email, profile_avatar, college_id, roles, admin_type, department, course, year')
          .or(`name.ilike."%${q}%",email.ilike."%${q}%"`)
          .neq('id', user?.id || '')
          .limit(20);

        if (comp?.college_id && !comp?.is_universal) {
          fallbackBuilder = fallbackBuilder.eq('college_id', comp.college_id);
        }

        const fallback = await fallbackBuilder;
        data = fallback.data;
      }

      // Check existing teams in this competition to mark members already registered as leaders
      const registeredLeaderIds = new Set<string>();
      if (competitionId) {
        const { data: teamsInComp } = await supabase
          .from('competition_teams')
          .select('leader_id')
          .eq('competition_id', competitionId);
        if (teamsInComp) {
          teamsInComp.forEach(t => { if (t.leader_id) registeredLeaderIds.add(t.leader_id); });
        }
      }

      const addedIds = new Set(addedMembers.map(m => m.id));
      const filtered = (data || []).filter((u: any) => {
        if (!u || !u.id) return false;
        if (u.id === user?.id) return false;
        if (addedIds.has(u.id)) return false;
        const roles = Array.isArray(u.roles) ? u.roles : [];
        if (roles.includes('admin') || roles.includes('college_admin')) return false;
        if (u.admin_type && ['super_admin', 'master_admin', 'dept_admin'].includes(u.admin_type)) return false;
        if (u.email?.endsWith('@admin.com')) return false;
        return true;
      }).map((u: any) => ({
        ...u,
        isAlreadyRegistered: registeredLeaderIds.has(u.id)
      }));
      setSearchResults(filtered);
    } catch (e) {
      console.error('searchMembers error:', e);
      setSearchResults([]);
    } finally {
      setSearchingMembers(false);
    }
  }, [addedMembers, user?.id, comp?.college_id, comp?.is_universal, competitionId]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      searchMembers(memberSearchQuery);
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [memberSearchQuery, searchMembers]);

  const lookupTeam = async () => {
    if (inviteCode.length < 4) return;
    setLookingUp(true);
    setError('');
    try {
      const { data, error } = await supabase.from('competition_teams').select('*, leader:leader_id(name, profile_avatar), members:competition_registrations(id, user_id, user:user_id(name, email))').eq('invite_code', inviteCode.toUpperCase()).single();
      if (error) throw new Error('Invalid invite code');
      setTeamPreview(data);
    } catch (e: any) { setError(e.message || 'Team not found'); setTeamPreview(null); }
    finally { setLookingUp(false); }
  };

  const handleIndividualRegister = async () => {
    if (!competitionId) return;
    setError('');

    if (customFormConfig && customFormConfig.fields && customFormConfig.fields.length > 0 && !isFormSubmitted) {
      setIsFormFillModalOpen(true);
      return;
    }

    setProcessing(true);
    try {
      if (comp!.entry_fee > 0) {
        const bd = calculateBreakdown(comp!.entry_fee, 1);
        navigate(`/payment/${competitionId}`, {
          state: {
            isCompetition: true,
            competitionId,
            competitionTitle: comp?.title,
            amount: bd.total,
            entryFee: bd.totalEntry,
            platformFee: bd.platformFee,
            registrationType: 'individual',
          }
        });
        return;
      }
      
      const paymentData = { entryFee: 0, paymentMethod: 'free' };
      const reg = await registerIndividual.mutateAsync({ competitionId, paymentData });
      queryClient.invalidateQueries({ queryKey: ['comp-registrations'] });
      navigate(`/competition/${competitionId}/registration-success`, {
        state: {
          competitionId,
          competitionTitle: comp?.title,
          registrationType: 'individual',
          competitionBanner: comp?.banner_url,
          registrationId: reg?.id,
          hasFormResponse: isFormSubmitted,
          participant: {
            name: user?.name,
            email: user?.email,
            avatar: (user as any)?.profile_avatar || (user as any)?.avatar_url,
            college: (user as any)?.college || (user as any)?.college_name || (user as any)?.college?.name,
          }
        }
      });
    } catch (err: any) { setError(err.message || 'Registration failed'); }
    finally { setProcessing(false); }
  };

  const handleCreateTeam = async () => {
    if (!competitionId || !teamName.trim()) { setError('Please enter a team name'); return; }
    setError('');

    // If competition has custom application form and it hasn't been submitted yet, prompt form popup
    if (customFormConfig && customFormConfig.fields && customFormConfig.fields.length > 0 && !isFormSubmitted) {
      setIsFormFillModalOpen(true);
      return;
    }

    setProcessing(true);
    try {
      const result = await createTeamAndRegister.mutateAsync({ competitionId, teamName: teamName.trim() });
      const newTeamId = result.team.id;
      if (addedMembers.length > 0) {
        for (const m of addedMembers) {
          try {
            await competitionRegistrationService.addMemberToTeam(competitionId, newTeamId, m.id);
          } catch (addErr: any) {
            const isDup = addErr.message?.includes('competition_registrations_competition_id_user_id_key') ||
              addErr.message?.includes('already registered') ||
              addErr.message?.includes('already leading');
            const msg = isDup
              ? `${m.name || 'Candidate'} is already registered for this competition (in another team or as an individual).`
              : (addErr.message || 'Failed to add member');
            throw new Error(msg);
          }
        }
      }
      if (!lookingForTeammates) {
        await competitionRegistrationService.updateTeamDetails(newTeamId, { lookingForTeammates: false });
      }
      queryClient.invalidateQueries({ queryKey: ['comp-registrations'] });
      showToast('Team created successfully!');
    } catch (err: any) { setError(err.message || 'Failed to create team'); }
    finally { setProcessing(false); }
  };

  const handleFormSubmit = async (answers: Record<string, any>) => {
    if (!competitionId) return;
    setProcessing(true);
    setError('');
    try {
      // If already registered (individual or team), update form responses directly
      if (existingReg?.id || isFullyRegistered) {
        const teamId = existingReg?.team_id || (existingReg?.team as any)?.id || draftTeam?.id;
        const saved = await competitionRegistrationService.saveFormResponse({
          competitionId,
          registrationId: existingReg?.id,
          teamId,
          answers,
          formConfig: customFormConfig,
        });
        setLocalFormResponse(saved || { answers });
        setIsFormFillModalOpen(false);
        queryClient.invalidateQueries({ queryKey: ['comp-registrations'] });
        queryClient.invalidateQueries({ queryKey: ['draft-team'] });
        showToast('Application responses updated!');
        return;
      }

      if (flowMode === 'individual') {
        const fee = Number(comp?.entry_fee) || 0;
        if (fee > 0) {
          const saved = await competitionRegistrationService.saveFormResponse({
            competitionId,
            answers,
            formConfig: customFormConfig,
          });
          setLocalFormResponse(saved || { answers });
          setIsFormFillModalOpen(false);
          const bd = calculateBreakdown(fee, 1);
          navigate(`/payment/${competitionId}`, {
            state: {
              isCompetition: true,
              competitionId,
              competitionTitle: comp?.title,
              amount: bd.total,
              entryFee: bd.totalEntry,
              platformFee: bd.platformFee,
              registrationType: 'individual',
            }
          });
          return;
        }
        const paymentData = { entryFee: 0, paymentMethod: 'free' };
        const reg = await registerIndividual.mutateAsync({ competitionId, paymentData });
        const saved = await competitionRegistrationService.saveFormResponse({
          competitionId,
          registrationId: reg?.id,
          answers,
          formConfig: customFormConfig,
        });
        setLocalFormResponse(saved || { answers });
        setIsFormFillModalOpen(false);
        queryClient.invalidateQueries({ queryKey: ['comp-registrations'] });
        navigate(`/competition/${competitionId}/registration-success`, {
          state: {
            competitionId,
            competitionTitle: comp?.title,
            registrationType: 'individual',
            competitionBanner: comp?.banner_url,
            registrationId: reg?.id,
            hasFormResponse: true,
            participant: {
              name: user?.name,
              email: user?.email,
              avatar: (user as any)?.profile_avatar || (user as any)?.avatar_url,
              college: (user as any)?.college || (user as any)?.college_name || (user as any)?.college?.name,
            }
          }
        });
        return;
      }

      if (draftTeam?.id) {
        // Team exists in draft, save answers
        const saved = await competitionRegistrationService.saveFormResponse({
          competitionId,
          teamId: draftTeam.id,
          registrationId: existingReg?.id,
          answers,
          formConfig: customFormConfig,
        });
        setLocalFormResponse(saved || { answers });
        setIsFormFillModalOpen(false);
        queryClient.invalidateQueries({ queryKey: ['draft-team'] });
        queryClient.invalidateQueries({ queryKey: ['comp-registrations'] });
        showToast('Application details updated!');
      } else {
        // First-time create team from form
        if (!teamName.trim()) {
          setError('Please enter a team name');
          setIsFormFillModalOpen(false);
          return;
        }
        const result = await createTeamAndRegister.mutateAsync({ competitionId, teamName: teamName.trim() });
        const newTeamId = result.team.id;

        const saved = await competitionRegistrationService.saveFormResponse({
          competitionId,
          teamId: newTeamId,
          registrationId: result.registration.id,
          answers,
          formConfig: customFormConfig,
        });
        setLocalFormResponse(saved || { answers });

        if (addedMembers.length > 0) {
          for (const m of addedMembers) {
            await competitionRegistrationService.addMemberToTeam(competitionId, newTeamId, m.id);
          }
        }
        if (!lookingForTeammates) {
          await competitionRegistrationService.updateTeamDetails(newTeamId, { lookingForTeammates: false });
        }
        setIsFormFillModalOpen(false);
        queryClient.invalidateQueries({ queryKey: ['comp-registrations'] });
        queryClient.invalidateQueries({ queryKey: ['draft-team'] });
        showToast('Team created & application submitted!');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit application form');
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdateTeam = async () => {
    if (!draftTeam) return;
    setProcessing(true); setError('');
    try {
      if (teamName.trim() !== draftTeam.name || lookingForTeammates !== draftTeam.looking_for_teammates) {
        await updateTeamDetails.mutateAsync({ teamId: draftTeam.id, updates: { name: teamName.trim(), lookingForTeammates } });
      }
      const existingMembers = draftTeam.members?.filter((m: any) => m.team_role !== 'leader') || [];
      const addedIds = addedMembers.map(m => m.id);
      const toRemove = existingMembers.filter((m: any) => !addedIds.includes(m.user_id));
      for (const r of toRemove) {
        await removeMember.mutateAsync({ registrationId: r.id, teamId: draftTeam.id });
      }
      const existingIds = existingMembers.map((m: any) => m.user_id);
      const toAdd = addedMembers.filter(m => !existingIds.includes(m.id));
      for (const a of toAdd) {
        try {
          await addMember.mutateAsync({ competitionId: competitionId!, teamId: draftTeam.id, userId: a.id });
        } catch (addErr: any) {
          const isDup = addErr.message?.includes('competition_registrations_competition_id_user_id_key') ||
            addErr.message?.includes('already registered') ||
            addErr.message?.includes('already leading');
          const msg = isDup
            ? `${a.name || 'Candidate'} is already registered for this competition (in another team or as an individual).`
            : (addErr.message || 'Failed to add member');
          throw new Error(msg);
        }
      }
      showToast('Team updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['draft-team'] });
    } catch (err: any) { setError(err.message || 'Failed to update team'); }
    finally { setProcessing(false); }
  };

  const handleFinalizeRegistration = async () => {
    if (!draftTeam || !comp) return;
    setError('');

    if (customFormConfig && customFormConfig.fields && customFormConfig.fields.length > 0 && !isFormSubmitted) {
      setError('Please fill out and submit the required application form first.');
      setIsFormFillModalOpen(true);
      return;
    }
    
    if (addedMembers.length + 1 < (comp.team_size_min || 1)) {
      setError(`Minimum team size is ${comp.team_size_min}`); return;
    }
    if (!allVerified) {
      setError('All members must accept their invites first'); return;
    }
    
    setProcessing(true);
    try {
      if (comp.entry_fee > 0) {
        const bd = calculateBreakdown(comp.entry_fee, draftMembers.length);
        navigate(`/payment/${competitionId}`, {
          state: {
            isCompetition: true,
            competitionId,
            competitionTitle: comp.title,
            amount: bd.total,
            entryFee: bd.totalEntry,
            platformFee: bd.platformFee,
            registrationType: 'team',
            teamId: draftTeam.id,
            teamName: draftTeam.name,
            teamInviteCode: draftTeam.invite_code,
          }
        });
        return;
      } else {
        await finalizeTeamRegistration.mutateAsync({ teamId: draftTeam.id, paymentData: { entryFee: 0, paymentMethod: 'free' } });
      }
      navigate(`/competition/${competitionId}/registration-success`);
    } catch (err: any) { setError(err.message || 'Failed to finalize registration'); }
    finally { setProcessing(false); }
  };

  const handleCopyCode = () => {
    if (draftTeamInviteCode) {
      navigator.clipboard.writeText(draftTeamInviteCode);
      showToast('Invite code copied');
    }
  };

  const handleSendJoinRequest = async (teamId: string) => {
    setProcessing(true);
    try {
      await sendJoinRequest.mutateAsync({ competitionId: id!, teamId });
      showToast('Request sent!');
      queryClient.invalidateQueries({ queryKey: ['my-join-requests'] });
    } catch (e: any) {
      setError(e.message || 'Request failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleJoinByCode = async () => {
    setProcessing(true); setError('');
    try {
      await joinTeamByCode.mutateAsync({ competitionId: id!, inviteCode });
      navigate(`/competition/${id}/registration-success`);
    } catch (e: any) {
      setError(e.message || 'Join failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectInvite = async () => {
    setProcessing(true);
    try {
      await competitionRegistrationService.rejectInvite(existingReg!.id);
      setFlowMode(null); setTeamName(''); setAddedMembers([]); setIsExistingDraft(false);
      queryClient.invalidateQueries({ queryKey: ['comp-registrations'] }); navigate(-1);
    } catch (e: any) { alert(e.message); } finally { setProcessing(false); }
  };

  const handleAcceptInvite = async () => {
    setProcessing(true);
    try {
      await competitionRegistrationService.verifyRegistration(existingReg!.id);
      queryClient.invalidateQueries({ queryKey: ['comp-registrations'] }); queryClient.invalidateQueries({ queryKey: ['draft-team'] });
    } catch (e: any) { alert(e.message); } finally { setProcessing(false); }
  };

  const handleImportTeam = async (teamBuilderId: string) => {
    if (!competitionId) return;
    setProcessing(true);
    try {
      await importTeamBuilder.mutateAsync({ competitionId, teamBuilderId });
      showToast('Team imported!');
    } catch (err: any) { setError(err.message || 'Failed to import team'); }
    finally { setProcessing(false); }
  };

  return {
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
  };
}
