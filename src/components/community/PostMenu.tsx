import { useState } from 'react';
import type { NostrEvent } from '@nostrify/nostrify';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { 
  MoreHorizontal,
  Share,
  Pin,
  Trash2,
  UserX,
  Copy,
  ExternalLink
} from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useVibeCodersCommunity } from '@/hooks/useCommunity';
import { useVibeCodersActions } from '@/hooks/useCommunityActions';
import { usePinnedPosts } from '@/hooks/useCommunityModeration';
import { useToast } from '@/hooks/useToast';
import { isModerator, isPinnedPost } from '@/lib/community';

interface PostMenuProps {
  event: NostrEvent;
  /** Whether this is a reply (affects available actions) */
  isReply?: boolean;
  /** Custom className for the trigger button */
  className?: string;
}

export function PostMenu({ event, isReply = false, className }: PostMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const { user } = useCurrentUser();
  const { data: community } = useVibeCodersCommunity();
  const { data: pinnedPostsEvent } = usePinnedPosts();
  const { pinPost, removePost, banUser } = useVibeCodersActions();
  const { toast } = useToast();

  const isUserModerator = user && community && isModerator(user.pubkey, community);
  const isPostPinned = !isReply && isPinnedPost(event.id, pinnedPostsEvent || null);
  const isOwnPost = user && event.pubkey === user.pubkey;

  const handleSharePost = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const baseUrl = window.location.origin;
    const postUrl = isReply 
      ? `${baseUrl}/post/${event.id}` // For replies, link directly to the reply
      : `${baseUrl}/post/${event.id}`; // For posts, link to the post
    
    try {
      await navigator.clipboard.writeText(postUrl);
      toast({
        title: "Link copied!",
        description: `${isReply ? 'Reply' : 'Post'} link has been copied to your clipboard.`,
      });
    } catch {
      // Fallback for browsers that don't support clipboard API
      try {
        const textArea = document.createElement('textarea');
        textArea.value = postUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        toast({
          title: "Link copied!",
          description: `${isReply ? 'Reply' : 'Post'} link has been copied to your clipboard.`,
        });
      } catch {
        toast({
          title: "Error",
          description: "Failed to copy link. Please try again.",
          variant: "destructive",
        });
      }
    }
    setIsOpen(false);
  };

  const handleCopyEventId = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await navigator.clipboard.writeText(event.id);
      toast({
        title: "Event ID copied!",
        description: "The event ID has been copied to your clipboard.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to copy event ID. Please try again.",
        variant: "destructive",
      });
    }
    setIsOpen(false);
  };

  const handleViewRaw = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const eventJson = JSON.stringify(event, null, 2);
    const blob = new Blob([eventJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    URL.revokeObjectURL(url);
    setIsOpen(false);
  };

  const handlePinPost = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isReply) return; // Can't pin replies
    
    try {
      await pinPost.mutateAsync({
        postId: event.id,
        action: isPostPinned ? 'unpin' : 'pin',
      });
      toast({
        title: isPostPinned ? "Post unpinned" : "Post pinned",
        description: isPostPinned 
          ? "Post has been unpinned from the community." 
          : "Post has been pinned to the community.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to update pin status. Please try again.",
        variant: "destructive",
      });
    }
    setIsOpen(false);
  };

  const handleRemovePost = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await removePost.mutateAsync({
        postId: event.id,
        authorPubkey: event.pubkey,
        originalKind: event.kind,
        reason: `${isReply ? 'Reply' : 'Post'} removed by moderator`,
      });
      toast({
        title: `${isReply ? 'Reply' : 'Post'} removed`,
        description: `The ${isReply ? 'reply' : 'post'} has been removed from the community.`,
      });
    } catch {
      toast({
        title: "Error",
        description: `Failed to remove ${isReply ? 'reply' : 'post'}. Please try again.`,
        variant: "destructive",
      });
    }
    setIsOpen(false);
  };

  const handleBanUser = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isOwnPost) {
      toast({
        title: "Error",
        description: "You cannot ban yourself.",
        variant: "destructive",
      });
      return;
    }

    try {
      await banUser.mutateAsync({
        userPubkey: event.pubkey,
        action: 'ban',
      });
      toast({
        title: "User banned",
        description: "The user has been banned from the community.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to ban user. Please try again.",
        variant: "destructive",
      });
    }
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={className}
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">More options</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {/* Everyone can share */}
        <DropdownMenuItem onClick={handleSharePost}>
          <Share className="h-4 w-4 mr-2" />
          Share {isReply ? 'reply' : 'post'}
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={handleCopyEventId}>
          <Copy className="h-4 w-4 mr-2" />
          Copy event ID
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={handleViewRaw}>
          <ExternalLink className="h-4 w-4 mr-2" />
          View raw event
        </DropdownMenuItem>
        
        {/* Moderator actions */}
        {isUserModerator && (
          <>
            <DropdownMenuSeparator />
            
            {/* Pin/Unpin - only for posts, not replies */}
            {!isReply && (
              <DropdownMenuItem onClick={handlePinPost}>
                <Pin className="h-4 w-4 mr-2" />
                {isPostPinned ? 'Unpin post' : 'Pin post'}
              </DropdownMenuItem>
            )}
            
            {/* Remove post/reply */}
            <DropdownMenuItem 
              onClick={handleRemovePost}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remove {isReply ? 'reply' : 'post'}
            </DropdownMenuItem>
            
            {/* Ban user - only if not own post */}
            {!isOwnPost && (
              <DropdownMenuItem 
                onClick={handleBanUser}
                className="text-destructive focus:text-destructive"
              >
                <UserX className="h-4 w-4 mr-2" />
                Ban user
              </DropdownMenuItem>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}