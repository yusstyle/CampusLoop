import { Link, useLocation } from "wouter";
import { Home, Hash, BookOpen, Users, User, LogOut, Rss, Crown, FileText, Settings } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const items = [
  { title: "Home", url: "/", icon: Home, exact: true },
  { title: "Social Feed", url: "/feed", icon: Rss },
  { title: "Channels", url: "/channels", icon: Hash },
  { title: "Materials", url: "/materials", icon: BookOpen },
  { title: "Handouts", url: "/handouts", icon: FileText },
  { title: "Connect", url: "/connect", icon: Users },
  { title: "Profile", url: "/profile", icon: User },
];

const adminItems = [
  { title: "Admin Panel", url: "/admin", icon: Settings },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { setOpenMobile } = useSidebar();
  const isAdmin = user?.role === 'admin';

  const handleNavClick = () => {
    setOpenMobile(false);
  };

  const isActive = (item: { url: string; exact?: boolean }) => {
    if (item.exact) return location === item.url;
    return location.startsWith(item.url);
  };

  return (
    <Sidebar className="border-r border-border/50 bg-card" collapsible="offcanvas">
      <SidebarContent>
        <div className="p-5 pb-3">
          <Link href="/" onClick={handleNavClick}>
            <div className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity">
              <span className="bg-primary text-primary-foreground px-2.5 py-1 rounded-xl font-black text-lg">CL</span>
              <span className="text-xl font-black font-display tracking-tight text-primary">CampusLoop</span>
            </div>
          </Link>
          {user?.universityId && (
            <p className="text-xs text-muted-foreground mt-2 ml-1 truncate max-w-[180px]">
              {user?.isPremium && <Crown className="w-3 h-3 text-amber-500 inline mr-1" />}
              {user.role === 'admin' ? '⚙ Admin' : user.role === 'student' ? '🎓 Student' : '👨‍🏫 Staff'}
            </p>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold px-4">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="px-2">
              {items.map((item) => {
                const active = isActive(item);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      className={`
                        my-0.5 px-3 py-2.5 h-auto rounded-xl transition-all duration-150
                        ${active
                          ? 'bg-primary text-primary-foreground font-semibold shadow-sm shadow-primary/20'
                          : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'}
                      `}
                    >
                      <Link href={item.url} className="flex items-center gap-3" onClick={handleNavClick}>
                        <item.icon className="w-[18px] h-[18px] shrink-0" />
                        <span className="text-[14px] font-medium">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold px-4">Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="px-2">
                {adminItems.map((item) => {
                  const active = location.startsWith(item.url);
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        className={`
                          my-0.5 px-3 py-2.5 h-auto rounded-xl transition-all duration-150
                          ${active
                            ? 'bg-primary text-primary-foreground font-semibold'
                            : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'}
                        `}
                      >
                        <Link href={item.url} className="flex items-center gap-3" onClick={handleNavClick}>
                          <item.icon className="w-[18px] h-[18px] shrink-0" />
                          <span className="text-[14px] font-medium">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-border/50">
        <div className="flex items-center gap-3 px-3 py-2.5 mb-2 rounded-xl bg-secondary/40 border border-border/30">
          <Avatar className="h-9 w-9 border-2 border-primary/20 shrink-0">
            <AvatarImage src={user?.profileImageUrl || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
              {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col flex-1 overflow-hidden min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] font-bold truncate">{user?.firstName} {user?.lastName}</span>
              {user?.isPremium && <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
            </div>
            <span className="text-[11px] text-muted-foreground truncate capitalize">{user?.role}</span>
          </div>
        </div>
        <button
          onClick={() => logout()}
          className="flex w-full items-center gap-2 px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Sign Out
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
