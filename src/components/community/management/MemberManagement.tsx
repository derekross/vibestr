import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  UserCheck,
  UserX,
  UserMinus,
  Crown,
  Shield,
  MoreHorizontal,
  Trash2,
  Ban,
  UserPlus
} from 'lucide-react';
import { useApprovedMembers, useBannedMembers } from '@/hooks/useCommunityModeration';
import { useAuthor } from '@/hooks/useAuthor';
import { useMemberActions } from '@/hooks/useMemberActions';

import { genUserName } from '@/lib/genUserName';
import type { CommunityMetadata } from '@/lib/community';

interface MemberManagementProps {
  community: CommunityMetadata;
  isOwner: boolean;
}

export function MemberManagement({ community, isOwner }: MemberManagementProps) {
  const [activeTab, setActiveTab] = useState('approved');
  const { data: approvedMembersEvent } = useApprovedMembers();
  const { data: bannedMembersEvent } = useBannedMembers();
  const memberActions = useMemberActions();

  const approvedMembers = approvedMembersEvent?.tags
    .filter(([name]) => name === 'p')
    .map(([, pubkey]) => pubkey) || [];

  const bannedMembers = bannedMembersEvent?.tags
    .filter(([name]) => name === 'p')
    .map(([, pubkey]) => pubkey) || [];

  const handleMemberAction = async (action: string, pubkey: string) => {
    try {
      switch (action) {
        case 'remove':
          await memberActions.removeMember(pubkey);
          break;
        case 'ban':
          // First remove from approved, then add to banned
          await memberActions.removeMember(pubkey);
          await memberActions.banMember(pubkey);
          break;
        case 'unban':
          await memberActions.unbanMember(pubkey);
          break;
        case 'approve':
          // Remove from banned if present, then add to approved
          if (bannedMembers.includes(pubkey)) {
            await memberActions.unbanMember(pubkey);
          }
          await memberActions.approveMember(pubkey);
          break;
      }
    } catch (error) {
      console.error('Member action failed:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Member Management</h3>
          <p className="text-sm text-muted-foreground">
            Manage community members, moderators, and permissions
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="moderators">Moderators</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="banned">Banned</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="moderators" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Community Moderators
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Community Owner */}
                <MemberCard
                  pubkey={community.creator}
                  role="owner"
                  isOwner={isOwner}
                  onAction={handleMemberAction}
                  isLoading={memberActions.isLoading}
                />

                {/* Moderators */}
                {community.moderators.map(pubkey => (
                  <MemberCard
                    key={pubkey}
                    pubkey={pubkey}
                    role="moderator"
                    isOwner={isOwner}
                    onAction={handleMemberAction}
                    isLoading={memberActions.isLoading}
                  />
                ))}

                {community.moderators.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No additional moderators assigned
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Approved Members ({approvedMembers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {approvedMembers.map(pubkey => (
                  <MemberCard
                    key={pubkey}
                    pubkey={pubkey}
                    role="approved"
                    isOwner={isOwner}
                    onAction={handleMemberAction}
                    isLoading={memberActions.isLoading}
                  />
                ))}

                {approvedMembers.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No approved members yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="banned" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserX className="h-5 w-5" />
                Banned Members ({bannedMembers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {bannedMembers.map(pubkey => (
                  <MemberCard
                    key={pubkey}
                    pubkey={pubkey}
                    role="banned"
                    isOwner={isOwner}
                    onAction={handleMemberAction}
                    isLoading={memberActions.isLoading}
                  />
                ))}

                {bannedMembers.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No banned members
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserMinus className="h-5 w-5" />
                Join Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center py-4">
                Join request management coming soon
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface MemberCardProps {
  pubkey: string;
  role: 'owner' | 'moderator' | 'approved' | 'banned';
  isOwner: boolean;
  onAction: (action: string, pubkey: string) => void;
  isLoading?: boolean;
}

function MemberCard({ pubkey, role, isOwner, onAction, isLoading = false }: MemberCardProps) {
  const author = useAuthor(pubkey);
  const metadata = author.data?.metadata;
  const displayName = metadata?.name ?? genUserName(pubkey);
  const profileImage = metadata?.picture;

  if (author.isLoading) {
    return (
      <div className="flex items-center space-x-3 p-3 border rounded-lg">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    );
  }

  const getRoleBadge = () => {
    switch (role) {
      case 'owner':
        return <Badge variant="default" className="text-xs"><Crown className="h-3 w-3 mr-1" />Owner</Badge>;
      case 'moderator':
        return <Badge variant="secondary" className="text-xs"><Shield className="h-3 w-3 mr-1" />Moderator</Badge>;
      case 'approved':
        return <Badge variant="outline" className="text-xs"><UserCheck className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'banned':
        return <Badge variant="destructive" className="text-xs"><UserX className="h-3 w-3 mr-1" />Banned</Badge>;
    }
  };

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div className="flex items-center space-x-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={profileImage} alt={displayName} />
          <AvatarFallback className="text-sm">
            {displayName.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{displayName}</span>
            {getRoleBadge()}
          </div>
          <p className="text-xs text-muted-foreground">
            {pubkey.slice(0, 16)}...
          </p>
        </div>
      </div>

      {isOwner && role !== 'owner' && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" disabled={isLoading}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {role === 'approved' && (
              <>
                <DropdownMenuItem
                  onClick={() => onAction('remove', pubkey)}
                  className="text-orange-600 focus:text-orange-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove Member
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onAction('ban', pubkey)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Ban className="h-4 w-4 mr-2" />
                  Ban Member
                </DropdownMenuItem>
              </>
            )}
            {role === 'banned' && (
              <>
                <DropdownMenuItem
                  onClick={() => onAction('unban', pubkey)}
                  className="text-green-600 focus:text-green-600"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Unban Member
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onAction('approve', pubkey)}
                  className="text-blue-600 focus:text-blue-600"
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  Approve Member
                </DropdownMenuItem>
              </>
            )}
            {role === 'moderator' && (
              <DropdownMenuItem
                onClick={() => onAction('remove', pubkey)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove Moderator
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}