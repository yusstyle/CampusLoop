import { useState, useEffect } from "react";
import { FileText, Link as LinkIcon, Upload, Search, Lock, Crown, CheckCircle, ExternalLink } from "lucide-react";
import { useMaterials, useCreateMaterial } from "@/hooks/use-materials";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useSearch } from "wouter";

type MaterialWithUnlock = {
  id: number;
  title: string;
  description?: string | null;
  url: string;
  isPremium?: boolean | null;
  price?: number | null;
  isUnlocked?: boolean;
  uploader: { firstName?: string | null; lastName?: string | null; profileImageUrl?: string | null };
  createdAt?: string | null;
};

export default function Materials() {
  const { data: materials, isLoading } = useMaterials();
  const createMaterial = useCreateMaterial();
  const { user } = useAuth();
  const { toast } = useToast();
  const searchStr = useSearch();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isPaying, setIsPaying] = useState<number | null>(null);
  const [newMaterial, setNewMaterial] = useState({
    title: "",
    url: "",
    description: "",
    isPremium: false,
    price: 1000,
  });

  // Handle payment callback
  useEffect(() => {
    const params = new URLSearchParams(searchStr);
    const payment = params.get("payment");
    if (payment === "success") {
      toast({ title: "Payment successful!", description: "Your content has been unlocked." });
    } else if (payment === "failed") {
      toast({ title: "Payment failed", description: "Please try again.", variant: "destructive" });
    } else if (payment === "pending") {
      toast({ title: "Payment pending", description: "We'll unlock your content once confirmed." });
    }
  }, [searchStr]);

  const handleUpload = () => {
    if (!newMaterial.title || !newMaterial.url) return;
    createMaterial.mutate({
      title: newMaterial.title,
      url: newMaterial.url,
      description: newMaterial.description,
      isPremium: newMaterial.isPremium,
      price: newMaterial.isPremium ? newMaterial.price * 100 : 0,
    }, {
      onSuccess: () => {
        setIsDialogOpen(false);
        setNewMaterial({ title: "", url: "", description: "", isPremium: false, price: 1000 });
      }
    });
  };

  const handleUnlock = async (material: MaterialWithUnlock) => {
    setIsPaying(material.id);
    try {
      const res = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ materialId: material.id }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast({ title: "Error", description: data.message, variant: "destructive" });
        return;
      }

      // Submit the form to Interswitch payment page
      const form = document.createElement("form");
      form.method = "POST";
      form.action = data.paymentUrl;
      Object.entries(data.formData as Record<string, string>).forEach(([k, v]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = k;
        input.value = v;
        form.appendChild(input);
      });
      document.body.appendChild(form);
      form.submit();
    } catch {
      toast({ title: "Error", description: "Payment initiation failed. Please try again.", variant: "destructive" });
    } finally {
      setIsPaying(null);
    }
  };

  const handlePremiumSubscription = async () => {
    try {
      const res = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Error", description: data.message, variant: "destructive" });
        return;
      }
      const form = document.createElement("form");
      form.method = "POST";
      form.action = data.paymentUrl;
      Object.entries(data.formData as Record<string, string>).forEach(([k, v]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = k;
        input.value = v;
        form.appendChild(input);
      });
      document.body.appendChild(form);
      form.submit();
    } catch {
      toast({ title: "Error", description: "Failed to start subscription.", variant: "destructive" });
    }
  };

  const filteredMaterials = (materials as MaterialWithUnlock[] | undefined)?.filter(m =>
    m.title.toLowerCase().includes(search.toLowerCase()) ||
    m.description?.toLowerCase().includes(search.toLowerCase())
  );

  const isStaff = user?.role === "staff" || user?.role === "admin";

  return (
    <div className="max-w-5xl mx-auto py-8 px-6 w-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-display font-bold mb-2">Study Materials</h1>
          <p className="text-muted-foreground">Access and share resources with the campus community.</p>
        </div>

        <div className="flex items-center gap-3">
          {!user?.isPremium && (
            <Button
              variant="outline"
              onClick={handlePremiumSubscription}
              className="border-amber-500/50 text-amber-600 hover:bg-amber-50 gap-2 h-11"
            >
              <Crown className="w-4 h-4" />
              Go Premium
            </Button>
          )}

          {isStaff && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-xl shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-transform font-semibold h-11 px-6">
                  <Upload className="w-4 h-4 mr-2" /> Share Material
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                  <DialogTitle className="font-display text-xl">Share Resource</DialogTitle>
                </DialogHeader>
                <div className="grid gap-5 py-4">
                  <div className="grid gap-2">
                    <Label>Title *</Label>
                    <Input
                      value={newMaterial.title}
                      onChange={e => setNewMaterial({ ...newMaterial, title: e.target.value })}
                      placeholder="e.g. Intro to CS Notes"
                      className="bg-secondary/30 border-transparent focus-visible:border-primary"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Resource URL *</Label>
                    <Input
                      value={newMaterial.url}
                      onChange={e => setNewMaterial({ ...newMaterial, url: e.target.value })}
                      placeholder="https://..."
                      className="bg-secondary/30 border-transparent focus-visible:border-primary"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Description</Label>
                    <Input
                      value={newMaterial.description}
                      onChange={e => setNewMaterial({ ...newMaterial, description: e.target.value })}
                      placeholder="Brief description..."
                      className="bg-secondary/30 border-transparent focus-visible:border-primary"
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-200">
                    <div>
                      <p className="font-medium text-sm text-amber-800">Premium material</p>
                      <p className="text-xs text-amber-600">Requires payment to access</p>
                    </div>
                    <Switch
                      checked={newMaterial.isPremium}
                      onCheckedChange={v => setNewMaterial({ ...newMaterial, isPremium: v })}
                    />
                  </div>
                  {newMaterial.isPremium && (
                    <div className="grid gap-2">
                      <Label>Price (₦)</Label>
                      <Input
                        type="number"
                        value={newMaterial.price}
                        onChange={e => setNewMaterial({ ...newMaterial, price: Number(e.target.value) })}
                        placeholder="1000"
                        min={100}
                      />
                    </div>
                  )}
                  <Button onClick={handleUpload} disabled={createMaterial.isPending} size="lg" className="mt-2 rounded-xl">
                    {createMaterial.isPending ? "Sharing..." : "Share Resource"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Premium banner */}
      {!user?.isPremium && (
        <div className="flex items-center justify-between bg-gradient-to-r from-amber-500/10 to-amber-600/5 border border-amber-300/50 rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Crown className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="font-semibold text-sm">Unlock all premium materials at once</p>
              <p className="text-xs text-muted-foreground">Get a CampusLoop Premium subscription — ₦1,000/month via Interswitch</p>
            </div>
          </div>
          <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white shrink-0" onClick={handlePremiumSubscription}>
            Subscribe
          </Button>
        </div>
      )}

      {user?.isPremium && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
          <Crown className="w-5 h-5 text-amber-500" />
          <p className="text-sm font-semibold text-amber-800">You have Premium — all materials are unlocked for you</p>
        </div>
      )}

      <div className="relative mb-8 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search materials..."
          className="pl-10 h-12 bg-card border-border/60 rounded-xl shadow-sm focus-visible:ring-primary/20 text-md"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-52 bg-card rounded-2xl border border-border/50" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMaterials?.map(material => {
            const locked = material.isPremium && !material.isUnlocked;
            const priceNgn = material.price ? material.price / 100 : 1000;
            return (
              <div
                key={material.id}
                className={`bg-card rounded-2xl p-6 border shadow-sm transition-all duration-300 hover:-translate-y-1 group flex flex-col relative ${
                  locked ? "border-amber-300/60 hover:border-amber-400/80 hover:shadow-amber-100" :
                  "border-border/50 hover:shadow-xl hover:border-primary/30"
                }`}
              >
                {material.isPremium && (
                  <div className="absolute top-4 right-4">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      material.isUnlocked ? "bg-amber-100 text-amber-700" : "bg-amber-500 text-white"
                    }`}>
                      <Crown className="w-2.5 h-2.5" />
                      {material.isUnlocked ? "UNLOCKED" : "PREMIUM"}
                    </span>
                  </div>
                )}

                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${
                  locked ? "bg-amber-100 text-amber-600" : "bg-primary/10 text-primary"
                }`}>
                  {locked ? <Lock className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                </div>

                <h3 className="font-bold font-display text-lg mb-2 line-clamp-1 pr-16" title={material.title}>
                  {material.title}
                </h3>

                <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-1">
                  {material.description || "No description provided."}
                </p>

                {locked && (
                  <p className="text-xs text-amber-600 font-medium mb-3">
                    ₦{priceNgn.toLocaleString()} to unlock via Interswitch
                  </p>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-border/50 mt-auto">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                      {material.uploader?.firstName?.charAt(0) || "?"}
                    </div>
                    <span className="text-xs font-medium text-foreground/70">
                      {material.uploader?.firstName} {material.uploader?.lastName}
                    </span>
                  </div>

                  {locked ? (
                    <Button
                      size="sm"
                      className="bg-amber-500 hover:bg-amber-600 text-white text-xs h-7 px-3 gap-1"
                      disabled={isPaying === material.id}
                      onClick={() => handleUnlock(material)}
                    >
                      <Lock className="w-3 h-3" />
                      {isPaying === material.id ? "..." : "Unlock"}
                    </Button>
                  ) : (
                    <a
                      href={material.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 hover:bg-primary hover:text-white px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> View
                    </a>
                  )}
                </div>
              </div>
            );
          })}
          {filteredMaterials?.length === 0 && (
            <div className="col-span-full py-20 text-center text-muted-foreground bg-card rounded-3xl border border-dashed border-border">
              <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
              <h3 className="text-lg font-bold text-foreground mb-1">No materials found</h3>
              <p>Try adjusting your search or share something new.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
