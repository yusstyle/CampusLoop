import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type ChannelResponse, type CreateChannelRequest } from "@shared/schema";

export function useChannels() {
  return useQuery({
    queryKey: [api.channels.list.path],
    queryFn: async () => {
      const res = await fetch(api.channels.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch channels");
      return (await res.json()) as ChannelResponse[];
    },
  });
}

export function useChannel(id: number) {
  return useQuery({
    queryKey: [api.channels.get.path, id],
    queryFn: async () => {
      const res = await fetch(buildUrl(api.channels.get.path, { id }), { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch channel");
      return (await res.json()) as ChannelResponse;
    },
    enabled: !!id,
  });
}

export function useCreateChannel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateChannelRequest) => {
      const res = await fetch(api.channels.create.path, {
        method: api.channels.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create channel");
      return (await res.json()) as ChannelResponse;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.channels.list.path] }),
  });
}

export function useJoinChannel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(buildUrl(api.channels.join.path, { id }), {
        method: api.channels.join.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to join channel");
      return (await res.json());
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: [api.channels.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.channels.get.path, id] });
    },
  });
}
