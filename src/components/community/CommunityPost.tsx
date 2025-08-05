import { useState } from 'react';
import type { NostrEvent } from '@nostrify/nostrify';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  MessageCircle,
  Pin,
  Clock,
  Reply,
  ChevronDown,
  ChevronUp,
  Heart
} from 'lucide-react';
import { useAuthor } from '@/hooks/useAuthor';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useCommunityPostReplies } from '@/hooks/useCommunityPosts';
import { useVibeCodersActions } from '@/hooks/useCommunityActions';
import { usePinnedPosts } from '@/hooks/useCommunityModeration';
import { useEventReactions, useUserReaction, useReactionActions } from '@/hooks/useReactions';
import { useToast } from '@/hooks/useToast';
import { NoteContent } from '@/components/NoteContent';
import { PostMenu } from '@/components/community/PostMenu';
import { genUserName } from '@/lib/genUserName';
import { isPinnedPost, VIBE_CODERS_COMMUNITY_ID } from '@/lib/community';
import { formatDistanceToNow } from 'date-fns';


// Reusable Like Button Component
function LikeButton({ event, size = "sm" }: { event: NostrEvent; size?: "sm" | "xs" }) {
  const { user } = useCurrentUser();
  const { data: reactions, isLoading: reactionsLoading } = useEventReactions(event.id);
  const { hasLiked, userReaction } = useUserReaction(event.id);
  const { likePost, removeReaction, isLoading } = useReactionActions();

  const handleLike = async () => {
    if (!user) return;

    try {
      if (hasLiked && userReaction) {
        // Remove the existing like
        await removeReaction(userReaction);
      } else {
        // Add a like
        await likePost(event);
      }
    } catch {
      // Error handling is done in the hook
    }
  };

  const likeCount = reactions?.likeCount || 0;
  const iconSize = size === "xs" ? "h-3 w-3" : "h-4 w-4";
  const extraClasses = size === "xs" ? "h-6 px-2 text-xs" : "";

  // Show loading state or actual count
  const displayText = reactionsLoading ? '...' : (likeCount > 0 ? likeCount : 'Like');

  // Add subtle animation classes
  const animationClasses = hasLiked ? 'transition-colors duration-200' : 'transition-colors duration-200';

  return (
    <Button
      variant="ghost"
      size={size === "xs" ? "sm" : "sm"}
      onClick={handleLike}
      disabled={!user || isLoading || reactionsLoading}
      className={`${hasLiked ? 'text-red-500 hover:text-red-600' : 'text-muted-foreground hover:text-foreground'} ${extraClasses} ${animationClasses}`}
      title={!user ? 'Log in to like posts' : hasLiked ? 'Unlike this post' : 'Like this post'}
    >
      {hasLiked ? (
        <Heart className={`${iconSize} mr-2 fill-current`} />
      ) : (
        <Heart className={`${iconSize} mr-2`} />
      )}
      {displayText}
    </Button>
  );
}

// Helper function to organize replies into a thread structure
function organizeReplies(replies: NostrEvent[], rootPostId: string) {
  const replyMap = new Map<string, NostrEvent[]>();
  const directReplies: NostrEvent[] = [];

  // First pass: categorize replies
  replies.forEach(reply => {
    const eTags = reply.tags.filter(([name]) => name === 'e');
    const lastETag = eTags[eTags.length - 1]; // Last e-tag is usually the direct parent

    if (lastETag && lastETag[1] === rootPostId) {
      // Direct reply to the root post
      directReplies.push(reply);
    } else if (lastETag) {
      // Reply to another reply
      const parentId = lastETag[1];
      if (!replyMap.has(parentId)) {
        replyMap.set(parentId, []);
      }
      replyMap.get(parentId)!.push(reply);
    }
  });

  return { directReplies, replyMap };
}

