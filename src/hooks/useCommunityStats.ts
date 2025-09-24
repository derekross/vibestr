import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useCommunityPosts } from './useCommunityPosts';
import { VIBE_CODERS_COMMUNITY_ID } from '@/lib/community';

/**
 * Hook to calculate community statistics from Nostr events
 */
export function useCommunityStats(communityId: string = VIBE_CODERS_COMMUNITY_ID) {
  const { data: posts = [] } = useCommunityPosts(communityId, 500); // Get more posts for better stats

  return useQuery({
    queryKey: ['community-stats', communityId, posts.length],
    queryFn: async () => {
      if (!posts.length) {
        return {
          memberCount: 0,
          recentlyActive: 0,
          uniqueMembers: new Set<string>(),
        };
      }

      // Calculate unique members from all posts
      const uniqueMembers = new Set<string>();
      const now = Math.floor(Date.now() / 1000);
      const oneWeekAgo = now - (7 * 24 * 60 * 60); // 7 days ago
      const oneDayAgo = now - (24 * 60 * 60); // 1 day ago

      let recentlyActiveUsers = new Set<string>();

      posts.forEach(post => {
        // Add all post authors to unique members
        uniqueMembers.add(post.pubkey);

        // Count users active in the last 24 hours as "online"
        if (post.created_at > oneDayAgo) {
          recentlyActiveUsers.add(post.pubkey);
        }
      });

      return {
        memberCount: uniqueMembers.size,
        recentlyActive: recentlyActiveUsers.size,
        uniqueMembers,
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: posts.length > 0,
  });
}

/**
 * Hook to get community member activity over time for more detailed insights
 */
export function useCommunityActivity(communityId: string = VIBE_CODERS_COMMUNITY_ID) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['community-activity', communityId],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);

      try {
        const now = Math.floor(Date.now() / 1000);
        const thirtyDaysAgo = now - (30 * 24 * 60 * 60); // 30 days ago

        // Query for recent community activity
        const queries = [
          {
            kinds: [11, 1111], // Group posts and replies
            '#a': [communityId],
            since: thirtyDaysAgo,
            limit: 1000,
          },
          {
            kinds: [11, 1111], // Group posts and replies
            '#A': [communityId], // Handle uppercase A tags
            since: thirtyDaysAgo,
            limit: 1000,
          }
        ];

        const eventArrays = await Promise.all(
          queries.map(query => nostr.query([query], { signal }))
        );

        // Flatten and deduplicate
        const eventMap = new Map();
        eventArrays.forEach(events => {
          events.forEach(event => {
            eventMap.set(event.id, event);
          });
        });

        const recentEvents = Array.from(eventMap.values());

        // Calculate activity metrics
        const oneDayAgo = now - (24 * 60 * 60);
        const oneWeekAgo = now - (7 * 24 * 60 * 60);

        const activeToday = new Set<string>();
        const activeThisWeek = new Set<string>();
        const activeThisMonth = new Set<string>();

        recentEvents.forEach(event => {
          activeThisMonth.add(event.pubkey);

          if (event.created_at > oneWeekAgo) {
            activeThisWeek.add(event.pubkey);
          }

          if (event.created_at > oneDayAgo) {
            activeToday.add(event.pubkey);
          }
        });

        return {
          totalEvents: recentEvents.length,
          activeToday: activeToday.size,
          activeThisWeek: activeThisWeek.size,
          activeThisMonth: activeThisMonth.size,
          recentEvents: recentEvents.sort((a, b) => b.created_at - a.created_at).slice(0, 100), // Keep recent events for other uses
        };
      } catch (error) {
        console.error('Error fetching community activity:', error);
        return {
          totalEvents: 0,
          activeToday: 0,
          activeThisWeek: 0,
          activeThisMonth: 0,
          recentEvents: [],
        };
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}

/**
 * Hook specifically for Vibestr community stats
 */
export function useVibeCodersStats() {
  return useCommunityStats(VIBE_CODERS_COMMUNITY_ID);
}

/**
 * Hook specifically for Vibestr community activity
 */
export function useVibeCodersActivity() {
  return useCommunityActivity(VIBE_CODERS_COMMUNITY_ID);
}