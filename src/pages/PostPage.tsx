import { useParams, Link } from 'react-router-dom';
import { useSeoMeta } from '@unhead/react';
import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MessageSquare, ExternalLink } from 'lucide-react';
import { CommunityPost } from '@/components/community/CommunityPost';
import { RelaySelector } from '@/components/RelaySelector';
import { validateCommunityPost, validateCommunityReply } from '@/lib/community';
import type { NostrEvent } from '@nostrify/nostrify';


function ViewParentPostButton({ post }: { post: NostrEvent }) {
  const { nostr } = useNostr();

  const { data: threadInfo, isLoading } = useQuery({
    queryKey: ['thread-info', post.id],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);

      try {
        const eTags = post.tags.filter(([name]) => name === 'e');
        if (eTags.length === 0) {
          return null;
        }

        const parentEventId = eTags[eTags.length - 1]?.[1]; // Last e-tag is direct parent
        const rootEventId = eTags[0]?.[1]; // First e-tag is usually the root

        if (!parentEventId) {
          return null;
        }

        // Fetch both parent and root (if different)
        const eventIds = [parentEventId];
        if (rootEventId && rootEventId !== parentEventId) {
          eventIds.push(rootEventId);
        }

        const events = await nostr.query([{
          ids: eventIds,
          limit: eventIds.length,
        }], { signal });

        const parentPost = events.find(e => e.id === parentEventId);
        const rootPost = events.find(e => e.id === rootEventId);

        return {
          parentPost,
          rootPost: rootPost && rootPost.id !== parentEventId ? rootPost : null,
          isNestedReply: eTags.length > 1 || (parentPost && parentPost.tags.some(([name]) => name === 'e'))
        };
      } catch (error) {
        console.error('Error fetching thread info:', error);
        return null;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  if (isLoading) {
    return (
      <Button variant="default" size="sm" disabled>
        Loading...
      </Button>
    );
  }

  if (!threadInfo) {
    return (
      <Link to="/">
        <Button variant="default" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          View Community Feed
        </Button>
      </Link>
    );
  }

  // If this is a nested reply and we have a root post, show "View Root Thread"
  if (threadInfo.isNestedReply && threadInfo.rootPost) {
    return (
      <div className="flex gap-2">
        <Link to={`/post/${threadInfo.rootPost.id}`}>
          <Button variant="default" size="sm">
            <MessageSquare className="h-4 w-4 mr-2" />
            View Root Thread
          </Button>
        </Link>
        {threadInfo.parentPost && (
          <Link to={`/post/${threadInfo.parentPost.id}`}>
            <Button variant="outline" size="sm">
              <ExternalLink className="h-4 w-4 mr-2" />
              View Parent
            </Button>
          </Link>
        )}
      </div>
    );
  }

  // Otherwise, just show parent post button
  if (threadInfo.parentPost) {
    return (
      <Link to={`/post/${threadInfo.parentPost.id}`}>
        <Button variant="default" size="sm">
          <ExternalLink className="h-4 w-4 mr-2" />
          View Parent Post
        </Button>
      </Link>
    );
  }

  return (
    <Link to="/">
      <Button variant="default" size="sm">
        <ArrowLeft className="h-4 w-4 mr-2" />
        View Community Feed
      </Button>
    </Link>
  );
}

function usePostById(eventId: string) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['post', eventId],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);

      try {
        // Query for the specific event by ID
        const events = await nostr.query([{
          ids: [eventId],
          limit: 1,
        }], { signal });

        const event = events[0];
        if (!event) {
          return null;
        }

        // Validate that it's a community post or reply
        const isValidPost = validateCommunityPost(event);
        const isValidReply = validateCommunityReply(event);

        if (!isValidPost && !isValidReply) {
          return null;
        }

        return event;
      } catch (error) {
        console.error('Error fetching post:', error);
        return null;
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2,
    enabled: !!eventId,
  });
}

export default function PostPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { data: post, isLoading, error } = usePostById(eventId || '');

  useSeoMeta({
    title: post ? `Post by ${post.pubkey.slice(0, 8)}... - Vibestr` : 'Post - Vibestr',
    description: post ?
      `${post.content.slice(0, 160)}${post.content.length > 160 ? '...' : ''}` :
      'View this post on Vibestr community',
  });

  if (!eventId) {
    return (
      <div className="w-full mx-auto px-2 sm:px-4 sm:container sm:max-w-4xl py-6">
        <Card className="border-destructive/50">
          <CardContent className="py-8 text-center">
            <p className="text-destructive">Invalid post URL</p>
            <p className="text-sm text-muted-foreground mt-2">
              The post ID is missing from the URL
            </p>
            <Link to="/" className="inline-block mt-4">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Community
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full mx-auto px-2 sm:px-4 sm:container sm:max-w-4xl py-6">
        <div className="space-y-4">
          {/* Back button skeleton */}
          <Skeleton className="h-10 w-32" />

          {/* Post skeleton */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-3">
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-4/5" />
                    <Skeleton className="h-4 w-3/5" />
                  </div>
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full mx-auto px-2 sm:px-4 sm:container sm:max-w-4xl py-6">
        <div className="space-y-4">
          <Link to="/">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Community
            </Button>
          </Link>

          <Card className="border-destructive/50">
            <CardContent className="py-8 text-center">
              <p className="text-destructive">Failed to load post</p>
              <p className="text-sm text-muted-foreground mt-2">
                There was an error loading this post. Please check your connection and try again.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="w-full mx-auto px-2 sm:px-4 sm:container sm:max-w-4xl py-6">
        <div className="space-y-4">
          <Link to="/">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Community
            </Button>
          </Link>

          <Card className="border-dashed">
            <CardContent className="py-12 px-8 text-center">
              <div className="max-w-sm mx-auto space-y-6">
                <div className="space-y-2">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground" />
                  <h3 className="font-semibold">Post not found</h3>
                  <p className="text-muted-foreground text-sm">
                    This post doesn't exist or isn't available on the current relay.
                  </p>
                </div>
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Try switching to a different relay:
                  </p>
                  <RelaySelector className="w-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Determine if this is a reply by checking for 'e' tags
  const eTags = post.tags.filter(([name]) => name === 'e');
  const isReply = eTags.length > 0;

  return (
    <div className="w-full mx-auto px-2 sm:px-4 sm:container sm:max-w-4xl py-6">
      <div className="space-y-4">
        {/* Back button */}
        <Link to="/">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Community
          </Button>
        </Link>

        {/* Post header */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">
            {isReply ? 'Reply' : 'Post'}
          </h1>
          <p className="text-muted-foreground text-sm">
            Viewing individual {isReply ? 'reply' : 'post'} from the Vibestr community
          </p>
        </div>

        {/* The actual post */}
        <CommunityPost event={post} showReplies={true} />

        {/* Additional context for replies */}
        {isReply && (
          <Card className="border-dashed">
            <CardContent className="py-6 text-center">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  This is a reply to another post in the conversation.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                  <ViewParentPostButton post={post} />
                  <Link to="/">
                    <Button variant="outline" size="sm">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      View Community Feed
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}