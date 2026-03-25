import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useChannels, useJoinChannel } from "@/hooks/use-channels";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Hash, BookOpen, Users, Rss, MessageSquare, ArrowRight,
  Building2, GraduationCap, Layers, Lock, Zap, Plus, CreditCard,
  CheckCircle2, Loader2, XCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

type University = { id: number; name: string; description?: string };
type Faculty = { id: number; name: string; universityId: number };
type Department = { id: number; name: string; facultyId: number };
type Channel = { id: number; name: string; description?: string; type: string; universityId?: number; facultyId?: number; departmentId?: number; memberCount?: number };

export default function Home() {
  const { user } = useAuth();
  const { data: channels = [], isLoading: channelsLoading } = useChannels();
  const joinChannel = useJoinChannel();
  const { toast } = useToast();
  const [payDialog, setPayDialog] = useState<{ open: boolean; txnref: string | null; status: "idle" | "pending" | "verifying" | "success" | "failed" }>({
    open: false, txnref: null, status: "idle",
  });

  const { data: universities = [] } = useQuery<University[]>({
    queryKey: ["/api/admin/universities"],
    queryFn: async () => {
      const res = await fetch("/api/admin/universities", { credentials: "include" });
      return res.json();
    },
  });

  const { data: faculties = [] } = useQuery<Faculty[]>({
    queryKey: ["/api/admin/faculties", user?.universityId],
    queryFn: async () => {
      if (!user?.universityId) return [];
      const res = await fetch(`/api/admin/faculties/${user.universityId}`, { credentials: "include" });
      return res.json();
    },
    enabled: !!user?.universityId,
  });

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ["/api/admin/departments", user?.facultyId],
    queryFn: async () => {
      if (!user?.facultyId) return [];
      const res = await fetch(`/api/admin/departments/${user.facultyId}`, { credentials: "include" });
      return res.json();
    },
    enabled: !!user?.facultyId,
  });

  const myUniversity = universities.find(u => u.id === user?.universityId);
  const myFaculty = faculties.find(f => f.id === user?.facultyId);
  const myDepartment = departments.find(d => d.id === user?.departmentId);

  // Filter channels relevant to the user
  const myChannels = channels.filter(c =>
    (user?.universityId && c.universityId === user.universityId) ||
    (user?.facultyId && c.facultyId === user.facultyId) ||
    (user?.departmentId && c.departmentId === user.departmentId) ||
    c.type === "general"
  );

  const otherChannels = channels.filter(c => !myChannels.includes(c));

  const getChannelBg = (type: string) => {
    switch (type) {
      case "class": return "bg-blue-500";
      case "faculty": return "bg-purple-500";
      case "club": return "bg-emerald-500";
      case "announcement": return "bg-amber-500";
      default: return "bg-primary";
    }
  };

  const getChannelScope = (c: Channel) => {
    if (c.departmentId) return myDepartment?.name || "Department";
    if (c.facultyId) return myFaculty?.name || "Faculty";
    if (c.universityId) return myUniversity?.name || "University";
    return "General";
  };

  const handleJoin = (channelId: number) => {
    joinChannel.mutate(channelId, {
      onSuccess: () => toast({ title: "Joined channel!" }),
      onError: () => toast({ title: "Could not join", variant: "destructive" }),
    });
  };

  const handleUpgrade = async () => {
    try {
      const res = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      // Build the Interswitch form and submit it into a NEW TAB so the app stays open
      const formHtml = `
        <html><body>
        <p style="font-family:sans-serif;text-align:center;margin-top:40px">Redirecting to Interswitch payment page...</p>
        <form id="f" method="POST" action="${data.paymentUrl}">
          ${Object.entries(data.formData).map(([k, v]) => `<input type="hidden" name="${k}" value="${String(v)}">`).join("")}
        </form>
        <script>document.getElementById('f').submit();<\/script>
        </body></html>
      `;
      const blob = new Blob([formHtml], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");

      // Show the payment dialog so the user can verify after returning
      setPayDialog({ open: true, txnref: data.txnref, status: "pending" });
    } catch (err: any) {
      toast({ title: "Payment Error", description: err.message || "Could not initiate payment", variant: "destructive" });
    }
  };

  const handleVerifyPayment = async () => {
    if (!payDialog.txnref) return;
    setPayDialog(d => ({ ...d, status: "verifying" }));
    try {
      const res = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ txnref: payDialog.txnref }),
      });
      const data = await res.json();
      if (data.status === "success") {
        setPayDialog(d => ({ ...d, status: "success" }));
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      } else if (data.status === "pending") {
        setPayDialog(d => ({ ...d, status: "pending" }));
        toast({ title: "Payment still processing", description: "Please wait a moment and try again." });
      } else {
        setPayDialog(d => ({ ...d, status: "failed" }));
      }
    } catch {
      setPayDialog(d => ({ ...d, status: "failed" }));
    }
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 w-full">

      {/* Payment Verification Dialog */}
      <Dialog open={payDialog.open} onOpenChange={open => setPayDialog(d => ({ ...d, open }))}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Complete Your Payment</DialogTitle>
            <DialogDescription>
              A new tab has opened with the Interswitch payment page. Complete your payment there, then come back here and click "I've Paid" to activate your Premium access.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 flex flex-col items-center gap-4">
            {payDialog.status === "verifying" && (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm">Verifying your payment...</p>
              </div>
            )}
            {payDialog.status === "success" && (
              <div className="flex flex-col items-center gap-2 text-emerald-600">
                <CheckCircle2 className="w-10 h-10" />
                <p className="font-bold text-lg">Payment Successful!</p>
                <p className="text-sm text-muted-foreground text-center">You now have Premium access. Enjoy all features!</p>
              </div>
            )}
            {payDialog.status === "failed" && (
              <div className="flex flex-col items-center gap-2 text-red-500">
                <XCircle className="w-10 h-10" />
                <p className="font-bold">Payment Not Confirmed</p>
                <p className="text-sm text-muted-foreground text-center">We couldn't confirm your payment. If you were charged, please contact support with reference: <span className="font-mono font-bold">{payDialog.txnref}</span></p>
              </div>
            )}
            {(payDialog.status === "pending" || payDialog.status === "idle") && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 text-sm text-amber-800 dark:text-amber-300 w-full">
                <p className="font-semibold mb-1">Sandbox / Test Mode</p>
                <p>Use these test card details on the Interswitch page:</p>
                <ul className="mt-1 space-y-0.5 font-mono text-xs">
                  <li>Card: <span className="font-bold">5061040000000000063</span></li>
                  <li>Expiry: <span className="font-bold">12/26</span></li>
                  <li>CVV: <span className="font-bold">123</span></li>
                  <li>PIN: <span className="font-bold">1111</span></li>
                  <li>OTP: <span className="font-bold">123456</span></li>
                </ul>
              </div>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {payDialog.status === "success" ? (
              <Button className="rounded-xl w-full" onClick={() => setPayDialog({ open: false, txnref: null, status: "idle" })}>
                Done
              </Button>
            ) : payDialog.status === "failed" ? (
              <>
                <Button variant="outline" className="rounded-xl" onClick={() => setPayDialog({ open: false, txnref: null, status: "idle" })}>Close</Button>
                <Button className="rounded-xl" onClick={handleVerifyPayment}>Try Verify Again</Button>
              </>
            ) : (
              <>
                <Button variant="outline" className="rounded-xl" onClick={() => setPayDialog({ open: false, txnref: null, status: "idle" })}>Cancel</Button>
                <Button
                  className="rounded-xl gap-1.5"
                  onClick={handleVerifyPayment}
                  disabled={payDialog.status === "verifying"}
                  data-testid="button-verify-payment"
                >
                  {payDialog.status === "verifying" ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  I've Paid — Verify
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-primary to-primary/80 rounded-3xl p-6 sm:p-8 text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-white rounded-full translate-y-1/2 -translate-x-1/4" />
        </div>
        <div className="relative z-10">
          <p className="text-primary-foreground/80 text-sm font-medium mb-1">{greeting},</p>
          <h1 className="text-2xl sm:text-3xl font-black font-display mb-3">
            {user?.firstName} {user?.lastName} 👋
          </h1>
          <div className="flex flex-wrap gap-2 text-xs">
            {myUniversity && (
              <span className="flex items-center gap-1 bg-white/20 rounded-full px-3 py-1">
                <Building2 className="w-3 h-3" /> {myUniversity.name}
              </span>
            )}
            {myFaculty && (
              <span className="flex items-center gap-1 bg-white/20 rounded-full px-3 py-1">
                <GraduationCap className="w-3 h-3" /> {myFaculty.name}
              </span>
            )}
            {myDepartment && (
              <span className="flex items-center gap-1 bg-white/20 rounded-full px-3 py-1">
                <Layers className="w-3 h-3" /> {myDepartment.name}
              </span>
            )}
            {!myUniversity && (
              <Link href="/profile">
                <span className="flex items-center gap-1 bg-white/20 hover:bg-white/30 rounded-full px-3 py-1 cursor-pointer transition-colors">
                  <Plus className="w-3 h-3" /> Set up your institution
                </span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: <Rss className="w-5 h-5" />, label: "Social Feed", href: "/feed", color: "bg-pink-500/10 text-pink-600 dark:text-pink-400" },
          { icon: <MessageSquare className="w-5 h-5" />, label: "Channels", href: "/channels", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
          { icon: <BookOpen className="w-5 h-5" />, label: "Materials", href: "/materials", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
          { icon: <Users className="w-5 h-5" />, label: "Connect", href: "/connect", color: "bg-violet-500/10 text-violet-600 dark:text-violet-400" },
        ].map((item, i) => (
          <Link key={i} href={item.href}>
            <Card className="cursor-pointer hover:-translate-y-0.5 transition-all hover:shadow-md border-border/40 rounded-2xl" data-testid={`card-quick-action-${i}`}>
              <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color}`}>
                  {item.icon}
                </div>
                <span className="text-xs font-semibold">{item.label}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Premium Banner (for non-premium users) */}
      {!user?.isPremium && (
        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="font-bold text-sm">Upgrade to Premium</p>
              <p className="text-xs text-muted-foreground">Unlock all study materials & social features for ₦1,000/month</p>
            </div>
          </div>
          <Button
            size="sm"
            className="rounded-xl bg-amber-500 hover:bg-amber-600 text-white shrink-0"
            onClick={handleUpgrade}
            data-testid="button-upgrade-premium"
          >
            <CreditCard className="w-4 h-4 mr-1.5" /> Pay with Interswitch
          </Button>
        </div>
      )}

      {/* My Channels */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black font-display">My University Groups</h2>
          <Link href="/channels">
            <Button variant="ghost" size="sm" className="text-primary rounded-xl gap-1">
              See all <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>

        {channelsLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3].map(i => <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />)}
          </div>
        ) : myChannels.length === 0 ? (
          <div className="bg-card border border-border/40 rounded-2xl p-8 text-center">
            <Hash className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
            <p className="font-semibold mb-1">No groups yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              {!myUniversity
                ? "Set up your institution in your profile to see your university groups."
                : "No channels have been created for your institution yet."}
            </p>
            {!myUniversity ? (
              <Button size="sm" className="rounded-xl" asChild>
                <Link href="/profile">Set up institution</Link>
              </Button>
            ) : (
              <Button size="sm" className="rounded-xl" asChild>
                <Link href="/channels">Browse all channels</Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {myChannels.map(c => (
              <Link key={c.id} href="/channels">
                <Card className="cursor-pointer hover:-translate-y-0.5 hover:shadow-md transition-all border-border/40 rounded-2xl" data-testid={`card-channel-${c.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl ${getChannelBg(c.type)} flex items-center justify-center shrink-0`}>
                        <Hash className="w-4 h-4 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-sm truncate">{c.name}</p>
                        {c.description && <p className="text-xs text-muted-foreground truncate mt-0.5">{c.description}</p>}
                        <Badge variant="secondary" className="text-[10px] mt-1.5 rounded-full">{getChannelScope(c)}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Other Available Channels */}
      {otherChannels.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black font-display">Discover More Groups</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {otherChannels.slice(0, 6).map(c => (
              <Card key={c.id} className="border-border/40 rounded-2xl" data-testid={`card-discover-${c.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl ${getChannelBg(c.type)} flex items-center justify-center shrink-0`}>
                      <Hash className="w-4 h-4 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm truncate">{c.name}</p>
                      {c.description && <p className="text-xs text-muted-foreground truncate mt-0.5">{c.description}</p>}
                      <Badge variant="outline" className="text-[10px] mt-1.5 rounded-full">{c.type}</Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-lg text-xs shrink-0"
                      onClick={() => handleJoin(c.id)}
                      disabled={joinChannel.isPending}
                      data-testid={`button-join-${c.id}`}
                    >
                      Join
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Institution info if user has no channels */}
      {channels.length === 0 && !channelsLoading && user?.role === "admin" && (
        <Card className="border-border/40 rounded-2xl border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Lock className="w-4 h-4 text-muted-foreground" />
              No channels exist yet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              As an admin, you can create channels for universities, faculties, and departments from the Channels page.
            </p>
            <Button size="sm" className="rounded-xl" asChild>
              <Link href="/channels">Create first channel</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
