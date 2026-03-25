import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { GraduationCap, BookOpen, Users, Zap } from "lucide-react";

type Tab = "login" | "signup";
type Role = "student" | "staff";

export default function Welcome() {
  const [tab, setTab] = useState<Tab>("login");
  const [role, setRole] = useState<Role>("student");

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [signupForm, setSignupForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    matricNumber: "",
    staffId: "",
  });

  const { login, signup, isLoggingIn, isSigningUp } = useAuth();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(loginForm);
    } catch (err: any) {
      toast({ title: "Login failed", description: err.message, variant: "destructive" });
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signup({
        ...signupForm,
        role,
        matricNumber: role === "student" ? signupForm.matricNumber : undefined,
        staffId: role === "staff" ? signupForm.staffId : undefined,
      });
    } catch (err: any) {
      toast({ title: "Signup failed", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left panel - branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-12 text-white">
        <div>
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
            <span className="text-2xl font-black">CL</span>
          </div>
          <h1 className="text-4xl font-bold mb-3">CampusLoop</h1>
          <p className="text-primary-foreground/80 text-lg">
            Your complete campus platform — connect, learn, and grow.
          </p>
        </div>

        <div className="space-y-6">
          <Feature icon={<Users className="w-5 h-5" />} title="Connect with classmates" desc="Find students in your department and faculty" />
          <Feature icon={<BookOpen className="w-5 h-5" />} title="Premium study materials" desc="Access exclusive notes, handouts, and resources" />
          <Feature icon={<GraduationCap className="w-5 h-5" />} title="Lecturer channels" desc="Get direct announcements from your lecturers" />
          <Feature icon={<Zap className="w-5 h-5" />} title="Interswitch payments" desc="Unlock premium content securely via Quickteller" />
        </div>

        <p className="text-sm text-white/50">© 2025 CampusLoop. All rights reserved.</p>
      </div>

      {/* Right panel - forms */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex w-14 h-14 bg-primary rounded-2xl items-center justify-center mb-3">
              <span className="text-2xl font-black text-white">CL</span>
            </div>
            <h1 className="text-2xl font-bold">CampusLoop</h1>
          </div>

          {/* Tab switcher */}
          <div className="flex rounded-xl bg-muted p-1 mb-8">
            <button
              onClick={() => setTab("login")}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                tab === "login" ? "bg-background shadow text-foreground" : "text-muted-foreground"
              }`}
            >
              Log In
            </button>
            <button
              onClick={() => setTab("signup")}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                tab === "signup" ? "bg-background shadow text-foreground" : "text-muted-foreground"
              }`}
            >
              Sign Up
            </button>
          </div>

          {tab === "login" ? (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <h2 className="text-2xl font-bold mb-1">Welcome back</h2>
                <p className="text-muted-foreground text-sm">Log in to your CampusLoop account</p>
              </div>

              <div className="space-y-1">
                <Label htmlFor="login-email">Email address</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="you@university.edu"
                  value={loginForm.email}
                  onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={loginForm.password}
                  onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
                  required
                />
              </div>

              <Button type="submit" className="w-full h-11" disabled={isLoggingIn}>
                {isLoggingIn ? "Logging in..." : "Log In"}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                <button type="button" onClick={() => setTab("signup")} className="text-primary font-medium hover:underline">
                  Sign up
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="space-y-5">
              <div>
                <h2 className="text-2xl font-bold mb-1">Create your account</h2>
                <p className="text-muted-foreground text-sm">Join CampusLoop today</p>
              </div>

              {/* Role selection */}
              <div>
                <Label className="mb-2 block">I am a...</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole("student")}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      role === "student"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    <GraduationCap className="w-6 h-6" />
                    <span className="text-sm font-semibold">Student</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("staff")}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      role === "staff"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    <BookOpen className="w-6 h-6" />
                    <span className="text-sm font-semibold">Lecturer / Staff</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="first-name">First name</Label>
                  <Input
                    id="first-name"
                    placeholder="Ada"
                    value={signupForm.firstName}
                    onChange={e => setSignupForm(f => ({ ...f, firstName: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="last-name">Last name</Label>
                  <Input
                    id="last-name"
                    placeholder="Okonkwo"
                    value={signupForm.lastName}
                    onChange={e => setSignupForm(f => ({ ...f, lastName: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@university.edu"
                  value={signupForm.email}
                  onChange={e => setSignupForm(f => ({ ...f, email: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="At least 6 characters"
                  value={signupForm.password}
                  onChange={e => setSignupForm(f => ({ ...f, password: e.target.value }))}
                  required
                  minLength={6}
                />
              </div>

              {role === "student" && (
                <div className="space-y-1">
                  <Label htmlFor="matric">Matric number</Label>
                  <Input
                    id="matric"
                    placeholder="e.g. CSC/2021/001"
                    value={signupForm.matricNumber}
                    onChange={e => setSignupForm(f => ({ ...f, matricNumber: e.target.value }))}
                  />
                </div>
              )}

              {role === "staff" && (
                <div className="space-y-1">
                  <Label htmlFor="staff-id">Staff ID</Label>
                  <Input
                    id="staff-id"
                    placeholder="e.g. STAFF-001"
                    value={signupForm.staffId}
                    onChange={e => setSignupForm(f => ({ ...f, staffId: e.target.value }))}
                  />
                </div>
              )}

              <Button type="submit" className="w-full h-11" disabled={isSigningUp}>
                {isSigningUp ? "Creating account..." : "Create Account"}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <button type="button" onClick={() => setTab("login")} className="text-primary font-medium hover:underline">
                  Log in
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-white/60">{desc}</p>
      </div>
    </div>
  );
}
