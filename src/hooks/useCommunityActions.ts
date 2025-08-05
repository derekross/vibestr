import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { 
  GROUP_POST_KIND,
  GROUP_POST_REPLY_KIND,
  JOIN_REQUEST_KIND,
  LEAVE_REQUEST_KIND,
  POST_APPROVAL_KIND,
  POST_REMOVAL_KIND,
  PINNED_POSTS_KIND,
  BANNED_MEMBERS_KIND,
  VIBE_CODERS_COMMUNITY_ID,
  createCommunityPostTags,
  createCommunityReplyTags,
  createCommunityATag
} from '@/lib/community';

/**
 * Hook to publish a post to the community
 */
export function usePublishCommunityPost(communityId: string = VIBE_CODERS_COMMUNITY_ID) {
  const { user } = useCurrentUser();
  const { mutateAsync: createEvent } = useNostrPublish();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ content, relay }: { content: string; relay?: string }) => {
      if (!user) {
        throw new Error('User must be logged in to post');
      }

      const tags = createCommunityPostTags(communityId, relay);

      const event = await createEvent({
        kind: GROUP_POST_KIND,
        content,
        tags,
      });

      return event;
    },
    onMutate: async ({ content }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['community-posts', communityId] });

      // Snapshot the previous value
      const previousPosts = queryClient.getQueryData(['community-posts', communityId]);

      // Optimistically update to the new value
      if (user && previousPosts) {
        const optimisticPost: NostrEvent = {
          id: `temp-${Date.now()}`, // Temporary ID
          pubkey: user.pubkey,
          created_at: Math.floor(Date.now() / 1000),
          kind: GROUP_POST_KIND,
          tags: createCommunityPostTags(communityId),
          content,
          sig: '', // Will be filled when actually published
        };

        queryClient.setQueryData(['community-posts', communityId], (old: NostrEvent[] | undefined) => {
          return old ? [optimisticPost, ...old] : [optimisticPost];
        });
      }

      // Return a context object with the snapshotted value
      return { previousPosts };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousPosts) {
        queryClient.setQueryData(['community-posts', communityId], context.previousPosts);
      }
    },
    onSuccess: () => {
      // Invalidate community posts to refresh the feed with real data
      queryClient.invalidateQueries({ queryKey: ['community-posts', communityId] });
    },
  });
}

/**
 * Hook to publish a reply to a community post
 */
export function usePublishCommunityReply(communityId: string = VIBE_CODERS_COMMUNITY_ID) {
  const { user } = useCurrentUser();
  const { mutateAsync: createEvent } = useNostrPublish();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      content, 
      parentEventId, 
      parentAuthorPubkey, 
      relay 
    }: { 
      content: string; 
      parentEventId: string; 
      parentAuthorPubkey: string; 
      relay?: string; 
    }) => {
      if (!user) {
        throw new Error('User must be logged in to reply');
      }

      const tags = createCommunityReplyTags(
        communityId, 
        parentEventId, 
        parentAuthorPubkey, 
        relay
      );

      const event = await createEvent({
        kind: GROUP_POST_REPLY_KIND,
        content,
        tags,
      });

      return event;
    },
    onMutate: async ({ content, parentEventId, parentAuthorPubkey }) => {
      const repliesQueryKey = ['community-post-replies', parentEventId, communityId];
      
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: repliesQueryKey });

      // Snapshot the previous value
      const previousReplies = queryClient.getQueryData(repliesQueryKey);

      // Optimistically update to the new value
      if (user && previousReplies) {
        const optimisticReply: NostrEvent = {
          id: `temp-reply-${Date.now()}`, // Temporary ID
          pubkey: user.pubkey,
          created_at: Math.floor(Date.now() / 1000),
          kind: GROUP_POST_REPLY_KIND,
          tags: createCommunityReplyTags(communityId, parentEventId, parentAuthorPubkey),
          content,
          sig: '', // Will be filled when actually published
        };

        queryClient.setQueryData(repliesQueryKey, (old: NostrEvent[] | undefined) => {
          return old ? [...old, optimisticReply] : [optimisticReply];
        });
      }

      // Return a context object with the snapshotted value
      return { previousReplies, parentEventId };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousReplies && context?.parentEventId) {
        const repliesQueryKey = ['community-post-replies', context.parentEventId, communityId];
        queryClient.setQueryData(repliesQueryKey, context.previousReplies);
      }
    },
    onSuccess: (_, variables) => {
      // Invalidate replies for the specific post to get real data
      queryClient.invalidateQueries({ 
        queryKey: ['community-post-replies', variables.parentEventId, communityId] 
      });
      // Also invalidate community posts to refresh counts
      queryClient.invalidateQueries({ queryKey: ['community-posts', communityId] });
    },
  });
}

