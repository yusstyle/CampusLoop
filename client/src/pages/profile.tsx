import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { User, Settings } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useUpdateProfile } from "@/hooks/use-users";
import { updateUserSchema, type UpdateUserRequest } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

type University = { id: number; name: string; description?: string };
type Faculty = { id: number; name: string; universityId: number };
type Department = { id: number; name: string; facultyId: number };

export default function Profile() {
  const { user } = useAuth();
  const updateProfile = useUpdateProfile();
  const { toast } = useToast();

  const form = useForm<UpdateUserRequest>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      bio: "",
      department: "",
      role: "student",
      availableForSocial: false,
      universityId: undefined,
      facultyId: undefined,
      departmentId: undefined,
    }
  });

  useEffect(() => {
    if (user) {
      form.reset({
        bio: user.bio || "",
        department: user.department || "",
        role: user.role || "student",
        availableForSocial: user.availableForSocial || false,
        universityId: user.universityId ?? undefined,
        facultyId: user.facultyId ?? undefined,
        departmentId: user.departmentId ?? undefined,
      });
    }
  }, [user, form]);

  const watchedUniversityId = form.watch("universityId");
  const watchedFacultyId = form.watch("facultyId");

  const { data: universities = [] } = useQuery<University[]>({
    queryKey: ["/api/admin/universities"],
    queryFn: async () => {
      const res = await fetch("/api/admin/universities", { credentials: "include" });
      return res.json();
    },
  });

  const { data: faculties = [] } = useQuery<Faculty[]>({
    queryKey: ["/api/admin/faculties", watchedUniversityId],
    queryFn: async () => {
      if (!watchedUniversityId) return [];
      const res = await fetch(`/api/admin/faculties/${watchedUniversityId}`, { credentials: "include" });
      return res.json();
    },
    enabled: !!watchedUniversityId,
  });

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ["/api/admin/departments", watchedFacultyId],
    queryFn: async () => {
      if (!watchedFacultyId) return [];
      const res = await fetch(`/api/admin/departments/${watchedFacultyId}`, { credentials: "include" });
      return res.json();
    },
    enabled: !!watchedFacultyId,
  });

  const onSubmit = (data: UpdateUserRequest) => {
    updateProfile.mutate(data, {
      onSuccess: () => {
        toast({ title: "Profile updated successfully", variant: "default" });
      },
      onError: (err) => {
        toast({ title: "Error updating profile", description: err.message, variant: "destructive" });
      }
    });
  };

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto py-10 px-6 w-full">
      <div className="mb-10">
        <h1 className="text-3xl font-display font-bold mb-2 flex items-center gap-3">
          <Settings className="text-primary w-8 h-8" />
          Profile Settings
        </h1>
        <p className="text-muted-foreground">Manage your identity and preferences on CampusLoop.</p>
      </div>

      <div className="bg-card rounded-3xl border border-border/50 shadow-sm overflow-hidden mb-8">
        <div className="h-32 bg-gradient-to-r from-primary/80 to-primary w-full"></div>
        <div className="px-8 pb-8 relative">
          <div className="flex justify-between items-end mb-8 -mt-16 relative z-10">
            <Avatar className="w-32 h-32 border-4 border-card shadow-lg bg-card">
              <AvatarImage src={user.profileImageUrl || undefined} />
              <AvatarFallback className="text-4xl bg-secondary text-secondary-foreground font-display font-bold">
                {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="text-right pb-2">
              <h2 className="text-2xl font-bold font-display">{user.firstName} {user.lastName}</h2>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-2xl">

              {/* Institution Section */}
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground text-base border-b pb-2">Institution</h3>

                {universities.length === 0 ? (
                  <p className="text-sm text-muted-foreground bg-muted/50 rounded-xl p-4">
                    No universities have been set up yet. An admin needs to add institutions first.
                  </p>
                ) : (
                  <>
                    <FormField
                      control={form.control}
                      name="universityId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold text-foreground">University</FormLabel>
                          <Select
                            onValueChange={(val) => {
                              field.onChange(Number(val));
                              form.setValue("facultyId", undefined);
                              form.setValue("departmentId", undefined);
                            }}
                            value={field.value ? String(field.value) : ""}
                          >
                            <FormControl>
                              <SelectTrigger className="h-12 bg-secondary/20 rounded-xl" data-testid="select-university">
                                <SelectValue placeholder="Select your university" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {universities.map(u => (
                                <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {watchedUniversityId && (
                      <FormField
                        control={form.control}
                        name="facultyId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-semibold text-foreground">Faculty</FormLabel>
                            <Select
                              onValueChange={(val) => {
                                field.onChange(Number(val));
                                form.setValue("departmentId", undefined);
                              }}
                              value={field.value ? String(field.value) : ""}
                            >
                              <FormControl>
                                <SelectTrigger className="h-12 bg-secondary/20 rounded-xl" data-testid="select-faculty">
                                  <SelectValue placeholder={faculties.length === 0 ? "No faculties available" : "Select your faculty"} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {faculties.map(f => (
                                  <SelectItem key={f.id} value={String(f.id)}>{f.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {watchedFacultyId && (
                      <FormField
                        control={form.control}
                        name="departmentId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-semibold text-foreground">Department</FormLabel>
                            <Select
                              onValueChange={(val) => field.onChange(Number(val))}
                              value={field.value ? String(field.value) : ""}
                            >
                              <FormControl>
                                <SelectTrigger className="h-12 bg-secondary/20 rounded-xl" data-testid="select-department">
                                  <SelectValue placeholder={departments.length === 0 ? "No departments available" : "Select your department"} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {departments.map(d => (
                                  <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </>
                )}
              </div>

              {/* Personal Info Section */}
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground text-base border-b pb-2">Personal Info</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold text-foreground">Department Label</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Computer Science" className="h-12 bg-secondary/20 rounded-xl" {...field} data-testid="input-department" />
                        </FormControl>
                        <FormDescription>Displayed on your profile card.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold text-foreground">Role</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value ?? "student"}>
                          <FormControl>
                            <SelectTrigger className="h-12 bg-secondary/20 rounded-xl" data-testid="select-role">
                              <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="student">Student</SelectItem>
                            <SelectItem value="lecturer">Lecturer</SelectItem>
                            <SelectItem value="faculty">Faculty / Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold text-foreground">Bio</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell the campus a bit about yourself..."
                        className="resize-none min-h-[120px] bg-secondary/20 rounded-xl"
                        {...field}
                        data-testid="textarea-bio"
                      />
                    </FormControl>
                    <FormDescription>Shown on your social connect card.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="bg-secondary/30 rounded-2xl p-6 border border-border/50">
                <FormField
                  control={form.control}
                  name="availableForSocial"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg">
                      <div className="space-y-1 mr-4">
                        <FormLabel className="text-lg font-bold font-display text-foreground flex items-center gap-2">
                          <User className="w-5 h-5 text-primary" />
                          Social Connect
                        </FormLabel>
                        <FormDescription className="text-[15px]">
                          Make your profile visible in the Connect directory to meet new people.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="scale-125 data-[state=checked]:bg-green-500"
                          data-testid="switch-social-connect"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end pt-4 border-t border-border/50">
                <Button
                  type="submit"
                  size="lg"
                  disabled={updateProfile.isPending}
                  className="rounded-xl px-8 shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all font-semibold"
                  data-testid="button-save-profile"
                >
                  {updateProfile.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
