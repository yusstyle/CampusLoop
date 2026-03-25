import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type MessageResponse, type CreateMessageRequest } from "@shared/schema";

export function useMessages(channelId: number) {
  const url = buildUrl(api.messages.list.path, { channelId });
  return useQuery({
    queryKey: [url],
    queryFn: async () => {
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch messages");
      return (await res.json()) as MessageResponse[];
    },
    enabled: !!channelId,
    refetchInterval: 3000, // Poor man's real-time for MVP
  });
}

export function useCreateMessage(channelId: number) {
  const queryClient = useQueryClient();
  const url = buildUrl(api.messages.create.path, { channelId });
  
  return useMutation({
    mutationFn: async (data: CreateMessageRequest) => {
      const res = await fetch(url, {
        method: api.messages.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to send message");
      return (await res.json()) as MessageResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [buildUrl(api.messages.list.path, { channelId })] });
    },
  });
}