/**
 * Hook to send a join request to the community
 */
export function useJoinCommunity(communityId: string = VIBE_CODERS_COMMUNITY_ID) {
  const { user } = useCurrentUser();
  const { mutateAsync: createEvent } = useNostrPublish();

  return useMutation({
    mutationFn: async ({ message, relay }: { message?: string; relay?: string }) => {
      if (!user) {
        throw new Error('User must be logged in to join community');
      }

      const tags = [createCommunityATag(communityId, relay)];

      const event = await createEvent({
        kind: JOIN_REQUEST_KIND,
        content: message || 'I would like to join the Vibestr community to share and learn about vibe coding, tools, tips, and tricks.',
        tags,
      });

      return event;
    },
  });
}

/**
 * Hook to leave the community
 */
export function useLeaveCommunity(communityId: string = VIBE_CODERS_COMMUNITY_ID) {
  const { user } = useCurrentUser();
  const { mutateAsync: createEvent } = useNostrPublish();

  return useMutation({
    mutationFn: async ({ message, relay }: { message?: string; relay?: string }) => {
      if (!user) {
        throw new Error('User must be logged in to leave community');
      }

      const tags = [createCommunityATag(communityId, relay)];

      const event = await createEvent({
        kind: LEAVE_REQUEST_KIND,
        content: message || 'I am leaving the Vibestr community.',
        tags,
      });

      return event;
    },
  });
}

/**
 * Hook to approve a post (moderators only)
 */
export function useApprovePost(communityId: string = VIBE_CODERS_COMMUNITY_ID) {
  const { user } = useCurrentUser();
  const { mutateAsync: createEvent } = useNostrPublish();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      postEvent, 
      relay 
    }: { 
      postEvent: NostrEvent;
      relay?: string; 
    }) => {
      if (!user) {
        throw new Error('User must be logged in to approve posts');
      }

      const tags = [
        createCommunityATag(communityId, relay),
        ['e', postEvent.id, relay || ''],
        ['p', postEvent.pubkey, relay || ''],
        ['k', postEvent.kind.toString()],
      ];

      const event = await createEvent({
        kind: POST_APPROVAL_KIND,
        content: JSON.stringify(postEvent),
        tags,
      });

      return event;
    },
    onSuccess: (_, variables) => {
      // Invalidate post approval queries
      queryClient.invalidateQueries({ 
        queryKey: ['post-approval', variables.postEvent.id, communityId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['post-approvals', communityId] 
      });
    },
  });
}

/**
 * Hook to remove a post (moderators only)
 */
export function useRemovePost(communityId: string = VIBE_CODERS_COMMUNITY_ID) {
  const { user } = useCurrentUser();
  const { mutate: createEvent } = useNostrPublish();

  return useMutation({
    mutationFn: async ({ 
      postId, 
      authorPubkey, 
      originalKind, 
      reason 
    }: { 
      postId: string; 
      authorPubkey: string; 
      originalKind: number; 
      reason?: string; 
    }) => {
      if (!user) {
        throw new Error('User must be logged in to remove posts');
      }

      const tags = [
        createCommunityATag(communityId),
        ['e', postId],
        ['p', authorPubkey],
        ['k', originalKind.toString()]
      ];

      const event = await createEvent({
        kind: POST_REMOVAL_KIND,
        content: reason || 'Post removed by moderator',
        tags,
      });

      return event;
    },
  });
}

