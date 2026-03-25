import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth } from "@/hooks/use-auth";
import { Menu } from "lucide-react";

// Pages
import Welcome from "./pages/welcome";
import Onboarding from "./pages/onboarding";
import Home from "./pages/home";
import Feed from "./pages/feed";
import Channels from "./pages/channels";
import Materials from "./pages/materials";
import Handouts from "./pages/handouts";
import Connect from "./pages/connect";
import Profile from "./pages/profile";
import Admin from "./pages/admin";

function MobileHeader() {
  return (
    <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-border/50 bg-card sticky top-0 z-50">
      <SidebarTrigger className="p-2 rounded-lg hover:bg-secondary/70 transition-colors">
        <Menu className="w-5 h-5" />
      </SidebarTrigger>
      <div className="flex items-center gap-2">
        <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded-lg font-black text-sm">CL</span>
        <span className="font-black font-display text-lg text-primary">CampusLoop</span>
      </div>
    </div>
  );
}

function ProtectedRouter() {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background overflow-hidden">
        <AppSidebar />
        <main className="flex-1 overflow-y-auto flex flex-col min-w-0">
          <MobileHeader />
          <div className="flex-1">
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/feed" component={Feed} />
              <Route path="/channels" component={Channels} />
              <Route path="/materials" component={Materials} />
              <Route path="/handouts" component={Handouts} />
              <Route path="/connect" component={Connect} />
              <Route path="/profile" component={Profile} />
              <Route path="/admin" component={Admin} />
              <Route component={NotFound} />
            </Switch>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

function MainContent() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          </div>
          <p className="text-muted-foreground font-display font-medium">Loading CampusLoop...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="*" component={Welcome} />
      </Switch>
    );
  }

  const skippedOnboarding = localStorage.getItem(`onboarding-skipped-${user?.id}`);
  const needsOnboarding = !user?.universityId && !skippedOnboarding && user?.role !== "admin";
  if (needsOnboarding) {
    return <Onboarding />;
  }

  return <ProtectedRouter />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <MainContent />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
