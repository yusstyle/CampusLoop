import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

export function useUniversities() {
  return useQuery({
    queryKey: [api.admin.universities.path],
    queryFn: async () => {
      const res = await fetch(api.admin.universities.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch universities");
      return res.json();
    },
  });
}

export function useCreateUniversity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      const res = await fetch(api.admin.createUniversity.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create university");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.admin.universities.path] }),
  });
}

export function useFaculties(universityId: number) {
  return useQuery({
    queryKey: [api.admin.faculties.path, universityId],
    queryFn: async () => {
      const res = await fetch(buildUrl(api.admin.faculties.path, { universityId }), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch faculties");
      return res.json();
    },
    enabled: !!universityId,
  });
}

export function useDepartments(facultyId: number) {
  return useQuery({
    queryKey: [api.admin.departments.path, facultyId],
    queryFn: async () => {
      const res = await fetch(buildUrl(api.admin.departments.path, { facultyId }), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch departments");
      return res.json();
    },
    enabled: !!facultyId,
  });
}
