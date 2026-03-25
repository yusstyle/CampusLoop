import { useState } from "react";
import { Plus, Users, Building2, BookOpen, Shield, Layers } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

type University = { id: number; name: string; description?: string };
type Faculty = { id: number; name: string; universityId: number; description?: string };
type Department = { id: number; name: string; facultyId: number; description?: string };
type User = { id: string; firstName: string; lastName: string; email: string; role: string; universityId?: number; matricNumber?: string };

export default function Admin() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("universities");

  if (user?.role !== "admin") {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 text-destructive/50 mx-auto mb-4" />
          <h1 className="text-2xl font-bold font-display">Access Denied</h1>
          <p className="text-muted-foreground mt-2">You do not have permission to access the admin dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-6 w-full">
      <div className="mb-8">
        <h1 className="text-4xl font-display font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage institutions, users, and platform settings</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 mb-8 w-full">
          <TabsTrigger value="universities" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            <span className="hidden sm:inline">Universities</span>
          </TabsTrigger>
          <TabsTrigger value="faculties" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Faculties</span>
          </TabsTrigger>
          <TabsTrigger value="departments" className="flex items-center gap-2">
            <Layers className="w-4 h-4" />
            <span className="hidden sm:inline">Departments</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Users</span>
          </TabsTrigger>
          <TabsTrigger value="verification" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Verify</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="universities"><UniversitiesTab /></TabsContent>
        <TabsContent value="faculties"><FacultiesTab /></TabsContent>
        <TabsContent value="departments"><DepartmentsTab /></TabsContent>
        <TabsContent value="users"><UsersTab /></TabsContent>
        <TabsContent value="verification" className="space-y-4">
          <h2 className="text-2xl font-bold font-display mb-4">Pending Verifications</h2>
          <Card>
            <CardHeader>
              <CardTitle>No pending verifications</CardTitle>
              <CardDescription>All users are verified</CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function UniversitiesTab() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const { data: universities = [], isLoading } = useQuery<University[]>({
    queryKey: ["/api/admin/universities"],
    queryFn: async () => {
      const res = await fetch("/api/admin/universities", { credentials: "include" });
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/universities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, description: description || undefined }),
      });
      if (!res.ok) throw new Error("Failed to create university");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/universities"] });
      toast({ title: "University added successfully" });
      setName(""); setDescription(""); setOpen(false);
    },
    onError: () => toast({ title: "Error", description: "Could not add university", variant: "destructive" }),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <h2 className="text-2xl font-bold font-display">Universities</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl" data-testid="button-add-university">
              <Plus className="w-4 h-4 mr-2" /> Add University
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add University</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Name *</Label>
                <Input data-testid="input-university-name" placeholder="e.g. Federal University of Technology" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Description</Label>
                <Input data-testid="input-university-description" placeholder="Brief description" value={description} onChange={e => setDescription(e.target.value)} />
              </div>
              <Button
                data-testid="button-submit-university"
                className="mt-2 rounded-xl"
                disabled={!name.trim() || createMutation.isPending}
                onClick={() => createMutation.mutate()}
              >
                {createMutation.isPending ? "Adding..." : "Add University"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map(i => <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : universities.length === 0 ? (
        <Card><CardHeader><CardTitle className="text-muted-foreground">No universities yet</CardTitle><CardDescription>Click "Add University" to create the first one.</CardDescription></CardHeader></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {universities.map(u => (
            <Card key={u.id} data-testid={`card-university-${u.id}`}>
              <CardHeader>
                <CardTitle>{u.name}</CardTitle>
                {u.description && <CardDescription>{u.description}</CardDescription>}
              </CardHeader>
              <CardContent>
                <Badge variant="secondary">ID: {u.id}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function FacultiesTab() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [selectedUniId, setSelectedUniId] = useState<number | null>(null);

  const { data: universities = [] } = useQuery<University[]>({
    queryKey: ["/api/admin/universities"],
    queryFn: async () => {
      const res = await fetch("/api/admin/universities", { credentials: "include" });
      return res.json();
    },
  });

  const { data: faculties = [], isLoading } = useQuery<Faculty[]>({
    queryKey: ["/api/admin/faculties", selectedUniId],
    queryFn: async () => {
      if (!selectedUniId) return [];
      const res = await fetch(`/api/admin/faculties/${selectedUniId}`, { credentials: "include" });
      return res.json();
    },
    enabled: !!selectedUniId,
  });

  const [formUniId, setFormUniId] = useState<number | "">("");

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/faculties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ universityId: Number(formUniId), name }),
      });
      if (!res.ok) throw new Error("Failed to create faculty");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/faculties"] });
      toast({ title: "Faculty added successfully" });
      setName(""); setFormUniId(""); setOpen(false);
    },
    onError: () => toast({ title: "Error", description: "Could not add faculty", variant: "destructive" }),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <h2 className="text-2xl font-bold font-display">Faculties</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl" data-testid="button-add-faculty">
              <Plus className="w-4 h-4 mr-2" /> Add Faculty
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Faculty</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>University *</Label>
                <select
                  data-testid="select-faculty-university"
                  className="border rounded-lg px-3 py-2 bg-background text-foreground"
                  value={formUniId}
                  onChange={e => setFormUniId(Number(e.target.value))}
                >
                  <option value="">Select University</option>
                  {universities.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div className="grid gap-2">
                <Label>Name *</Label>
                <Input data-testid="input-faculty-name" placeholder="e.g. Faculty of Engineering" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <Button
                data-testid="button-submit-faculty"
                className="mt-2 rounded-xl"
                disabled={!name.trim() || !formUniId || createMutation.isPending}
                onClick={() => createMutation.mutate()}
              >
                {createMutation.isPending ? "Adding..." : "Add Faculty"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-4">
        <Label className="mb-2 block">Filter by University</Label>
        <select
          data-testid="select-filter-university"
          className="border rounded-lg px-3 py-2 bg-background text-foreground"
          value={selectedUniId ?? ""}
          onChange={e => setSelectedUniId(e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">Select a university to view faculties</option>
          {universities.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
      </div>

      {!selectedUniId ? (
        <Card><CardHeader><CardTitle className="text-muted-foreground">Select a university above</CardTitle></CardHeader></Card>
      ) : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map(i => <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : faculties.length === 0 ? (
        <Card><CardHeader><CardTitle className="text-muted-foreground">No faculties yet</CardTitle><CardDescription>Click "Add Faculty" to add one.</CardDescription></CardHeader></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {faculties.map(f => (
            <Card key={f.id} data-testid={`card-faculty-${f.id}`}>
              <CardHeader>
                <CardTitle>{f.name}</CardTitle>
                <CardDescription>{universities.find(u => u.id === f.universityId)?.name}</CardDescription>
              </CardHeader>
              <CardContent><Badge variant="secondary">ID: {f.id}</Badge></CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function DepartmentsTab() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [selectedFacId, setSelectedFacId] = useState<number | null>(null);
  const [formFacId, setFormFacId] = useState<number | "">("");
  const [filterUniId, setFilterUniId] = useState<number | null>(null);

  const { data: universities = [] } = useQuery<University[]>({
    queryKey: ["/api/admin/universities"],
    queryFn: async () => {
      const res = await fetch("/api/admin/universities", { credentials: "include" });
      return res.json();
    },
  });

  const { data: filterFaculties = [] } = useQuery<Faculty[]>({
    queryKey: ["/api/admin/faculties", filterUniId],
    queryFn: async () => {
      if (!filterUniId) return [];
      const res = await fetch(`/api/admin/faculties/${filterUniId}`, { credentials: "include" });
      return res.json();
    },
    enabled: !!filterUniId,
  });

  const { data: formFaculties = [] } = useQuery<Faculty[]>({
    queryKey: ["/api/admin/faculties/form", filterUniId],
    queryFn: async () => {
      if (!filterUniId) return [];
      const res = await fetch(`/api/admin/faculties/${filterUniId}`, { credentials: "include" });
      return res.json();
    },
    enabled: !!filterUniId,
  });

  const { data: departments = [], isLoading } = useQuery<Department[]>({
    queryKey: ["/api/admin/departments", selectedFacId],
    queryFn: async () => {
      if (!selectedFacId) return [];
      const res = await fetch(`/api/admin/departments/${selectedFacId}`, { credentials: "include" });
      return res.json();
    },
    enabled: !!selectedFacId,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ facultyId: Number(formFacId), name }),
      });
      if (!res.ok) throw new Error("Failed to create department");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/departments"] });
      toast({ title: "Department added successfully" });
      setName(""); setFormFacId(""); setOpen(false);
    },
    onError: () => toast({ title: "Error", description: "Could not add department", variant: "destructive" }),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <h2 className="text-2xl font-bold font-display">Departments</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl" data-testid="button-add-department">
              <Plus className="w-4 h-4 mr-2" /> Add Department
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Department</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>University *</Label>
                <select
                  className="border rounded-lg px-3 py-2 bg-background text-foreground"
                  value={filterUniId ?? ""}
                  onChange={e => { setFilterUniId(Number(e.target.value)); setFormFacId(""); }}
                >
                  <option value="">Select University</option>
                  {universities.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div className="grid gap-2">
                <Label>Faculty *</Label>
                <select
                  data-testid="select-department-faculty"
                  className="border rounded-lg px-3 py-2 bg-background text-foreground"
                  value={formFacId}
                  onChange={e => setFormFacId(Number(e.target.value))}
                  disabled={!filterUniId}
                >
                  <option value="">Select Faculty</option>
                  {formFaculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
              <div className="grid gap-2">
                <Label>Name *</Label>
                <Input data-testid="input-department-name" placeholder="e.g. Computer Science" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <Button
                data-testid="button-submit-department"
                className="mt-2 rounded-xl"
                disabled={!name.trim() || !formFacId || createMutation.isPending}
                onClick={() => createMutation.mutate()}
              >
                {createMutation.isPending ? "Adding..." : "Add Department"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4 mb-4 flex-wrap">
        <div>
          <Label className="mb-2 block">Filter by University</Label>
          <select
            className="border rounded-lg px-3 py-2 bg-background text-foreground"
            value={filterUniId ?? ""}
            onChange={e => { setFilterUniId(e.target.value ? Number(e.target.value) : null); setSelectedFacId(null); }}
          >
            <option value="">Select University</option>
            {universities.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
        {filterUniId && (
          <div>
            <Label className="mb-2 block">Filter by Faculty</Label>
            <select
              className="border rounded-lg px-3 py-2 bg-background text-foreground"
              value={selectedFacId ?? ""}
              onChange={e => setSelectedFacId(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">Select Faculty</option>
              {filterFaculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
        )}
      </div>

      {!selectedFacId ? (
        <Card><CardHeader><CardTitle className="text-muted-foreground">Select a university and faculty above</CardTitle></CardHeader></Card>
      ) : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map(i => <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : departments.length === 0 ? (
        <Card><CardHeader><CardTitle className="text-muted-foreground">No departments yet</CardTitle><CardDescription>Click "Add Department" to add one.</CardDescription></CardHeader></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {departments.map(d => (
            <Card key={d.id} data-testid={`card-department-${d.id}`}>
              <CardHeader>
                <CardTitle>{d.name}</CardTitle>
                <CardDescription>{filterFaculties.find(f => f.id === d.facultyId)?.name}</CardDescription>
              </CardHeader>
              <CardContent><Badge variant="secondary">ID: {d.id}</Badge></CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function UsersTab() {
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const res = await fetch("/api/users", { credentials: "include" });
      return res.json();
    },
  });

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold font-display mb-4">User Management</h2>
      <div className="overflow-x-auto w-full rounded-xl border">
        <table className="min-w-full text-xs sm:text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-3 font-semibold">Name</th>
              <th className="text-left p-3 font-semibold">Email</th>
              <th className="text-left p-3 font-semibold">Role</th>
              <th className="text-left p-3 font-semibold">Matric No.</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">Loading users...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">No users found</td></tr>
            ) : users.map((u, i) => (
              <tr key={u.id} className="border-t" data-testid={`row-user-${i}`}>
                <td className="p-3 font-medium">{u.firstName} {u.lastName}</td>
                <td className="p-3 text-muted-foreground">{u.email}</td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    u.role === "admin" ? "bg-red-100 text-red-700" :
                    u.role === "lecturer" ? "bg-purple-100 text-purple-700" :
                    "bg-blue-100 text-blue-700"
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="p-3 text-muted-foreground">{u.matricNumber ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
