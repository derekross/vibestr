import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import {
  GROUP_POST_KIND,
  GROUP_POST_REPLY_KIND,
  VIBE_CODERS_COMMUNITY_ID,
  isPinnedPost
} from '@/lib/community';
import { usePostRemovals, usePinnedPosts } from './useCommunityModeration';

/**
 * Hook to fetch posts from a community
 */
export function useCommunityPosts(
  communityId: string = VIBE_CODERS_COMMUNITY_ID,
  limit: number = 50
) {
  const { nostr } = useNostr();
  const { data: removedPosts } = usePostRemovals(communityId);
  const { data: pinnedPostsEvent } = usePinnedPosts();

  return useQuery({
    queryKey: ['community-posts', communityId, limit, removedPosts?.size, pinnedPostsEvent?.id],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);

      try {
        // Query for group posts (kind 11 and kind 1111) that reference this community
        // Use multiple queries to handle both lowercase 'a' and uppercase 'A' tags
        const queries = [
          {
            kinds: [GROUP_POST_KIND, GROUP_POST_REPLY_KIND], // kind 11 and kind 1111
            '#a': [communityId],
            limit,
          },
          {
            kinds: [GROUP_POST_KIND, GROUP_POST_REPLY_KIND], // kind 11 and kind 1111
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

        console.log(`Total events fetched: ${events.length}`);

        // Filter and validate community posts
        const validPosts = events.filter(event => {
          // Must be kind 11 or kind 1111
          if (event.kind !== GROUP_POST_KIND && event.kind !== GROUP_POST_REPLY_KIND) {
            return false;
          }

          // Exclude removed posts
          if (removedPosts && removedPosts.has(event.id)) {
            return false; // This post has been removed by moderators
          }

          // Exclude replies (events that have 'e' tags referencing other events)
          const hasEventReference = event.tags.some(([name]) => name === 'e');
          if (hasEventReference) {
            return false; // It's a reply, not a top-level post
          }

          // Check if it has the community 'a' or 'A' tag
          const hasCommunityTag = event.tags.some(([name, value]) =>
            (name === 'a' || name === 'A') && value === communityId
          );

          // Must have the community tag
          return hasCommunityTag;
        });

        console.log(`Valid posts after filtering: ${validPosts.length}`);

        // Sort by pinned status first, then by creation time (newest first)
        return validPosts.sort((a, b) => {
          const aIsPinned = isPinnedPost(a.id, pinnedPostsEvent || null);
          const bIsPinned = isPinnedPost(b.id, pinnedPostsEvent || null);

          // Pinned posts come first
          if (aIsPinned && !bIsPinned) return -1;
          if (!aIsPinned && bIsPinned) return 1;

          // If both are pinned or both are not pinned, sort by creation time (newest first)
          return b.created_at - a.created_at;
        });
      } catch (error) {
        console.error('Error fetching community posts:', error);
        return [];
      }
    },
    staleTime: 10 * 1000, // 10 seconds - shorter for more responsive updates
    retry: 2,
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    enabled: removedPosts !== undefined, // Wait for removed posts to load first (pinned posts can be undefined, that's okay)
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
  const { data: removedPosts } = usePostRemovals(communityId);

  return useQuery({
    queryKey: ['community-post-replies', postId, communityId, removedPosts?.size],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);

      try {
        // Use multiple query strategies to ensure we don't miss any replies
        const queries = [
          // Query 1: Direct replies to this specific post (most important)
          {
            kinds: [GROUP_POST_REPLY_KIND], // Only kind 1111 for NIP-72
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

        let allReplies = Array.from(allRepliesMap.values());

        // Filter out removed comments/replies
        if (removedPosts) {
          allReplies = allReplies.filter(reply => !removedPosts.has(reply.id));
        }

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
    enabled: !!postId && removedPosts !== undefined, // Only run if we have a post ID and removed posts loaded
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  });
}

/**
 * Hook to get just the reply count for a post (more efficient than fetching all replies)
 */
export function useCommunityPostReplyCount(
  postId: string,
  communityId: string = VIBE_CODERS_COMMUNITY_ID
) {
  const { nostr } = useNostr();
  const { data: removedPosts } = usePostRemovals(communityId);

  return useQuery({
    queryKey: ['community-post-reply-count', postId, communityId, removedPosts?.size],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);

      try {
        // Use a more efficient query that only gets reply IDs, not full content
        const queries = [
          {
            kinds: [GROUP_POST_REPLY_KIND], // Only kind 1111 for NIP-72
            '#e': [postId],
            limit: 100, // Reasonable limit for counting
          },
          {
            kinds: [GROUP_POST_REPLY_KIND], // kind 1111 (group replies)
            '#a': [communityId],
            limit: 100,
          },
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

        let allReplies = Array.from(allRepliesMap.values());

        // Filter out removed comments/replies
        if (removedPosts) {
          allReplies = allReplies.filter(reply => !removedPosts.has(reply.id));
        }

        // Filter to get replies in this thread (using same logic as useCommunityPostReplies)
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

        return threadReplies.length;
      } catch (error) {
        console.error('Error fetching post reply count:', error);
        return 0;
      }
    },
    staleTime: 30 * 1000, // 30 seconds - longer since counts change less frequently
    retry: 1,
    enabled: !!postId && removedPosts !== undefined,
  });
}

/**
 * Hook to get posts for the Vibestr community specifically
 */
export function useVibeCodersPosts(limit: number = 50) {
  return useCommunityPosts(VIBE_CODERS_COMMUNITY_ID, limit);
}