// Component to render threaded replies
function ThreadedReplies({
  replies,
  rootPostId
}: {
  replies: NostrEvent[];
  rootPostId: string;
}) {
  const { directReplies, replyMap } = organizeReplies(replies, rootPostId);

  const renderReplyWithNested = (reply: NostrEvent, depth: number = 0) => {
    const nestedReplies = replyMap.get(reply.id) || [];
    const maxDepth = 5; // Limit nesting depth to avoid too much indentation

    return (
      <div key={reply.id} className="space-y-3">
        <CommunityReply event={reply} />
        {nestedReplies.length > 0 && depth < maxDepth && (
          <div className="ml-6 space-y-3 pl-3 border-l border-muted/50">
            {nestedReplies.map(nestedReply =>
              renderReplyWithNested(nestedReply, depth + 1)
            )}
          </div>
        )}
        {nestedReplies.length > 0 && depth >= maxDepth && (
          <div className="ml-6 text-xs text-muted-foreground">
            {nestedReplies.length} more repl{nestedReplies.length === 1 ? 'y' : 'ies'}...
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {directReplies.map(reply => renderReplyWithNested(reply))}
    </div>
  );
}

interface CommunityPostProps {
  event: NostrEvent;
  showReplies?: boolean;
}

export function CommunityPost({ event, showReplies = false }: CommunityPostProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [repliesExpanded, setRepliesExpanded] = useState(false);

  const { user } = useCurrentUser();
  const author = useAuthor(event.pubkey);
  const { data: replies } = useCommunityPostReplies(
    event.id,
    VIBE_CODERS_COMMUNITY_ID
  );


  const { data: pinnedPostsEvent } = usePinnedPosts();
  const { publishReply } = useVibeCodersActions();
  const { toast } = useToast();

  const metadata = author.data?.metadata;
  const displayName = metadata?.name ?? genUserName(event.pubkey);
  const profileImage = metadata?.picture;
  const isPostPinned = isPinnedPost(event.id, pinnedPostsEvent || null);
  const createdAt = new Date(event.created_at * 1000);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!replyContent.trim()) {
      toast({
        title: "Error",
        description: "Please enter a reply.",
        variant: "destructive",
      });
      return;
    }

    try {
      await publishReply.mutateAsync({
        content: replyContent.trim(),
        parentEventId: event.id,
        parentAuthorPubkey: event.pubkey,
      });
      setReplyContent('');
      setShowReplyForm(false);
      setRepliesExpanded(true); // Auto-expand to show the new reply
      toast({
        title: "Reply posted!",
        description: "Your reply has been added to the conversation.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to post reply. Please try again.",
        variant: "destructive",
      });
    }
  };



  return (
    <Card className={isPostPinned ? 'border-purple-200 bg-purple-50/50 dark:border-purple-800 dark:bg-purple-950/20' : ''}>
      <CardHeader className="pb-3 p-3 sm:p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={profileImage} alt={displayName} />
              <AvatarFallback className="text-sm">
                {displayName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">{displayName}</span>
                {isPostPinned && (
                  <Badge variant="secondary" className="text-xs">
                    <Pin className="h-3 w-3 mr-1" />
                    Pinned
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{formatDistanceToNow(createdAt, { addSuffix: true })}</span>
              </div>
            </div>
          </div>

          <PostMenu event={event} isReply={false} />
        </div>
      </CardHeader>

      <CardContent className="pt-0 p-3 sm:p-6">
        <div className="space-y-4">
          <div className="text-sm leading-relaxed">
            <NoteContent event={event} />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRepliesExpanded(!repliesExpanded)}
                className="text-muted-foreground hover:text-foreground"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                {replies?.length || 0} {replies?.length === 1 ? 'Reply' : 'Replies'}
                {replies && replies.length > 0 && (
                  repliesExpanded ? (
                    <ChevronUp className="h-4 w-4 ml-1" />
                  ) : (
                    <ChevronDown className="h-4 w-4 ml-1" />
                  )
                )}
              </Button>

              <LikeButton event={event} />
            </div>

            {user && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowReplyForm(!showReplyForm)}
              >
                <Reply className="h-4 w-4 mr-2" />
                Reply
              </Button>
            )}
          </div>

          {showReplyForm && user && (
            <>
              <Separator />
              <form onSubmit={handleReply} className="space-y-3">
                <div className="flex items-start space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user ? author.data?.metadata?.picture : ''} />
                    <AvatarFallback className="text-xs">
                      {user ? genUserName(user.pubkey).slice(0, 2).toUpperCase() : '??'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <Textarea
                      placeholder="Share your thoughts on this vibe coding post..."
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      className="min-h-[80px] resize-none"
                      disabled={publishReply.isPending}
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowReplyForm(false);
                          setReplyContent('');
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        size="sm"
                        disabled={!replyContent.trim() || publishReply.isPending}
                      >
                        {publishReply.isPending ? 'Posting...' : 'Post Reply'}
                      </Button>
                    </div>
                  </div>
                </div>
              </form>
            </>
          )}

          {showReplies && repliesExpanded && replies && replies.length > 0 && (
            <>
              <Separator />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    Replies ({replies.length})
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setRepliesExpanded(false)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Hide replies
                  </Button>
                </div>
                <div className="space-y-3 pl-4 border-l-2 border-muted">
                  <ThreadedReplies
                    replies={replies}
                    rootPostId={event.id}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>


    </Card>
  );
}

function CommunityReply({ event }: { event: NostrEvent }) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');

  const { user } = useCurrentUser();
  const author = useAuthor(event.pubkey);
  const { publishReply } = useVibeCodersActions();
  const { toast } = useToast();

  const metadata = author.data?.metadata;
  const displayName = metadata?.name ?? genUserName(event.pubkey);
  const profileImage = metadata?.picture;
  const createdAt = new Date(event.created_at * 1000);

  const handleReplyToReply = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!replyContent.trim()) {
      toast({
        title: "Error",
        description: "Please enter a reply.",
        variant: "destructive",
      });
      return;
    }

    try {
      await publishReply.mutateAsync({
        content: replyContent.trim(),
        parentEventId: event.id,
        parentAuthorPubkey: event.pubkey,
      });
      setReplyContent('');
      setShowReplyForm(false);
      toast({
        title: "Reply posted!",
        description: "Your reply has been added to the conversation.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to post reply. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-start space-x-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={profileImage} alt={displayName} />
          <AvatarFallback className="text-xs">
            {displayName.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{displayName}</span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(createdAt, { addSuffix: true })}
              </span>
            </div>
            <PostMenu event={event} isReply={true} className="h-6 w-6 p-0" />
          </div>
          <div className="text-sm leading-relaxed">
            <NoteContent event={event} />
          </div>

          {/* Reply Actions */}
          <div className="flex items-center gap-2">
            <LikeButton event={event} size="xs" />
            {user && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="text-xs text-muted-foreground hover:text-foreground h-6 px-2"
              >
                <Reply className="h-3 w-3 mr-1" />
                Reply
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Reply Form */}
      {showReplyForm && user && (
        <div className="ml-11 space-y-2">
          <form onSubmit={handleReplyToReply} className="space-y-2">
            <div className="flex items-start space-x-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={user ? author.data?.metadata?.picture : ''} />
                <AvatarFallback className="text-xs">
                  {user ? genUserName(user.pubkey).slice(0, 2).toUpperCase() : '??'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <Textarea
                  placeholder={`Reply to ${displayName}...`}
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className="min-h-[60px] resize-none text-sm"
                  disabled={publishReply.isPending}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowReplyForm(false);
                      setReplyContent('');
                    }}
                    className="h-7 px-2 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!replyContent.trim() || publishReply.isPending}
                    className="h-7 px-3 text-xs"
                  >
                    {publishReply.isPending ? 'Posting...' : 'Reply'}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}