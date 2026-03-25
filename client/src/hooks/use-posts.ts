import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type PostResponse, type CreatePostRequest, type CommentResponse, type CreateCommentRequest } from "@shared/schema";

export function usePosts() {
  return useQuery({
    queryKey: [api.posts.list.path],
    queryFn: async () => {
      const res = await fetch(api.posts.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch posts");
      return (await res.json()) as PostResponse[];
    },
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreatePostRequest) => {
      const res = await fetch(api.posts.create.path, {
        method: api.posts.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create post");
      return (await res.json()) as PostResponse;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.posts.list.path] }),
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, data }: { postId: number; data: CreateCommentRequest }) => {
      const url = buildUrl(api.comments.create.path, { postId });
      const res = await fetch(url, {
        method: api.comments.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create comment");
      return (await res.json()) as CommentResponse;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.posts.list.path] }),
  });
}
