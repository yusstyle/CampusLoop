import { useState } from "react";
import { FileText, Upload, Download, Search } from "lucide-react";
import { useMaterials, useCreateMaterial } from "@/hooks/use-materials";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export default function Handouts() {
  const { data: materials, isLoading } = useMaterials();
  const createMaterial = useCreateMaterial();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [newHandout, setNewHandout] = useState({ title: "", url: "", description: "" });

  const handleUpload = () => {
    if (!newHandout.title || !newHandout.url) return;
    createMaterial.mutate(newHandout, {
      onSuccess: () => {
        setIsDialogOpen(false);
        setNewHandout({ title: "", url: "", description: "" });
      }
    });
  };

  const filteredHandouts = materials?.filter(m => 
    m.title.toLowerCase().includes(search.toLowerCase()) || 
    m.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto py-8 px-6 w-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-display font-bold mb-2">Handouts</h1>
          <p className="text-muted-foreground">Upload and share lecture notes and course handouts</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-transform font-semibold h-11 px-6 w-full md:w-auto">
              <Upload className="w-4 h-4 mr-2" /> Upload Handout
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle className="font-display text-xl">Upload Handout</DialogTitle>
            </DialogHeader>
            <div className="grid gap-5 py-4">
              <div className="grid gap-2">
                <Label>Title *</Label>
                <Input 
                  value={newHandout.title} 
                  onChange={e => setNewHandout({...newHandout, title: e.target.value})} 
                  placeholder="e.g. Week 5 Lecture Notes" 
                  className="bg-secondary/30 border-transparent focus-visible:border-primary"
                />
              </div>
              <div className="grid gap-2">
                <Label>File URL *</Label>
                <Input 
                  value={newHandout.url} 
                  onChange={e => setNewHandout({...newHandout, url: e.target.value})} 
                  placeholder="https://..." 
                  className="bg-secondary/30 border-transparent focus-visible:border-primary"
                />
              </div>
              <div className="grid gap-2">
                <Label>Description</Label>
                <Input 
                  value={newHandout.description} 
                  onChange={e => setNewHandout({...newHandout, description: e.target.value})} 
                  placeholder="Brief description..." 
                  className="bg-secondary/30 border-transparent focus-visible:border-primary"
                />
              </div>
              <Button onClick={handleUpload} disabled={createMaterial.isPending} size="lg" className="mt-4 rounded-xl">
                {createMaterial.isPending ? "Uploading..." : "Upload Handout"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative mb-8 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search handouts..." 
          className="pl-10 h-12 bg-card border-border/60 rounded-xl shadow-sm focus-visible:ring-primary/20 text-md"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1,2,3].map(i => (
            <div key={i} className="h-48 bg-card rounded-2xl border border-border/50"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHandouts?.map(handout => (
            <div key={handout.id} className="bg-card rounded-2xl p-6 border border-border/50 shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 group flex flex-col">
              <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6" />
              </div>
              
              <h3 className="font-bold font-display text-lg mb-2 line-clamp-2" title={handout.title}>
                {handout.title}
              </h3>
              
              <p className="text-sm text-muted-foreground mb-6 line-clamp-2 flex-1">
                {handout.description || "Lecture handout"}
              </p>
              
              <div className="flex items-center justify-between pt-4 border-t border-border/50 mt-auto">
                <div className="flex items-center gap-2">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={handout.uploader?.profileImageUrl || undefined} />
                    <AvatarFallback className="text-[10px]">{handout.uploader?.firstName?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-medium text-foreground/70">
                    {handout.uploader?.firstName}
                  </span>
                </div>
                
                <a 
                  href={handout.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-600 hover:text-white px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </a>
              </div>
            </div>
          ))}
          {filteredHandouts?.length === 0 && (
            <div className="col-span-full py-20 text-center text-muted-foreground bg-card rounded-3xl border border-dashed border-border">
              <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
              <h3 className="text-lg font-bold text-foreground mb-1">No handouts yet</h3>
              <p>Be the first to upload a handout for this course!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
