/**
 * React Query hooks for the organizer payout system.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchPayoutSummary,
  fetchPayoutTransactions,
  fetchPayoutHistory,
  requestPayout,
} from '@/services/payoutService'

// ── Summary (3 metric cards + bank status) ───────────────────
export function usePayoutSummary(userEmail: string | undefined) {
  return useQuery({
    queryKey: ['payout-summary', userEmail],
    queryFn: () => fetchPayoutSummary(userEmail!),
    enabled: !!userEmail,
    refetchInterval: 30_000,  // refresh every 30s
    staleTime: 10_000,
  })
}

// ── Transaction Ledger (booking_financials) ──────────────────
export function usePayoutTransactions(userEmail: string | undefined) {
  return useQuery({
    queryKey: ['payout-transactions', userEmail],
    queryFn: () => fetchPayoutTransactions(userEmail!),
    enabled: !!userEmail,
    staleTime: 15_000,
    select: (data) => data.transactions,
  })
}

// ── Payout History (actual bank transfers) ───────────────────
export function usePayoutHistory(userEmail: string | undefined) {
  return useQuery({
    queryKey: ['payout-history', userEmail],
    queryFn: () => fetchPayoutHistory(userEmail!),
    enabled: !!userEmail,
    staleTime: 15_000,
    select: (data) => data.payouts,
  })
}

// ── Request Withdrawal Mutation ──────────────────────────────
export function useRequestPayout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userEmail: string) => requestPayout(userEmail),
    onSuccess: (_data, userEmail) => {
      // Invalidate all payout queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ['payout-summary', userEmail] })
      queryClient.invalidateQueries({ queryKey: ['payout-transactions', userEmail] })
      queryClient.invalidateQueries({ queryKey: ['payout-history', userEmail] })
    },
  })
}
