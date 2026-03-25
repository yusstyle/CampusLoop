import { useState } from "react";
import { MessageCircle, GraduationCap, Info, Users } from "lucide-react";
import { useUsers } from "@/hooks/use-users";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PremiumGate } from "@/components/premium-gate";

export default function Connect() {
  const { data: users, isLoading } = useUsers();
  const { user: currentUser } = useAuth();

  const socialUsers = users?.filter(u => u.availableForSocial && u.id !== currentUser?.id);

  if (!currentUser?.isPremium) return <PremiumGate feature="Social Connect" />;

  return (
    <div className="max-w-6xl mx-auto py-10 px-6 w-full">
      <div className="mb-10 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-accent to-accent/60 text-accent-foreground mb-6 shadow-md shadow-accent/20 transform rotate-3">
          <MessageCircle className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-display font-black mb-4">Social Connect</h1>
        <p className="text-lg text-muted-foreground">
          Meet people across campus who are open to socializing, studying together, or grabbing coffee.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-pulse">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-64 bg-card rounded-3xl border border-border/50"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {socialUsers?.map(user => (
            <div key={user.id} className="bg-card rounded-3xl p-6 border border-border/50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -z-10 group-hover:bg-primary/10 transition-colors"></div>
              
              <div className="flex items-start justify-between mb-6 relative z-10">
                <Avatar className="w-20 h-20 border-4 border-background shadow-md">
                  <AvatarImage src={user.profileImageUrl || undefined} />
                  <AvatarFallback className="text-xl bg-gradient-to-br from-primary to-primary/60 text-white font-bold">
                    {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Available
                </div>
              </div>
              
              <div className="relative z-10">
                <h3 className="text-xl font-bold font-display leading-none mb-1">
                  {user.firstName} {user.lastName}
                </h3>
                {user.department && (
                  <p className="text-sm text-primary font-medium flex items-center gap-1.5 mb-4">
                    <GraduationCap className="w-4 h-4" /> {user.department}
                  </p>
                )}
                
                <div className="bg-secondary/40 rounded-xl p-4 mb-6">
                  <p className="text-sm text-foreground/80 italic flex gap-2">
                    <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    "{user.bio || "Hi! I'm open to meeting new people."}"
                  </p>
                </div>
                
                <Button className="w-full rounded-xl h-11 font-semibold group-hover:shadow-md transition-shadow">
                  Say Hello
                </Button>
              </div>
            </div>
          ))}
          {socialUsers?.length === 0 && (
            <div className="col-span-full py-20 text-center bg-card rounded-3xl border border-border/50 shadow-sm">
              <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4 text-muted-foreground">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2 font-display">No one available right now</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Check back later, or update your own profile to become available for socializing!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
