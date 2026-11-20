/**
 * useCompetitions.ts — React Query hooks for competitions (Web)
 * Standalone — does NOT touch useEvents.ts.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { competitionService } from '@/services/competitionService'
import type { CompetitionCreate } from '@/types'

export function useCreateCompetition() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CompetitionCreate) => competitionService.createCompetition(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitions'] })
    },
  })
}

export function useUpdateCompetition() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CompetitionCreate> }) => competitionService.updateCompetition(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['competitions'] })
      queryClient.invalidateQueries({ queryKey: ['competitions', variables.id] })
    },
  })
}

export function useCompetition(id?: string) {
  return useQuery({
    queryKey: ['competitions', id],
    queryFn: () => competitionService.getCompetitionById(id!),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  })
}

export function useOrganizerCompetitions(userId?: string) {
  return useQuery({
    queryKey: ['competitions', 'organizer', userId],
    queryFn: () => competitionService.getCompetitionsByOrganizer(userId!),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  })
}

export function useCompetitions() {
  return useQuery({
    queryKey: ['competitions', 'approved'],
    queryFn: () => competitionService.getApprovedCompetitions(),
    staleTime: 2 * 60 * 1000,
  })
}

export function useCollegeCompetitions(collegeId?: string) {
  return useQuery({
    queryKey: ['competitions', 'college', collegeId],
    queryFn: () => competitionService.getCompetitionsByCollege(collegeId!),
    enabled: !!collegeId,
    staleTime: 2 * 60 * 1000,
  })
}

export function useDeleteCompetition() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => competitionService.deleteCompetition(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitions'] })
    },
  })
}
