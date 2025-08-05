import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useToast } from '@/hooks/useToast';
import {
  APPROVED_MEMBERS_KIND,
  BANNED_MEMBERS_KIND,
  DECLINED_MEMBERS_KIND,
  VIBE_CODERS_COMMUNITY_ID,
} from '@/lib/community';

/**
 * Hook to manage community members (approve, ban, remove, etc.)
 */
export function useMemberActions(communityId: string = VIBE_CODERS_COMMUNITY_ID) {
  const { user } = useCurrentUser();
  const { nostr } = useNostr();
  const { mutateAsync: createEvent } = useNostrPublish();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateMemberList = useMutation({
    mutationFn: async ({
      pubkey: targetPubkey,
      listType,
      action
    }: {
      pubkey: string;
      listType: 'approved' | 'banned' | 'declined';
      action: 'add' | 'remove';
    }) => {
      if (!user) {
        throw new Error('User must be logged in to manage members');
      }

      const kind = listType === 'approved' ? APPROVED_MEMBERS_KIND :
                   listType === 'banned' ? BANNED_MEMBERS_KIND :
                   DECLINED_MEMBERS_KIND;

      // Fetch the current member list event
      const signal = AbortSignal.timeout(3000);
      const events = await nostr.query([{
        kinds: [kind],
        authors: [user.pubkey], // Only events by the current user (moderator)
        '#d': [communityId],
        limit: 1,
      }], { signal });

      const currentEvent = events[0];
      let currentMembers: string[] = [];

      if (currentEvent) {
        // Extract current members from p tags
        currentMembers = currentEvent.tags
          .filter(([name]) => name === 'p')
          .map(([, pubkey]) => pubkey);
      }

      // Update the member list based on action
      let updatedMembers: string[];
      if (action === 'add') {
        if (currentMembers.includes(targetPubkey)) {
          throw new Error(`Member is already in the ${listType} list`);
        }
        updatedMembers = [...currentMembers, targetPubkey];
      } else {
        if (!currentMembers.includes(targetPubkey)) {
          throw new Error(`Member is not in the ${listType} list`);
        }
        updatedMembers = currentMembers.filter(pubkey => pubkey !== targetPubkey);
      }

      // Create tags for the updated event
      const tags = [
        ['d', communityId],
        ...updatedMembers.map(pubkey => ['p', pubkey] as [string, string])
      ];

      const event = await createEvent({
        kind,
        content: '',
        tags,
      });

      return event;
    },
    onSuccess: (_, variables) => {
      // Invalidate member list queries
      queryClient.invalidateQueries({
        queryKey: ['approved-members', communityId]
      });
      queryClient.invalidateQueries({
        queryKey: ['banned-members', communityId]
      });

      // Show success toast
      const actionText = variables.action === 'add' ? 'added to' : 'removed from';
      toast({
        title: "Member Updated",
        description: `Member ${actionText} ${variables.listType} list successfully.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    // Add members to lists
    approveMember: (pubkey: string) =>
      updateMemberList.mutateAsync({ pubkey, listType: 'approved', action: 'add' }),
    banMember: (pubkey: string) =>
      updateMemberList.mutateAsync({ pubkey, listType: 'banned', action: 'add' }),
    declineMember: (pubkey: string) =>
      updateMemberList.mutateAsync({ pubkey, listType: 'declined', action: 'add' }),

    // Remove members from lists
    removeFromApproved: (pubkey: string) =>
      updateMemberList.mutateAsync({ pubkey, listType: 'approved', action: 'remove' }),
    removeFromBanned: (pubkey: string) =>
      updateMemberList.mutateAsync({ pubkey, listType: 'banned', action: 'remove' }),
    removeFromDeclined: (pubkey: string) =>
      updateMemberList.mutateAsync({ pubkey, listType: 'declined', action: 'remove' }),

    // Combined actions for easier use
    removeMember: (pubkey: string) =>
      updateMemberList.mutateAsync({ pubkey, listType: 'approved', action: 'remove' }),
    unbanMember: (pubkey: string) =>
      updateMemberList.mutateAsync({ pubkey, listType: 'banned', action: 'remove' }),

    isLoading: updateMemberList.isPending,
  };
}