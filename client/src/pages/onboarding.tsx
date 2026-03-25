import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Building2, BookOpen, Layers, CheckCircle2 } from "lucide-react";
import { useLocation } from "wouter";

type University = { id: number; name: string; description?: string };
type Faculty = { id: number; name: string; universityId: number };
type Department = { id: number; name: string; facultyId: number };

export default function Onboarding() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [selectedUniversity, setSelectedUniversity] = useState<University | null>(null);
  const [selectedFaculty, setSelectedFaculty] = useState<Faculty | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);

  const { data: universities = [], isLoading: loadingUnis } = useQuery<University[]>({
    queryKey: ["/api/admin/universities"],
    queryFn: async () => {
      const res = await fetch("/api/admin/universities", { credentials: "include" });
      return res.json();
    },
  });

  const { data: faculties = [], isLoading: loadingFacs } = useQuery<Faculty[]>({
    queryKey: ["/api/admin/faculties", selectedUniversity?.id],
    queryFn: async () => {
      const res = await fetch(`/api/admin/faculties/${selectedUniversity!.id}`, { credentials: "include" });
      return res.json();
    },
    enabled: !!selectedUniversity,
  });

  const { data: departments = [], isLoading: loadingDepts } = useQuery<Department[]>({
    queryKey: ["/api/admin/departments", selectedFaculty?.id],
    queryFn: async () => {
      const res = await fetch(`/api/admin/departments/${selectedFaculty!.id}`, { credentials: "include" });
      return res.json();
    },
    enabled: !!selectedFaculty,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/users/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          universityId: selectedUniversity?.id,
          facultyId: selectedFaculty?.id,
          departmentId: selectedDepartment?.id,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      return res.json();
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(["/api/auth/user"], (old: any) => ({ ...old, ...updated }));
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Could not save your details. Please try again.", variant: "destructive" });
    },
  });

  const stepLabels = [
    { label: "University", icon: <Building2 className="w-4 h-4" /> },
    { label: "Faculty", icon: <BookOpen className="w-4 h-4" /> },
    { label: "Department", icon: <Layers className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 bg-primary rounded-2xl items-center justify-center mb-4">
            <span className="text-2xl font-black text-white">CL</span>
          </div>
          <h1 className="text-2xl font-bold">Welcome, {user?.firstName}!</h1>
          <p className="text-muted-foreground mt-1">Let's set up your profile so you can connect with your campus.</p>
        </div>

        {/* Step progress */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {stepLabels.map((s, i) => {
            const stepNum = i + 1;
            const done = step > stepNum;
            const active = step === stepNum;
            return (
              <div key={i} className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  done ? "bg-primary/20 text-primary" :
                  active ? "bg-primary text-white" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : s.icon}
                  {s.label}
                </div>
                {i < stepLabels.length - 1 && (
                  <div className={`w-6 h-0.5 rounded ${step > i + 1 ? "bg-primary" : "bg-border"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Card */}
        <div className="bg-card rounded-2xl border p-6 shadow-sm">
          {step === 1 && (
            <StepSection
              title="Select your university"
              description="Choose the university you attend or work at"
              loading={loadingUnis}
              empty={universities.length === 0}
              emptyMessage="No universities have been set up yet. Ask your admin to add your university."
            >
              {universities.map(u => (
                <SelectCard
                  key={u.id}
                  label={u.name}
                  description={u.description}
                  selected={selectedUniversity?.id === u.id}
                  onClick={() => setSelectedUniversity(u)}
                />
              ))}
            </StepSection>
          )}

          {step === 2 && (
            <StepSection
              title="Select your faculty"
              description={`Faculties at ${selectedUniversity?.name}`}
              loading={loadingFacs}
              empty={faculties.length === 0}
              emptyMessage="No faculties found for this university."
            >
              {faculties.map(f => (
                <SelectCard
                  key={f.id}
                  label={f.name}
                  selected={selectedFaculty?.id === f.id}
                  onClick={() => setSelectedFaculty(f)}
                />
              ))}
            </StepSection>
          )}

          {step === 3 && (
            <StepSection
              title="Select your department"
              description={`Departments in ${selectedFaculty?.name}`}
              loading={loadingDepts}
              empty={departments.length === 0}
              emptyMessage="No departments found for this faculty."
            >
              {departments.map(d => (
                <SelectCard
                  key={d.id}
                  label={d.name}
                  selected={selectedDepartment?.id === d.id}
                  onClick={() => setSelectedDepartment(d)}
                />
              ))}
            </StepSection>
          )}

          <div className="flex justify-between mt-6 pt-4 border-t gap-3">
            {step > 1 ? (
              <Button variant="outline" onClick={() => setStep(s => s - 1)}>
                Back
              </Button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <Button
                disabled={
                  (step === 1 && !selectedUniversity) ||
                  (step === 2 && !selectedFaculty)
                }
                onClick={() => setStep(s => s + 1)}
              >
                Continue
              </Button>
            ) : (
              <Button
                disabled={!selectedDepartment || saveMutation.isPending}
                onClick={() => saveMutation.mutate()}
              >
                {saveMutation.isPending ? "Saving..." : "Go to Dashboard"}
              </Button>
            )}
          </div>
        </div>

        <div className="text-center mt-4 space-y-1">
          <p className="text-xs text-muted-foreground">You can update this later from your profile settings</p>
          <button
            onClick={() => {
              if (user?.id) {
                localStorage.setItem(`onboarding-skipped-${user.id}`, "1");
                queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
              }
            }}
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}

function StepSection({
  title, description, loading, empty, emptyMessage, children,
}: {
  title: string;
  description?: string;
  loading: boolean;
  empty: boolean;
  emptyMessage: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold">{title}</h2>
      {description && <p className="text-muted-foreground text-sm mb-4">{description}</p>}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : empty ? (
        <p className="text-sm text-muted-foreground text-center py-6">{emptyMessage}</p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">{children}</div>
      )}
    </div>
  );
}

function SelectCard({
  label, description, selected, onClick,
}: {
  label: string;
  description?: string | null;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${
        selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
      }`}
    >
      <p className={`font-medium text-sm ${selected ? "text-primary" : "text-foreground"}`}>{label}</p>
      {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
    </button>
  );
}
