import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { 
  GROUP_POST_KIND,
  GROUP_POST_REPLY_KIND,
  VIBE_CODERS_COMMUNITY_ID,
  validateCommunityPost,
  extractCommunityIdFromPost
} from '@/lib/community';

/**
 * Hook to fetch posts from a community
 */
export function useCommunityPosts(
  communityId: string = VIBE_CODERS_COMMUNITY_ID,
  limit: number = 50
) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['community-posts', communityId, limit],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);
      
      try {
        // Query for both regular notes and group posts that reference this community
        // Use multiple queries to handle both lowercase 'a' and uppercase 'A' tags
        const queries = [
          {
            kinds: [1, GROUP_POST_KIND], // kind 1 (notes) and kind 11 (group posts)
            '#a': [communityId],
            limit,
          },
          {
            kinds: [1, GROUP_POST_KIND], // kind 1 (notes) and kind 11 (group posts)
            '#A': [communityId],
            limit,
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
        
        const events = Array.from(eventMap.values());

        // Filter and validate community posts
        const validPosts = events.filter(event => {
          // Validate that the event is properly tagged for the community
          if (!validateCommunityPost(event)) {
            return false;
          }
          
          // Ensure it's for the correct community
          const postCommunityId = extractCommunityIdFromPost(event);
          if (postCommunityId !== communityId) {
            return false;
          }
          
          // Exclude replies (events that have 'e' tags referencing other events)
          const hasEventReference = event.tags.some(([name]) => name === 'e');
          return !hasEventReference;
        });

        // Sort by creation time (newest first)
        return validPosts.sort((a, b) => b.created_at - a.created_at);
      } catch (error) {
        console.error('Error fetching community posts:', error);
        return [];
      }
    },
    staleTime: 10 * 1000, // 10 seconds - shorter for more responsive updates
    retry: 2,
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  });
}

/**
 * Hook to fetch replies to a specific community post (including nested replies)
 */
export function useCommunityPostReplies(
  postId: string,
  communityId: string = VIBE_CODERS_COMMUNITY_ID
) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['community-post-replies', postId, communityId],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);
      
      try {
        // Use multiple query strategies to ensure we don't miss any replies
        const queries = [
          // Query 1: Direct replies to this specific post (most important)
          {
            kinds: [1, GROUP_POST_REPLY_KIND],
            '#e': [postId],
            limit: 200,
          },
          // Query 2: All kind 1111 replies that reference the community (lowercase 'a')
          {
            kinds: [GROUP_POST_REPLY_KIND], // kind 1111 (group replies)
            '#a': [communityId],
            limit: 200,
          },
          // Query 3: All kind 1111 replies that reference the community (uppercase 'A')
          {
            kinds: [GROUP_POST_REPLY_KIND], // kind 1111 (group replies)
            '#A': [communityId],
            limit: 200,
          },
          // Query 4: All kind 1 notes that reference the community (lowercase 'a')
          {
            kinds: [1], // kind 1 (notes)
            '#a': [communityId],
            limit: 200,
          },
          // Query 5: All kind 1 notes that reference the community (uppercase 'A')
          {
            kinds: [1], // kind 1 (notes)
            '#A': [communityId],
            limit: 200,
          },
          // Query 6: Broader search for any events that might reference this post
          {
            kinds: [1, GROUP_POST_REPLY_KIND],
            since: Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60), // Last 30 days
            limit: 500,
          }
        ];

        const allRepliesArrays = await Promise.all(
          queries.map(query => nostr.query([query], { signal }))
        );
        
        // Flatten and deduplicate
        const allRepliesMap = new Map();
        allRepliesArrays.forEach(replies => {
          replies.forEach(reply => {
            allRepliesMap.set(reply.id, reply);
          });
        });
        
        const allReplies = Array.from(allRepliesMap.values());

        // Filter to get replies in this thread (direct replies + replies to replies)
        
        const threadReplies = allReplies.filter(event => {
          // Get all 'e' tags
          const eTags = event.tags.filter(([name]) => name === 'e');
          
          // For replies, we need at least one e-tag
          if (eTags.length === 0) {
            return false;
          }
          
          // Check if it references the community (for kind 1111 this should be present)
          // Handle both lowercase 'a' and uppercase 'A' tags
          const hasCommunityRef = event.tags.some(([name, value]) => 
            (name === 'a' || name === 'A') && value === communityId
          );
          
          // For kind 1111, we require community reference
          if (event.kind === GROUP_POST_REPLY_KIND && !hasCommunityRef) {
            return false;
          }

          // Check if this reply is part of the thread
          const isDirectReply = eTags.some(([, eventId]) => eventId === postId);
          
          if (isDirectReply) {
            return true;
          }
          
          // Check if it's a reply to another reply in this thread
          // Use a recursive function to check if this reply is part of the thread
          const isNestedReply = eTags.some(([, eventId]) => {
            const parentReply = allReplies.find(reply => reply.id === eventId);
            
            if (!parentReply) {
              return false;
            }
            
            // Check if parent is a direct reply to the main post
            const parentHasDirectReply = parentReply.tags.some(([name, value]) => name === 'e' && value === postId);
            
            if (parentHasDirectReply) {
              return true;
            }
            
            // Recursively check if parent is part of the thread (up to 3 levels deep to avoid infinite loops)
            const checkParentThread = (replyId: string, depth: number = 0): boolean => {
              if (depth > 3) return false; // Prevent infinite recursion
              
              const reply = allReplies.find(r => r.id === replyId);
              if (!reply) return false;
              
              // Check if this reply directly references the main post
              if (reply.tags.some(([name, value]) => name === 'e' && value === postId)) {
                return true;
              }
              
              // Check if this reply references another reply that's part of the thread
              const replyETags = reply.tags.filter(([name]) => name === 'e');
              return replyETags.some(([, parentId]) => checkParentThread(parentId, depth + 1));
            };
            
            const isPartOfThread = checkParentThread(eventId);
            
            return isPartOfThread;
          });

          return isNestedReply;
        });

        // Sort by creation time (oldest first for threaded view)
        return threadReplies.sort((a, b) => a.created_at - b.created_at);
      } catch (error) {
        console.error('Error fetching post replies:', error);
        return [];
      }
    },
    staleTime: 5 * 1000, // 5 seconds - very short for replies to appear quickly
    retry: 2,
    enabled: !!postId, // Only run if we have a post ID
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  });
}

/**
 * Hook to get posts for the Vibestr community specifically
 */
export function useVibeCodersPosts(limit: number = 50) {
  return useCommunityPosts(VIBE_CODERS_COMMUNITY_ID, limit);
}