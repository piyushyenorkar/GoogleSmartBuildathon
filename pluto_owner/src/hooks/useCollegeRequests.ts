import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchCollegeRequests,
  fetchAllColleges,
  approveCollegeRequest,
  rejectCollegeRequest,
} from '@/services/plutoHQService'

export function useCollegeRequests(status?: string) {
  return useQuery({
    queryKey: ['pluto-hq', 'college-requests', status],
    queryFn: () => fetchCollegeRequests(status),
    staleTime: 15_000,
    select: (data) => data.requests,
  })
}

export function useAllColleges() {
  return useQuery({
    queryKey: ['pluto-hq', 'colleges'],
    queryFn: fetchAllColleges,
    staleTime: 30_000,
    select: (data) => data.colleges,
  })
}

export function useApproveCollege() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => approveCollegeRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pluto-hq', 'college-requests'] })
      queryClient.invalidateQueries({ queryKey: ['pluto-hq', 'colleges'] })
      queryClient.invalidateQueries({ queryKey: ['pluto-hq', 'overview'] })
    },
  })
}

export function useRejectCollege() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => rejectCollegeRequest(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pluto-hq', 'college-requests'] })
    },
  })
}
