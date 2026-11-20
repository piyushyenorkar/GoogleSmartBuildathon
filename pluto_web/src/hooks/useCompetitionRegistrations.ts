/**
 * useCompetitionRegistrations.ts — React Query hooks for competition registrations (Web)
 * Standalone — does NOT touch useBookings.ts.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { competitionRegistrationService } from '@/services/competitionRegistrationService'

// ─── Queries ─────────────────────────────────────────────────────────────────

export function useMyCompRegistrations() {
  return useQuery({
    queryKey: ['comp-registrations', 'mine'],
    queryFn: () => competitionRegistrationService.getMyRegistrations(),
    staleTime: 2 * 60 * 1000,
  })
}

export function useCompRegistration(competitionId?: string) {
  return useQuery({
    queryKey: ['comp-registrations', 'mine', competitionId],
    queryFn: () => competitionRegistrationService.getMyRegistrationForCompetition(competitionId!),
    enabled: !!competitionId,
    staleTime: 60 * 1000,
  })
}

export function useCompParticipants(competitionId?: string) {
  return useQuery({
    queryKey: ['comp-registrations', 'participants', competitionId],
    queryFn: () => competitionRegistrationService.getCompetitionParticipants(competitionId!),
    enabled: !!competitionId,
    staleTime: 60 * 1000,
  })
}

export function useCompetitionsRegistrations(competitionIds: string[]) {
  return useQuery({
    queryKey: ['comp-registrations', 'bulk', ...competitionIds],
    queryFn: () => competitionRegistrationService.getRegistrationsByCompetitions(competitionIds),
    enabled: competitionIds.length > 0,
    staleTime: 60 * 1000,
  })
}

export function useCompTeams(competitionId?: string) {
  return useQuery({
    queryKey: ['comp-teams', competitionId],
    queryFn: () => competitionRegistrationService.getCompetitionTeams(competitionId!),
    enabled: !!competitionId,
    staleTime: 60 * 1000,
  })
}

export function useRegistrationCount(competitionId?: string) {
  return useQuery({
    queryKey: ['comp-registrations', 'count', competitionId],
    queryFn: () => competitionRegistrationService.getRegistrationCount(competitionId!),
    enabled: !!competitionId,
    staleTime: 30 * 1000,
  })
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export function useRegisterIndividual() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (args: { competitionId: string; paymentData?: { entryFee?: number; paymentMethod?: string; paymentReference?: string } }) =>
      competitionRegistrationService.registerIndividual(args.competitionId, args.paymentData),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comp-registrations'] })
    },
  })
}

export function useCreateTeamAndRegister() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (args: { competitionId: string; teamName: string }) =>
      competitionRegistrationService.createTeamAndRegister(args.competitionId, args.teamName),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comp-registrations'] })
      qc.invalidateQueries({ queryKey: ['comp-teams'] })
    },
  })
}

export function useJoinTeamByCode() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (args: { competitionId: string; inviteCode: string }) =>
      competitionRegistrationService.joinTeamByCode(args.competitionId, args.inviteCode),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comp-registrations'] })
      qc.invalidateQueries({ queryKey: ['comp-teams'] })
    },
  })
}

export function useWithdrawRegistration() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => competitionRegistrationService.withdrawRegistration(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comp-registrations'] })
    },
  })
}

export function useUpdateParticipantStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (args: { registrationId: string; status: 'registered' | 'confirmed' | 'shortlisted' | 'eliminated' | 'winner'; currentStage?: number }) =>
      competitionRegistrationService.updateParticipantStatus(args.registrationId, args.status, args.currentStage),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comp-registrations'] })
    },
  })
}

export function useBulkUpdateStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (args: { competitionId: string; registrationIds: string[]; status: 'shortlisted' | 'eliminated' | 'winner'; nextStage?: number }) =>
      competitionRegistrationService.bulkUpdateStatus(args.competitionId, args.registrationIds, args.status, args.nextStage),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comp-registrations'] })
    },
  })
}

export function useOpenTeams(competitionId?: string) {
  return useQuery({
    queryKey: ['comp-teams', 'open', competitionId],
    queryFn: () => competitionRegistrationService.getOpenTeams(competitionId!),
    enabled: !!competitionId,
    staleTime: 30 * 1000,
  })
}

export function useSendJoinRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (args: { competitionId: string; teamId: string; message?: string }) =>
      competitionRegistrationService.sendJoinRequest(args.competitionId, args.teamId, args.message),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comp-teams'] })
      qc.invalidateQueries({ queryKey: ['join-requests'] })
    },
  })
}

export function useMyJoinRequests(competitionId?: string) {
  return useQuery({
    queryKey: ['join-requests', 'mine', competitionId],
    queryFn: () => competitionRegistrationService.getMyJoinRequests(competitionId!),
    enabled: !!competitionId,
    staleTime: 30 * 1000,
  })
}

export function useTeamJoinRequests(teamId?: string) {
  return useQuery({
    queryKey: ['join-requests', 'team', teamId],
    queryFn: () => competitionRegistrationService.getTeamJoinRequests(teamId!),
    enabled: !!teamId,
    staleTime: 30 * 1000,
  })
}

export function useRespondToJoinRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (args: { requestId: string; approve: boolean }) =>
      competitionRegistrationService.respondToJoinRequest(args.requestId, args.approve),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comp-registrations'] })
      qc.invalidateQueries({ queryKey: ['comp-teams'] })
      qc.invalidateQueries({ queryKey: ['join-requests'] })
    },
  })
}

export function useAddMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (args: { competitionId: string; teamId: string; userId: string }) =>
      competitionRegistrationService.addMemberToTeam(args.competitionId, args.teamId, args.userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comp-registrations'] })
      qc.invalidateQueries({ queryKey: ['comp-teams'] })
    },
  })
}

export function useVerifyRegistration() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (registrationId: string) =>
      competitionRegistrationService.verifyRegistration(registrationId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comp-registrations'] })
      qc.invalidateQueries({ queryKey: ['pending-invites'] })
    },
  })
}

export function useImportTeamBuilderTeam() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (args: { competitionId: string; teamBuilderId: string }) =>
      competitionRegistrationService.importTeamBuilderTeam(args.competitionId, args.teamBuilderId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comp-registrations'] })
      qc.invalidateQueries({ queryKey: ['comp-teams'] })
    },
  })
}

export function useMyPendingInvites() {
  return useQuery({
    queryKey: ['pending-invites'],
    queryFn: () => competitionRegistrationService.getMyPendingInvites(),
    staleTime: 30 * 1000,
  })
}

export function useRemoveMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (args: { registrationId: string; teamId: string }) =>
      competitionRegistrationService.removeMemberFromTeam(args.registrationId, args.teamId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comp-registrations'] })
      qc.invalidateQueries({ queryKey: ['comp-teams'] })
    },
  })
}

export function useUpdateTeamDetails() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (args: { teamId: string; updates: { name?: string; lookingForTeammates?: boolean } }) =>
      competitionRegistrationService.updateTeamDetails(args.teamId, args.updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comp-teams'] })
      qc.invalidateQueries({ queryKey: ['draft-team'] })
    },
  })
}

export function useFinalizeTeamRegistration() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (args: { teamId: string; paymentData?: { entryFee?: number; paymentMethod?: string; paymentReference?: string } }) =>
      competitionRegistrationService.finalizeTeamRegistration(args.teamId, args.paymentData),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comp-registrations'] })
      qc.invalidateQueries({ queryKey: ['comp-teams'] })
      qc.invalidateQueries({ queryKey: ['draft-team'] })
    },
  })
}

export function useSubmitStageDeliverable() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      registrationType,
      id,
      stageIndex,
      submissionData
    }: {
      registrationType: 'individual' | 'team',
      id: string,
      stageIndex: number,
      submissionData: any
    }) => competitionRegistrationService.submitStageDeliverable(registrationType, id, stageIndex, submissionData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comp-registrations'] })
      queryClient.invalidateQueries({ queryKey: ['comp-teams'] })
    }
  })
}
