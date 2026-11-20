import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchHQOverview,
  fetchHQOrganizers,
  fetchHQPayouts,
  processHQPayout,
  fetchHQRevenue,
} from '@/services/plutoHQService'

export function useHQOverview() {
  return useQuery({
    queryKey: ['pluto-hq', 'overview'],
    queryFn: fetchHQOverview,
    staleTime: 30_000,
    refetchInterval: 60_000,
  })
}

export function useHQOrganizers() {
  return useQuery({
    queryKey: ['pluto-hq', 'organizers'],
    queryFn: fetchHQOrganizers,
    staleTime: 30_000,
    select: (data) => data.organizers,
  })
}

export function useHQPayouts(status?: string) {
  return useQuery({
    queryKey: ['pluto-hq', 'payouts', status],
    queryFn: () => fetchHQPayouts(status),
    staleTime: 15_000,
    select: (data) => data.payouts,
  })
}

export function useProcessPayout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ payoutId, ...data }: {
      payoutId: string
      action: 'approve' | 'complete' | 'reject'
      referenceNumber?: string
      failureReason?: string
    }) => processHQPayout(payoutId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pluto-hq'] })
    },
  })
}

export function useHQRevenue() {
  return useQuery({
    queryKey: ['pluto-hq', 'revenue'],
    queryFn: fetchHQRevenue,
    staleTime: 30_000,
  })
}
