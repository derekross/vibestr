import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useToast } from '@/hooks/useToast';
import type { NostrEvent } from '@nostrify/nostrify';

/**
 * Hook to fetch reactions for a specific event
 */
export function useEventReactions(eventId: string) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['reactions', eventId],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);
      
      try {
        const reactions = await nostr.query([{
          kinds: [7], // Reaction events
          '#e': [eventId],
          limit: 500, // Get up to 500 reactions
        }], { signal });

        // Group reactions by content type
        const likes = reactions.filter(r => r.content === '+' || r.content === '');
        const dislikes = reactions.filter(r => r.content === '-');
        const emojiReactions = reactions.filter(r => 
          r.content !== '+' && r.content !== '-' && r.content !== ''
        );

        return {
          all: reactions,
          likes,
          dislikes,
          emojiReactions,
          likeCount: likes.length,
          dislikeCount: dislikes.length,
        };
      } catch (error) {
        console.error('Error fetching reactions:', error);
        return {
          all: [],
          likes: [],
          dislikes: [],
          emojiReactions: [],
          likeCount: 0,
          dislikeCount: 0,
        };
      }
    },
    staleTime: 30 * 1000, // 30 seconds
    retry: 2,
    enabled: !!eventId,
  });
}

/**
 * Hook to check if current user has reacted to an event
 */
export function useUserReaction(eventId: string) {
  const { user } = useCurrentUser();
  const { data: reactions } = useEventReactions(eventId);

  if (!user || !reactions) {
    return { hasLiked: false, hasDisliked: false, userReaction: null };
  }

  const userReaction = reactions.all.find(r => r.pubkey === user.pubkey);
  const hasLiked = userReaction?.content === '+' || userReaction?.content === '';
  const hasDisliked = userReaction?.content === '-';

  return {
    hasLiked,
    hasDisliked,
    userReaction,
  };
}

/**
 * Hook to manage reactions (like, dislike, emoji reactions)
 */
export function useReactionActions() {
  const { user } = useCurrentUser();
  const { mutateAsync: createEvent } = useNostrPublish();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const publishReaction = useMutation({
    mutationFn: async ({ 
      targetEvent, 
      content = '+',
      relayHint 
    }: { 
      targetEvent: NostrEvent; 
      content?: string;
      relayHint?: string;
    }) => {
      if (!user) {
        throw new Error('User must be logged in to react');
      }

      // Build tags according to NIP-25
      const tags: string[][] = [
        ['e', targetEvent.id, relayHint || '', targetEvent.pubkey],
        ['p', targetEvent.pubkey, relayHint || ''],
        ['k', targetEvent.kind.toString()],
      ];

      // If it's an addressable event, add 'a' tag
      if (targetEvent.kind >= 30000 && targetEvent.kind < 40000) {
        const dTag = targetEvent.tags.find(([name]) => name === 'd')?.[1];
        if (dTag) {
          tags.push(['a', `${targetEvent.kind}:${targetEvent.pubkey}:${dTag}`, relayHint || '', targetEvent.pubkey]);
        }
      }

      const reactionEvent = await createEvent({
        kind: 7,
        content,
        tags,
      });

      return reactionEvent;
    },
    onSuccess: (_, variables) => {
      // Invalidate reactions query for this event
      queryClient.invalidateQueries({ 
        queryKey: ['reactions', variables.targetEvent.id] 
      });

      // Show success toast
      const reactionType = variables.content === '+' || variables.content === '' ? 'liked' : 
                          variables.content === '-' ? 'disliked' : 'reacted to';
      toast({
        title: "Reaction sent!",
        description: `You ${reactionType} this post.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send reaction. Please try again.",
        variant: "destructive",
      });
    },
  });

  const removeReaction = useMutation({
    mutationFn: async ({ 
      reactionEvent 
    }: { 
      reactionEvent: NostrEvent;
    }) => {
      if (!user) {
        throw new Error('User must be logged in to remove reactions');
      }

      // Create a deletion event (NIP-09)
      const deletionEvent = await createEvent({
        kind: 5,
        content: 'Removed reaction',
        tags: [
          ['e', reactionEvent.id],
        ],
      });

      return deletionEvent;
    },
    onSuccess: (_, variables) => {
      // Find the target event ID from the reaction
      const targetEventId = variables.reactionEvent.tags.find(([name]) => name === 'e')?.[1];
      if (targetEventId) {
        queryClient.invalidateQueries({ 
          queryKey: ['reactions', targetEventId] 
        });
      }

      toast({
        title: "Reaction removed",
        description: "Your reaction has been removed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove reaction. Please try again.",
        variant: "destructive",
      });
    },
  });

  return {
    // Main actions
    likePost: (targetEvent: NostrEvent, relayHint?: string) => 
      publishReaction.mutateAsync({ targetEvent, content: '+', relayHint }),
    dislikePost: (targetEvent: NostrEvent, relayHint?: string) => 
      publishReaction.mutateAsync({ targetEvent, content: '-', relayHint }),
    reactWithEmoji: (targetEvent: NostrEvent, emoji: string, relayHint?: string) => 
      publishReaction.mutateAsync({ targetEvent, content: emoji, relayHint }),
    removeReaction: (reactionEvent: NostrEvent) => 
      removeReaction.mutateAsync({ reactionEvent }),
    
    // Status
    isLoading: publishReaction.isPending || removeReaction.isPending,
  };
}