/**
 * Hook to pin/unpin a post (moderators only)
 */
export function usePinPost(communityId: string = VIBE_CODERS_COMMUNITY_ID) {
  const { user } = useCurrentUser();
  const { mutate: createEvent } = useNostrPublish();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      postId, 
      action 
    }: { 
      postId: string; 
      action: 'pin' | 'unpin'; 
    }) => {
      if (!user) {
        throw new Error('User must be logged in to pin posts');
      }

      // Get current pinned posts
      const currentPinnedPosts = queryClient.getQueryData(['pinned-posts', communityId]) as NostrEvent | undefined;
      const currentPinnedIds = currentPinnedPosts?.tags
        .filter(([name]) => name === 'e')
        .map(([, id]) => id) || [];

      let newPinnedIds: string[];
      if (action === 'pin') {
        newPinnedIds = [...currentPinnedIds, postId];
      } else {
        newPinnedIds = currentPinnedIds.filter(id => id !== postId);
      }

      const tags = [
        ['d', communityId],
        ...newPinnedIds.map(id => ['e', id])
      ];

      const event = await createEvent({
        kind: PINNED_POSTS_KIND,
        content: '',
        tags,
      });

      return event;
    },
    onSuccess: () => {
      // Invalidate pinned posts query
      queryClient.invalidateQueries({ queryKey: ['pinned-posts', communityId] });
    },
  });
}

/**
 * Hook to ban a user (moderators only)
 */
export function useBanUser(communityId: string = VIBE_CODERS_COMMUNITY_ID) {
  const { user } = useCurrentUser();
  const { mutate: createEvent } = useNostrPublish();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      userPubkey, 
      action 
    }: { 
      userPubkey: string; 
      action: 'ban' | 'unban'; 
    }) => {
      if (!user) {
        throw new Error('User must be logged in to ban users');
      }

      // Get current banned users
      const currentBannedUsers = queryClient.getQueryData(['banned-members', communityId]) as NostrEvent | undefined;
      const currentBannedPubkeys = currentBannedUsers?.tags
        .filter(([name]) => name === 'p')
        .map(([, pubkey]) => pubkey) || [];

      let newBannedPubkeys: string[];
      if (action === 'ban') {
        newBannedPubkeys = [...currentBannedPubkeys, userPubkey];
      } else {
        newBannedPubkeys = currentBannedPubkeys.filter(pubkey => pubkey !== userPubkey);
      }

      const tags = [
        ['d', communityId],
        ...newBannedPubkeys.map(pubkey => ['p', pubkey])
      ];

      const event = await createEvent({
        kind: BANNED_MEMBERS_KIND,
        content: '',
        tags,
      });

      return event;
    },
    onSuccess: () => {
      // Invalidate banned members query
      queryClient.invalidateQueries({ queryKey: ['banned-members', communityId] });
    },
  });
}

/**
 * Hook for Vibestr specific actions
 */
export function useVibeCodersActions() {
  return {
    publishPost: usePublishCommunityPost(VIBE_CODERS_COMMUNITY_ID),
    publishReply: usePublishCommunityReply(VIBE_CODERS_COMMUNITY_ID),
    joinCommunity: useJoinCommunity(VIBE_CODERS_COMMUNITY_ID),
    leaveCommunity: useLeaveCommunity(VIBE_CODERS_COMMUNITY_ID),
    approvePost: useApprovePost(VIBE_CODERS_COMMUNITY_ID),
    removePost: useRemovePost(VIBE_CODERS_COMMUNITY_ID),
    pinPost: usePinPost(VIBE_CODERS_COMMUNITY_ID),
    banUser: useBanUser(VIBE_CODERS_COMMUNITY_ID),
  };
}