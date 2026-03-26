import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Heart, MessageCircle, Send, Image as ImageIcon, Bookmark, MoreHorizontal, X, Crown } from "lucide-react";
import { usePosts, useCreatePost, useCreateComment } from "@/hooks/use-posts";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { PremiumGate } from "@/components/premium-gate";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

function useLikePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (postId: number) => {
      const res = await apiRequest("POST", `/api/posts/${postId}/like`);
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/posts"] }); },
  });
}

const STORY_AVATARS = [
  { name: "Ahmed K.", color: "from-pink-500 to-orange-400" },
  { name: "Ngozi A.", color: "from-purple-500 to-pink-400" },
  { name: "Emeka O.", color: "from-blue-500 to-cyan-400" },
  { name: "Fatima M.", color: "from-green-500 to-emerald-400" },
  { name: "Chidi N.", color: "from-amber-500 to-yellow-400" },
  { name: "Aisha B.", color: "from-red-500 to-pink-400" },
  { name: "Tunde F.", color: "from-indigo-500 to-blue-400" },
];

export default function Feed() {
  const { user } = useAuth();
  const { data: posts, isLoading } = usePosts();
  const createPost = useCreatePost();
  const createComment = useCreateComment();
  const likePost = useLikePost();
  const { toast } = useToast();
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostImage, setNewPostImage] = useState("");
  const [showImageInput, setShowImageInput] = useState(false);
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});
  const [expandedComments, setExpandedComments] = useState<Record<number, boolean>>({});

  const handleCreatePost = () => {
    if (!newPostContent.trim()) return;
    createPost.mutate({ content: newPostContent, imageUrl: newPostImage || undefined } as any, {
      onSuccess: () => {
        setNewPostContent("");
        setNewPostImage("");
        setShowImageInput(false);
      }
    });
  };

  const handleCreateComment = (postId: number) => {
    const content = commentInputs[postId];
    if (!content?.trim()) return;
    createComment.mutate({ postId, data: { content } } as any, {
      onSuccess: () => setCommentInputs(prev => ({ ...prev, [postId]: "" }))
    });
  };

  const handleLike = (postId: number) => {
    likePost.mutate(postId);
  };

  if (isLoading) {
    return (
      <div className="max-w-xl mx-auto py-8 px-4 space-y-6">
        {[1,2,3].map(i => (
          <div key={i} className="bg-card rounded-2xl border border-border/50 overflow-hidden animate-pulse">
            <div className="p-4 flex gap-3">
              <div className="w-10 h-10 rounded-full bg-secondary"></div>
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-secondary rounded w-1/3"></div>
                <div className="h-2 bg-secondary rounded w-1/4"></div>
              </div>
            </div>
            <div className="h-64 bg-secondary"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-4 px-2 sm:px-4 w-full pb-20 md:pb-4">
      {/* Stories Row */}
      <div className="mb-4 overflow-x-auto">
        <div className="flex gap-4 pb-2 px-1 min-w-max">
          {/* My Story */}
          <div className="flex flex-col items-center gap-1.5 cursor-pointer">
            <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-primary to-primary/60 relative">
              <div className="w-full h-full rounded-full bg-card flex items-center justify-center border-2 border-background">
                <Avatar className="w-full h-full">
                  <AvatarImage src={user?.profileImageUrl || undefined} />
                  <AvatarFallback className="text-lg font-bold bg-primary/10 text-primary">
                    {user?.firstName?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center border-2 border-background">
                  <span className="text-white text-xs font-bold leading-none">+</span>
                </div>
              </div>
            </div>
            <span className="text-xs text-muted-foreground font-medium max-w-[60px] truncate">Your Story</span>
          </div>
          {STORY_AVATARS.map((s, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 cursor-pointer">
              <div className={`w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr ${s.color}`}>
                <div className="w-full h-full rounded-full bg-card flex items-center justify-center border-2 border-background">
                  <span className="text-base font-bold text-foreground">{s.name.charAt(0)}</span>
                </div>
              </div>
              <span className="text-xs text-muted-foreground font-medium max-w-[60px] truncate">{s.name.split(" ")[0]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Post Composer */}
      {user?.isPremium ? (
        <div className="bg-card rounded-2xl border border-border/50 mb-4 overflow-hidden shadow-sm">
          <div className="p-4 flex gap-3">
            <Avatar className="w-10 h-10 border border-border shrink-0">
              <AvatarImage src={user?.profileImageUrl || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <Textarea
              placeholder={`What's on your mind, ${user?.firstName}?`}
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              className="min-h-[80px] text-[15px] resize-none border-none focus-visible:ring-0 p-0 bg-transparent"
            />
          </div>

          {showImageInput && (
            <div className="px-4 pb-3 flex gap-2">
              <Input
                placeholder="Paste image URL..."
                value={newPostImage}
                onChange={e => setNewPostImage(e.target.value)}
                className="text-sm rounded-xl bg-secondary/30 border-transparent"
              />
              <Button size="icon" variant="ghost" onClick={() => { setShowImageInput(false); setNewPostImage(""); }}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          {newPostImage && (
            <div className="px-4 pb-3">
              <img src={newPostImage} alt="Preview" className="rounded-xl w-full max-h-48 object-cover border border-border/30" />
            </div>
          )}

          <div className="flex items-center justify-between px-4 py-3 border-t border-border/40">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground rounded-full gap-2"
              onClick={() => setShowImageInput(!showImageInput)}
            >
              <ImageIcon className="w-4 h-4" />
              <span className="text-sm font-medium">Photo</span>
            </Button>
            <Button
              onClick={handleCreatePost}
              disabled={createPost.isPending || !newPostContent.trim()}
              size="sm"
              className="rounded-full px-6 font-semibold shadow-sm shadow-primary/20"
            >
              {createPost.isPending ? "Posting..." : "Post"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border/50 mb-4 overflow-hidden shadow-sm">
          <div className="p-4 flex gap-3 items-center">
            <Avatar className="w-10 h-10 border border-border shrink-0">
              <AvatarImage src={user?.profileImageUrl || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">Upgrade to Premium to share posts with campus</p>
              <div className="flex items-center gap-1.5 bg-amber-500/10 text-amber-600 border border-amber-400/30 rounded-full px-3 py-1.5 text-xs font-semibold shrink-0">
                <Crown className="w-3.5 h-3.5" />
                Premium
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Posts */}
      <div className="space-y-4">
        {posts?.map(post => {
          const showComments = expandedComments[post.id];
          return (
            <div key={post.id} className="bg-card rounded-2xl border border-border/50 overflow-hidden shadow-sm">
              {/* Post Header */}
              <div className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <div className={`p-0.5 rounded-full bg-gradient-to-tr from-primary/80 to-primary/40`}>
                    <Avatar className="w-10 h-10 border-2 border-background">
                      <AvatarImage src={(post as any).user?.profileImageUrl || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                        {(post as any).user?.firstName?.charAt(0)}{(post as any).user?.lastName?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-bold leading-none">{(post as any).user?.firstName} {(post as any).user?.lastName}</p>
                      {(post as any).user?.isPremium && <Crown className="w-3 h-3 text-amber-500" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                      {(post as any).user?.role} • {post.createdAt ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }) : ""}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="rounded-full w-8 h-8">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>

              {/* Post Image */}
              {post.imageUrl && (
                <div className="w-full aspect-square bg-secondary overflow-hidden">
                  <img src={post.imageUrl} alt="Post" className="w-full h-full object-cover" />
                </div>
              )}

              {/* Action Buttons */}
              <div className="px-3 pt-2 pb-1 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <button
                    className={`flex items-center gap-1.5 px-2 py-1.5 rounded-full transition-all active:scale-90 ${(post as any).isLiked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'}`}
                    onClick={() => handleLike(post.id)}
                    data-testid={`like-button-${post.id}`}
                  >
                    <Heart className={`w-6 h-6 ${(post as any).isLiked ? 'fill-current' : ''}`} />
                  </button>
                  <button
                    className="flex items-center gap-1.5 px-2 py-1.5 rounded-full text-muted-foreground hover:text-foreground transition-all"
                    onClick={() => setExpandedComments(prev => ({ ...prev, [post.id]: !prev[post.id] }))}
                  >
                    <MessageCircle className="w-6 h-6" />
                  </button>
                  <button className="flex items-center gap-1.5 px-2 py-1.5 rounded-full text-muted-foreground hover:text-foreground transition-all">
                    <Send className="w-6 h-6" />
                  </button>
                </div>
                <button className="px-2 py-1.5 rounded-full text-muted-foreground hover:text-foreground transition-all">
                  <Bookmark className="w-6 h-6" />
                </button>
              </div>

              {/* Likes Count */}
              <div className="px-4 pb-1">
                <p className="text-sm font-bold">{(post as any).likesCount || 0} {(post as any).likesCount === 1 ? 'like' : 'likes'}</p>
              </div>

              {/* Post Content */}
              <div className="px-4 pb-2">
                <span className="text-sm font-bold">{(post as any).user?.firstName} </span>
                <span className="text-sm text-foreground/90 whitespace-pre-wrap">{post.content}</span>
              </div>

              {/* View Comments Toggle */}
              {(post as any).comments?.length > 0 && (
                <button
                  className="px-4 pb-1 text-sm text-muted-foreground font-medium"
                  onClick={() => setExpandedComments(prev => ({ ...prev, [post.id]: !prev[post.id] }))}
                >
                  {showComments ? "Hide comments" : `View all ${(post as any).comments?.length} comments`}
                </button>
              )}

              {/* Comments */}
              {showComments && (
                <div className="px-4 pb-2 space-y-2">
                  {(post as any).comments?.map((comment: any) => (
                    <div key={comment.id} className="flex gap-2">
                      <Avatar className="w-7 h-7 shrink-0">
                        <AvatarImage src={comment.user?.profileImageUrl || undefined} />
                        <AvatarFallback className="text-xs bg-secondary">{comment.user?.firstName?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="bg-secondary/40 rounded-2xl px-3 py-2 flex-1">
                        <span className="text-xs font-bold">{comment.user?.firstName} {comment.user?.lastName} </span>
                        <span className="text-xs text-foreground/80">{comment.content}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Comment Input */}
              <div className="flex gap-2 items-center px-3 pb-3 pt-1 border-t border-border/30">
                <Avatar className="w-8 h-8 shrink-0">
                  <AvatarImage src={user?.profileImageUrl || undefined} />
                  <AvatarFallback className="text-xs bg-primary/10 text-primary font-bold">{user?.firstName?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 flex gap-2 bg-secondary/30 rounded-full px-4 py-2">
                  <input
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    placeholder="Add a comment..."
                    value={commentInputs[post.id] || ""}
                    onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleCreateComment(post.id); }}
                  />
                  {commentInputs[post.id]?.trim() && (
                    <button
                      className="text-primary font-bold text-sm"
                      onClick={() => handleCreateComment(post.id)}
                      disabled={createComment.isPending}
                    >
                      Post
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {posts?.length === 0 && (
          <div className="text-center py-16 bg-card rounded-2xl border border-dashed border-border">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-bold text-lg mb-2">No posts yet</h3>
            <p className="text-muted-foreground">Be the first to share something with campus!</p>
          </div>
        )}
      </div>
    </div>
  );
}
