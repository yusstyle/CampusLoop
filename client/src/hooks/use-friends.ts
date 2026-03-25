import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

export function useFriendRequests() {
  return useQuery({
    queryKey: [api.friends.getPending.path],
    queryFn: async () => {
      const res = await fetch(api.friends.getPending.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch friend requests");
      return res.json();
    },
  });
}

export function useSendFriendRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(buildUrl(api.friends.send.path, { userId }), {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to send friend request");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.friends.getPending.path] }),
  });
}

export function useAcceptFriendRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (requestId: number) => {
      const res = await fetch(buildUrl(api.friends.accept.path, { requestId }), {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to accept friend request");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.friends.getPending.path] }),
  });
}

export function useRejectFriendRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (requestId: number) => {
      const res = await fetch(buildUrl(api.friends.reject.path, { requestId }), {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to reject friend request");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.friends.getPending.path] }),
  });
}
