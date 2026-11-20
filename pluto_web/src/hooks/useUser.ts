/**
 * useUser.ts — React Query hooks for user settings & payment
 * Wraps userService.ts
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userService } from '@/services/userService'
import type { UserSettings } from '@/services/userService'

export function useUserSettings() {
  return useQuery({
    queryKey: ['user', 'settings'],
    queryFn: () => userService.getSettings(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

export function useSaveSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (settings: Partial<UserSettings>) => userService.saveSettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'settings'] })
    },
  })
}

export function usePaymentDetails() {
  return useQuery({
    queryKey: ['user', 'payment'],
    queryFn: () => userService.getPaymentDetails(),
    staleTime: 10 * 60 * 1000,
  })
}

export function useSavePaymentDetails() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payment: Parameters<typeof userService.savePaymentDetails>[0]) =>
      userService.savePaymentDetails(payment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'payment'] })
    },
  })
}

export function usePromoteToOrganizer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => userService.promoteToOrganizer(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] })
    },
  })
}
