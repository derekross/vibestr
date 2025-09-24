import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { NostrEvent } from '@nostrify/nostrify';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  MessageCircle,
  Share,
  Bookmark,
  Pin
} from 'lucide-react';
import { useAuthor } from '@/hooks/useAuthor';
import { useCommunityPostReplyCount, useCommunityPostReplies } from '@/hooks/useCommunityPosts';
import { usePinnedPosts } from '@/hooks/useCommunityModeration';
import { NoteContent } from '@/components/NoteContent';
import { ZapButton } from '@/components/ZapButton';
import { PostMenu } from '@/components/community/PostMenu';
import { genUserName } from '@/lib/genUserName';
import { isPinnedPost, VIBE_CODERS_COMMUNITY_ID } from '@/lib/community';
import { formatDistanceToNow } from 'date-fns';

interface RedditStylePostProps {
  event: NostrEvent;
  onPostClick?: () => void;
}

export function RedditStylePost({ event, onPostClick }: RedditStylePostProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();

  const author = useAuthor(event.pubkey);
  const { data: replies = [] } = useCommunityPostReplies(event.id, VIBE_CODERS_COMMUNITY_ID);
  const { data: pinnedPostsEvent } = usePinnedPosts();

  const metadata = author.data?.metadata;
  const displayName = metadata?.name ?? genUserName(event.pubkey);
  const profileImage = metadata?.picture;
  const isPostPinned = isPinnedPost(event.id, pinnedPostsEvent || null);
  const createdAt = new Date(event.created_at * 1000);

  const handlePostClick = () => {
    if (onPostClick) {
      onPostClick();
    } else {
      navigate(`/community/post/${event.id}`);
    }
  };

  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer group bg-background border border-border/50"
      onClick={handlePostClick}
    >
      {/* Post Header */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-1">
        {isPostPinned && (
          <div className="flex items-center gap-1">
            <Pin className="h-3 w-3 text-green-600" />
            <Badge variant="outline" className="text-xs border-green-200 text-green-700">
              Pinned
            </Badge>
          </div>
        )}

        <Avatar className="h-6 w-6">
          <AvatarImage src={profileImage} alt={displayName} />
          <AvatarFallback className="text-xs">
            {displayName.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <span className="text-xs text-muted-foreground">
          Posted by {displayName}
        </span>

        <span className="text-xs text-muted-foreground">•</span>

        <span className="text-xs text-muted-foreground">
          {formatDistanceToNow(createdAt, { addSuffix: true })}
        </span>

        <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
          <PostMenu event={event} isReply={false} className="h-6 w-6 p-0" />
        </div>
      </div>

      {/* Post Content */}
      <div className="px-3 pb-3">
        <div className="text-sm leading-relaxed">
          <NoteContent event={event} />
        </div>
      </div>

      {/* Post Actions */}
      <div className="flex items-center gap-1 px-3 pb-3 text-xs">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 hover:bg-muted text-muted-foreground hover:text-foreground"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
        >
          <MessageCircle className="h-4 w-4 mr-1" />
          {replies.length} {replies.length === 1 ? 'Comment' : 'Comments'}
        </Button>

        <ZapButton
          target={event}
          className="h-8 px-2 hover:bg-muted text-muted-foreground hover:text-orange-500 transition-colors"
          showCount={true}
        />

        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 hover:bg-muted text-muted-foreground hover:text-foreground"
          onClick={(e) => e.stopPropagation()}
        >
          <Share className="h-4 w-4 mr-1" />
          Share
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 hover:bg-muted text-muted-foreground hover:text-foreground"
          onClick={(e) => e.stopPropagation()}
        >
          <Bookmark className="h-4 w-4 mr-1" />
          Save
        </Button>

      </div>
    </Card>
  );
}