import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { type MaterialResponse, type CreateMaterialRequest } from "@shared/schema";

export function useMaterials(channelId?: number) {
  return useQuery({
    queryKey: [api.materials.list.path, channelId],
    queryFn: async () => {
      const url = new URL(api.materials.list.path, window.location.origin);
      if (channelId) url.searchParams.set("channelId", channelId.toString());
      
      const res = await fetch(url.toString(), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch materials");
      return (await res.json()) as MaterialResponse[];
    },
  });
}

export function useCreateMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateMaterialRequest) => {
      const res = await fetch(api.materials.create.path, {
        method: api.materials.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to upload material");
      return (await res.json()) as MaterialResponse;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.materials.list.path] }),
  });
}
