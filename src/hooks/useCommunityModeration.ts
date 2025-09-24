import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import {
  APPROVED_MEMBERS_KIND,
  BANNED_MEMBERS_KIND,
  PINNED_POSTS_KIND,
  POST_APPROVAL_KIND,
  POST_REMOVAL_KIND,
  VIBE_CODERS_COMMUNITY_ID,
  parseCommunityId
} from '@/lib/community';

/**
 * Hook to fetch approved members list for a community
 */
export function useApprovedMembers(communityId: string = VIBE_CODERS_COMMUNITY_ID) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['approved-members', communityId],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);
      
      try {
        const { pubkey } = parseCommunityId(communityId);
        
        const events = await nostr.query([{
          kinds: [APPROVED_MEMBERS_KIND],
          authors: [pubkey], // Only community creator/moderators can publish these
          '#d': [communityId],
          limit: 1,
        }], { signal });

        return events[0] || null;
      } catch (error) {
        console.error('Error fetching approved members:', error);
        return null;
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2,
  });
}

/**
 * Hook to fetch banned members list for a community
 */
export function useBannedMembers(communityId: string = VIBE_CODERS_COMMUNITY_ID) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['banned-members', communityId],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);
      
      try {
        const { pubkey } = parseCommunityId(communityId);
        
        const events = await nostr.query([{
          kinds: [BANNED_MEMBERS_KIND],
          authors: [pubkey], // Only community creator/moderators can publish these
          '#d': [communityId],
          limit: 1,
        }], { signal });

        return events[0] || null;
      } catch (error) {
        console.error('Error fetching banned members:', error);
        return null;
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2,
  });
}

/**
 * Hook to fetch pinned posts for a community
 */
export function usePinnedPosts(communityId: string = VIBE_CODERS_COMMUNITY_ID) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['pinned-posts', communityId],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);
      
      try {
        const { pubkey } = parseCommunityId(communityId);
        
        const events = await nostr.query([{
          kinds: [PINNED_POSTS_KIND],
          authors: [pubkey], // Only community creator/moderators can publish these
          '#d': [communityId],
          limit: 1,
        }], { signal });

        return events[0] || null;
      } catch (error) {
        console.error('Error fetching pinned posts:', error);
        return null;
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2,
  });
}

/**
 * Hook to fetch post approvals for a community
 */
export function usePostApprovals(
  communityId: string = VIBE_CODERS_COMMUNITY_ID,
  limit: number = 100
) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['post-approvals', communityId, limit],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);
      
      try {
        const events = await nostr.query([{
          kinds: [POST_APPROVAL_KIND],
          '#a': [communityId],
          limit,
        }], { signal });

        // Sort by creation time (newest first)
        return events.sort((a, b) => b.created_at - a.created_at);
      } catch (error) {
        console.error('Error fetching post approvals:', error);
        return [];
      }
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    retry: 2,
  });
}

/**
 * Hook to check if a specific post is approved
 */
export function usePostApproval(
  postId: string,
  communityId: string = VIBE_CODERS_COMMUNITY_ID
) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['post-approval', postId, communityId],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);

      try {
        const events = await nostr.query([{
          kinds: [POST_APPROVAL_KIND],
          '#a': [communityId],
          '#e': [postId],
          limit: 10,
        }], { signal });

        // Return the most recent approval
        return events.sort((a, b) => b.created_at - a.created_at)[0] || null;
      } catch (error) {
        console.error('Error fetching post approval:', error);
        return null;
      }
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    retry: 2,
    enabled: !!postId, // Only run if we have a post ID
  });
}

/**
 * Hook to fetch post removals for a community
 */
export function usePostRemovals(communityId: string = VIBE_CODERS_COMMUNITY_ID) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['post-removals', communityId],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);

      try {
        const { pubkey } = parseCommunityId(communityId);

        const events = await nostr.query([{
          kinds: [POST_REMOVAL_KIND],
          authors: [pubkey], // Only community creator/moderators can publish these
          '#a': [communityId],
          limit: 500, // Get more removals to ensure we catch all removed content
        }], { signal });

        // Create a Set of removed event IDs for fast lookup
        const removedEventIds = new Set<string>();
        events.forEach(removalEvent => {
          const eTags = removalEvent.tags.filter(([name]) => name === 'e');
          eTags.forEach(([, eventId]) => {
            removedEventIds.add(eventId);
          });
        });

        return removedEventIds;
      } catch (error) {
        console.error('Error fetching post removals:', error);
        return new Set<string>();
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2,
  });
}

/**
 * Hook to check if a specific post is removed
 */
export function useIsPostRemoved(
  postId: string,
  communityId: string = VIBE_CODERS_COMMUNITY_ID
) {
  const { data: removedPosts } = usePostRemovals(communityId);

  return {
    isRemoved: removedPosts?.has(postId) || false,
    removedPosts,
  };
}