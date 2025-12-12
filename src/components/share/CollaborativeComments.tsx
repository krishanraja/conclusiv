import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { MessageCircle, Send, User, Reply, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface Comment {
  id: string;
  narrative_id: string;
  user_id: string | null;
  author_name: string | null;
  section_id: string | null;
  content: string;
  parent_id: string | null;
  created_at: string;
  replies?: Comment[];
}

interface CollaborativeCommentsProps {
  narrativeId: string;
  sectionId?: string;
  isOwner?: boolean;
}

export const CollaborativeComments = ({ narrativeId, sectionId, isOwner = false }: CollaborativeCommentsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadComments();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel(`comments-${narrativeId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'narrative_comments',
          filter: `narrative_id=eq.${narrativeId}`,
        },
        () => {
          loadComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [narrativeId]);

  const loadComments = async () => {
    try {
      const { data, error } = await supabase
        .from("narrative_comments")
        .select("*")
        .eq("narrative_id", narrativeId)
        .order("created_at", { ascending: true });

      if (!error && data) {
        // Organize comments into threads
        const topLevel = data.filter(c => !c.parent_id);
        const withReplies = topLevel.map(comment => ({
          ...comment,
          replies: data.filter(c => c.parent_id === comment.id),
        }));
        setComments(withReplies);
      }
    } catch (err) {
      console.error("Failed to load comments:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    if (!user && !authorName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter your name to leave a comment.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("narrative_comments")
        .insert({
          narrative_id: narrativeId,
          user_id: user?.id || null,
          author_name: user ? null : authorName.trim(),
          section_id: sectionId || null,
          content: newComment.trim(),
          parent_id: replyingTo,
        });

      if (error) throw error;

      setNewComment("");
      setReplyingTo(null);
      toast({
        title: "Comment added",
        description: "Your feedback has been posted.",
      });
    } catch (err) {
      toast({
        title: "Failed to post",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from("narrative_comments")
        .delete()
        .eq("id", commentId);

      if (!error) {
        toast({
          title: "Comment deleted",
        });
      }
    } catch (err) {
      toast({
        title: "Failed to delete",
        variant: "destructive",
      });
    }
  };

  const handleReply = (commentId: string) => {
    setReplyingTo(commentId);
    commentInputRef.current?.focus();
  };

  // Filter comments by section if specified
  const filteredComments = sectionId 
    ? comments.filter(c => c.section_id === sectionId || !c.section_id)
    : comments;

  const commentCount = filteredComments.reduce(
    (acc, c) => acc + 1 + (c.replies?.length || 0),
    0
  );

  return (
    <div className="space-y-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50 hover:border-primary/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Comments & Feedback</span>
          {commentCount > 0 && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              {commentCount}
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4 overflow-hidden"
          >
            {/* Comment Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              {!user && (
                <Input
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="Your name"
                  className="h-9"
                />
              )}
              
              <div className="relative">
                {replyingTo && (
                  <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                    <Reply className="w-3 h-3" />
                    <span>Replying to comment</span>
                    <button
                      type="button"
                      onClick={() => setReplyingTo(null)}
                      className="text-primary hover:underline"
                    >
                      Cancel
                    </button>
                  </div>
                )}
                <Textarea
                  ref={commentInputRef}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={replyingTo ? "Write a reply..." : "Leave feedback or ask a question..."}
                  className="min-h-[60px] resize-none pr-12"
                />
                <Button
                  type="submit"
                  size="icon"
                  className="absolute bottom-2 right-2 h-8 w-8"
                  disabled={isSubmitting || !newComment.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </form>

            {/* Comments List */}
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : filteredComments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No comments yet</p>
                <p className="text-xs mt-1">Be the first to leave feedback!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredComments.map((comment) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    isOwner={isOwner}
                    currentUserId={user?.id}
                    onReply={handleReply}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface CommentItemProps {
  comment: Comment;
  isOwner: boolean;
  currentUserId?: string;
  onReply: (id: string) => void;
  onDelete: (id: string) => void;
  isReply?: boolean;
}

const CommentItem = ({ comment, isOwner, currentUserId, onReply, onDelete, isReply = false }: CommentItemProps) => {
  const canDelete = isOwner || comment.user_id === currentUserId;
  const authorDisplay = comment.author_name || "User";
  const timeAgo = formatDistanceToNow(new Date(comment.created_at), { addSuffix: true });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-3 rounded-lg border",
        isReply 
          ? "ml-6 bg-muted/20 border-border/30"
          : "bg-muted/30 border-border/50"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <User className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{authorDisplay}</span>
              <span className="text-xs text-muted-foreground">{timeAgo}</span>
            </div>
            <div className="flex items-center gap-1">
              {!isReply && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => onReply(comment.id)}
                >
                  <Reply className="w-3 h-3" />
                </Button>
              )}
              {canDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                  onClick={() => onDelete(comment.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
          <p className="text-sm text-foreground/90">{comment.content}</p>
        </div>
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3 space-y-2">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              isOwner={isOwner}
              currentUserId={currentUserId}
              onReply={onReply}
              onDelete={onDelete}
              isReply
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};