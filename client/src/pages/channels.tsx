import { useState } from "react";
import { format } from "date-fns";
import { Hash, Plus, Send, ShieldAlert, BookOpen, Users, MessageSquare, Menu, X } from "lucide-react";
import { useChannels, useCreateChannel, useJoinChannel } from "@/hooks/use-channels";
import { useMessages, useCreateMessage } from "@/hooks/use-messages";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Channels() {
  const { user } = useAuth();
  const { data: channels, isLoading: channelsLoading } = useChannels();
  const createChannel = useCreateChannel();
  const joinChannel = useJoinChannel();
  
  const [selectedChannelId, setSelectedChannelId] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showSidebarMobile, setShowSidebarMobile] = useState(false);
  const [newChannel, setNewChannel] = useState({ name: "", description: "", type: "general" });
  const [messageContent, setMessageContent] = useState("");

  const { data: messages } = useMessages(selectedChannelId || 0);
  const createMessage = useCreateMessage(selectedChannelId || 0);

  const selectedChannel = channels?.find(c => c.id === selectedChannelId);

  const handleCreateChannel = () => {
    if (!newChannel.name) return;
    createChannel.mutate(newChannel, {
      onSuccess: (data) => {
        setIsDialogOpen(false);
        setSelectedChannelId(data.id);
        setNewChannel({ name: "", description: "", type: "general" });
      }
    });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageContent.trim() || !selectedChannelId) return;
    createMessage.mutate({ content: messageContent }, {
      onSuccess: () => setMessageContent("")
    });
  };

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'class': return <BookOpen className="w-4 h-4" />;
      case 'faculty': return <ShieldAlert className="w-4 h-4" />;
      case 'club': return <Users className="w-4 h-4" />;
      default: return <Hash className="w-4 h-4" />;
    }
  };

  if (channelsLoading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading channels...</div>;

  const groupedChannels = channels?.reduce((acc, channel) => {
    if (!acc[channel.type]) acc[channel.type] = [];
    acc[channel.type].push(channel);
    return acc;
  }, {} as Record<string, typeof channels>);

  return (
    <div className="flex h-[calc(100vh-1px)] w-full overflow-hidden bg-background">
      {/* Sidebar Channels List - Hidden on mobile, visible on desktop */}
      <div className={`${showSidebarMobile ? 'w-full absolute left-0 top-0 z-40 md:relative md:z-0' : 'hidden md:flex'} w-72 border-r border-border/50 bg-card flex flex-col`}>
        <div className="p-4 border-b border-border/50 flex items-center justify-between">
          <h2 className="font-display font-bold text-lg">Channels</h2>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary">
                <Plus className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="font-display">Create Channel</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Channel Name</Label>
                  <Input 
                    value={newChannel.name} 
                    onChange={e => setNewChannel({...newChannel, name: e.target.value})} 
                    placeholder="e.g. cs-101" 
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Type</Label>
                  <Select value={newChannel.type} onValueChange={v => setNewChannel({...newChannel, type: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="class">Class</SelectItem>
                      <SelectItem value="club">Club</SelectItem>
                      <SelectItem value="department">Department</SelectItem>
                      <SelectItem value="faculty">Faculty</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Description</Label>
                  <Input 
                    value={newChannel.description} 
                    onChange={e => setNewChannel({...newChannel, description: e.target.value})} 
                    placeholder="What is this channel about?" 
                  />
                </div>
                <Button onClick={handleCreateChannel} disabled={createChannel.isPending} className="mt-2 font-semibold">
                  Create Channel
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-6">
            {Object.entries(groupedChannels || {}).map(([type, typeChannels]) => (
              <div key={type}>
                <h3 className="px-2 text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                  {getTypeIcon(type)} {type}
                </h3>
                <div className="space-y-0.5">
                  {typeChannels.map(channel => (
                    <button
                      key={channel.id}
                      onClick={() => setSelectedChannelId(channel.id)}
                      className={`
                        w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all
                        ${selectedChannelId === channel.id 
                          ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' 
                          : 'text-foreground/70 hover:bg-secondary hover:text-foreground'}
                      `}
                    >
                      <Hash className="w-4 h-4 opacity-50" />
                      <span className="truncate">{channel.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-background relative h-full">
        {/* Mobile: Backdrop overlay when sidebar is open */}
        {showSidebarMobile && (
          <button
            onClick={() => setShowSidebarMobile(false)}
            className="md:hidden fixed inset-0 bg-black/50 z-30"
          />
        )}
        {selectedChannel ? (
          <>
            <div className="p-4 border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10 flex items-center justify-between gap-3">
              {/* Mobile hamburger menu */}
              <button
                onClick={() => setShowSidebarMobile(!showSidebarMobile)}
                className="md:hidden flex-shrink-0 p-2 hover:bg-secondary rounded-lg transition-colors"
              >
                {showSidebarMobile ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
              <div>
                <h2 className="font-display font-bold text-xl flex items-center gap-2">
                  <Hash className="text-muted-foreground" /> {selectedChannel.name}
                </h2>
                {selectedChannel.description && (
                  <p className="text-sm text-muted-foreground mt-1">{selectedChannel.description}</p>
                )}
              </div>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-6 pb-4">
                {messages?.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-4 pt-20">
                    <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center transform -rotate-6">
                      <MessageSquare className="w-8 h-8 text-primary/50" />
                    </div>
                    <p className="font-medium">Welcome to #{selectedChannel.name}!</p>
                    <p className="text-sm">This is the start of the channel.</p>
                  </div>
                ) : (
                  messages?.map(message => (
                    <div key={message.id} className="flex gap-4 group">
                      <Avatar className="w-10 h-10 border border-border shadow-sm">
                        <AvatarImage src={message.user?.profileImageUrl || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {message.user?.firstName?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="font-bold text-[15px] hover:underline cursor-pointer">
                            {message.user?.firstName} {message.user?.lastName}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {message.createdAt ? format(new Date(message.createdAt), "MMM d, h:mm a") : ''}
                          </span>
                        </div>
                        <p className="text-[15px] leading-relaxed text-foreground/90 whitespace-pre-wrap">
                          {message.content}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            <div className="p-4 bg-background">
              <form onSubmit={handleSendMessage} className="relative flex items-center">
                <Input 
                  value={messageContent}
                  onChange={e => setMessageContent(e.target.value)}
                  placeholder={`Message #${selectedChannel.name}`}
                  className="pr-12 bg-card border-border/60 shadow-sm focus-visible:ring-primary/20 rounded-xl h-12 text-[15px]"
                />
                <Button 
                  type="submit" 
                  size="icon"
                  disabled={createMessage.isPending || !messageContent.trim()}
                  className="absolute right-1.5 h-9 w-9 rounded-lg shadow-sm font-semibold"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground h-full bg-secondary/10">
            <div className="w-24 h-24 bg-card rounded-3xl shadow-sm border border-border flex items-center justify-center mb-6 transform -rotate-3">
              <Hash className="w-10 h-10 text-primary/40" />
            </div>
            <h2 className="text-xl font-display font-bold text-foreground mb-2">No Channel Selected</h2>
            <p>Select a channel from the sidebar or create a new one.</p>
          </div>
        )}
      </div>
    </div>
  );
}
