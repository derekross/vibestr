import { useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, MessageCircle, Send } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthor } from '@/hooks/useAuthor';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useCommunityPostReplies, useVibeCodersPosts } from '@/hooks/useCommunityPosts';
import { useVibeCodersActions } from '@/hooks/useCommunityActions';
import { useToast } from '@/hooks/useToast';
import { NoteContent } from '@/components/NoteContent';
import { ZapButton } from '@/components/ZapButton';
import { PostMenu } from '@/components/community/PostMenu';
import { genUserName } from '@/lib/genUserName';
import { VIBE_CODERS_COMMUNITY_ID } from '@/lib/community';
import { formatDistanceToNow } from 'date-fns';
import type { NostrEvent } from '@nostrify/nostrify';

// Hook to get post by ID from community posts
const usePostById = (postId: string) => {
  const { data: posts = [], isLoading } = useVibeCodersPosts(200); // Get more posts to find the specific one

  const post = posts.find(p => p.id === postId) || null;

  return {
    data: post,
    isLoading: isLoading && !post, // Stop loading once we find the post
  };
};

export function PostDetail() {
  const { postId } = useParams<{ postId: string }>();
  const [replyContent, setReplyContent] = useState('');
  const [showReplyForm, setShowReplyForm] = useState(false);

  const { user } = useCurrentUser();
  const { data: post, isLoading } = usePostById(postId || '');
  const { data: replies = [] } = useCommunityPostReplies(postId || '', VIBE_CODERS_COMMUNITY_ID);
  const { publishReply } = useVibeCodersActions();
  const { toast } = useToast();

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!replyContent.trim() || !post) {
      return;
    }

    try {
      await publishReply.mutateAsync({
        content: replyContent.trim(),
        parentEventId: post.id,
        parentAuthorPubkey: post.pubkey,
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardContent className="p-8 text-center">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-muted rounded w-1/4"></div>
                  <div className="h-8 bg-muted rounded w-3/4"></div>
                  <div className="h-20 bg-muted rounded"></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardContent className="p-8 text-center">
                <h2 className="text-xl font-semibold mb-2">Post not found</h2>
                <p className="text-muted-foreground mb-4">
                  The post you're looking for doesn't exist or has been deleted.
                </p>
                <Button asChild>
                  <Link to="/community">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Community
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Back Button */}
          <Button variant="ghost" asChild>
            <Link to="/community">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Community
            </Link>
          </Button>

          {/* Main Post */}
          <PostDetailCard
            event={post}
            showReplyForm={showReplyForm}
            setShowReplyForm={setShowReplyForm}
          />

          {/* Reply Form */}
          {user && showReplyForm && (
            <Card>
              <CardContent className="p-4">
                <form onSubmit={handleReplySubmit} className="space-y-4">
                  <div className="flex items-start gap-3">
                    <UserAvatar pubkey={user.pubkey} size="sm" />
                    <div className="flex-1">
                      <Textarea
                        placeholder="What are your thoughts?"
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        className="min-h-[80px] resize-none"
                        disabled={publishReply.isPending}
                      />
                      <div className="flex justify-end mt-2">
                        <Button
                          type="submit"
                          disabled={!replyContent.trim() || publishReply.isPending}
                          size="sm"
                        >
                          {publishReply.isPending ? (
                            'Posting...'
                          ) : (
                            <>
                              <Send className="h-4 w-4 mr-2" />
                              Comment
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Replies */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Comments ({replies.length})
            </h3>

            {replies.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    No comments yet. Be the first to share your thoughts!
                  </p>
                </CardContent>
              </Card>
            ) : (
              // Show only top-level replies (replies directly to the post)
              replies
                .filter(reply => {
                  const replyETags = reply.tags.filter(([name]) => name === 'e');
                  // Top-level reply should have post ID as the first or only e-tag
                  const firstETag = replyETags[0];
                  return firstETag && firstETag[1] === post?.id;
                })
                .map((reply) => (
                  <ReplyCard
                    key={reply.id}
                    event={reply}
                    depth={0}
                    allReplies={replies}
                    postId={post?.id || ''}
                  />
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PostDetailCard({
  event,
  showReplyForm,
  setShowReplyForm
}: {
  event: NostrEvent;
  showReplyForm: boolean;
  setShowReplyForm: (show: boolean) => void;
}) {
  const author = useAuthor(event.pubkey);
  const metadata = author.data?.metadata;
  const displayName = metadata?.name ?? genUserName(event.pubkey);
  const profileImage = metadata?.picture;
  const createdAt = new Date(event.created_at * 1000);

  return (
    <Card>
      <CardContent className="p-6">
        {/* Post Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={profileImage} alt={displayName} />
              <AvatarFallback className="text-sm">
                {displayName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{displayName}</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(createdAt, { addSuffix: true })}
              </p>
            </div>
          </div>
          <PostMenu event={event} isReply={false} />
        </div>

        {/* Post Content */}
        <div className="prose prose-sm max-w-none mb-6">
          <NoteContent event={event} />
        </div>

        <Separator className="my-4" />

        {/* Post Actions */}
        <div className="flex items-center gap-4">
          <ZapButton
            target={event}
            className="gap-2 hover:bg-orange-50 hover:text-orange-600"
            showCount={true}
          />
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={() => setShowReplyForm(!showReplyForm)}
          >
            <MessageCircle className="h-4 w-4" />
            {showReplyForm ? 'Hide Reply' : 'Reply'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ReplyCard({ event, depth = 0, allReplies, postId }: {
  event: NostrEvent;
  depth?: number;
  allReplies: NostrEvent[];
  postId: string;
}) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');

  const { user } = useCurrentUser();
  const { publishReply } = useVibeCodersActions();
  const { toast } = useToast();

  const author = useAuthor(event.pubkey);
  const metadata = author.data?.metadata;
  const displayName = metadata?.name ?? genUserName(event.pubkey);
  const profileImage = metadata?.picture;
  const createdAt = new Date(event.created_at * 1000);

  // Find direct replies to this comment
  const directReplies = allReplies.filter(reply => {
    const replyETags = reply.tags.filter(([name]) => name === 'e');
    // Check if this reply references this comment as its most recent parent
    const lastETag = replyETags[replyETags.length - 1];
    return lastETag && lastETag[1] === event.id;
  });

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!replyContent.trim()) {
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

  const marginLeft = Math.min(depth * 20, 60); // Max indent of 60px

  return (
    <div className="space-y-3">
      <Card className={`border-l-2 border-l-blue-100`} style={{ marginLeft: `${marginLeft}px` }}>
        <CardContent className="p-4">
          {/* Reply Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={profileImage} alt={displayName} />
                <AvatarFallback className="text-xs">
                  {displayName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{displayName}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(createdAt, { addSuffix: true })}
                </p>
              </div>
            </div>
            <PostMenu event={event} isReply={true} />
          </div>

          {/* Reply Content */}
          <div className="text-sm mb-3">
            <NoteContent event={event} />
          </div>

          {/* Reply Actions */}
          <div className="flex items-center gap-2">
            <ZapButton
              target={event}
              className="h-8 px-2 hover:bg-orange-50 hover:text-orange-600 text-xs"
              showCount={true}
            />
            {user && depth < 3 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="h-8 px-2 text-xs"
              >
                <MessageCircle className="h-3 w-3 mr-1" />
                Reply
              </Button>
            )}
          </div>

          {/* Reply Form */}
          {showReplyForm && user && (
            <div className="mt-4 pt-3 border-t">
              <form onSubmit={handleReplySubmit} className="space-y-3">
                <div className="flex items-start gap-2">
                  <UserAvatar pubkey={user.pubkey} size="sm" />
                  <div className="flex-1">
                    <Textarea
                      placeholder="Write a reply..."
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      className="min-h-[60px] resize-none text-sm"
                      disabled={publishReply.isPending}
                    />
                    <div className="flex justify-end gap-2 mt-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowReplyForm(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={!replyContent.trim() || publishReply.isPending}
                        size="sm"
                      >
                        {publishReply.isPending ? 'Posting...' : 'Reply'}
                      </Button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Nested Replies */}
      {directReplies.length > 0 && (
        <div className="space-y-3">
          {directReplies.map((reply) => (
            <ReplyCard
              key={reply.id}
              event={reply}
              depth={depth + 1}
              allReplies={allReplies}
              postId={postId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function UserAvatar({ pubkey, size = 'default' }: { pubkey: string; size?: 'sm' | 'default' }) {
  const author = useAuthor(pubkey);
  const metadata = author.data?.metadata;
  const displayName = metadata?.name ?? genUserName(pubkey);
  const profileImage = metadata?.picture;

  const sizeClass = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10';
  const textSizeClass = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <Avatar className={sizeClass}>
      <AvatarImage src={profileImage} alt={displayName} />
      <AvatarFallback className={textSizeClass}>
        {displayName.slice(0, 2).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}