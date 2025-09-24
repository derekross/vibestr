import { Users, Calendar, Shield, Crown, UserCheck, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useVibeCodersCommunity } from '@/hooks/useCommunity';
import { useVibeCodersActivity } from '@/hooks/useCommunityStats';
import { useApprovedMembers } from '@/hooks/useCommunityModeration';
import { useAuthor } from '@/hooks/useAuthor';
import { getUniqueModerators } from '@/lib/community';
import { genUserName } from '@/lib/genUserName';

export function CommunitySidebar() {
  const { user } = useCurrentUser();
  const { data: community } = useVibeCodersCommunity();
  const { data: activity } = useVibeCodersActivity();
  const { data: approvedMembersEvent } = useApprovedMembers();

  // Get actual moderators from community data
  const moderators: Array<{ pubkey: string; role: 'owner' | 'moderator' }> = community ?
    getUniqueModerators(community).map(pubkey => ({
      pubkey,
      role: pubkey === community.creator ? 'owner' as const : 'moderator' as const
    })) : [];

  // Calculate approved member count
  const approvedMemberCount = approvedMembersEvent
    ? approvedMembersEvent.tags.filter(([name]) => name === 'p').length
    : 0;

  return (
    <div className="space-y-4">
      {/* Community Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="h-4 w-4" />
            About Community
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          {/* Community Logo */}
          {community?.image && (
            <div className="w-full aspect-square rounded-lg overflow-hidden bg-muted">
              <img
                src={community.image}
                alt={community.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            {community?.description || 'A community for vibe coding enthusiasts to share experiences built on Nostr.'}
          </p>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>Members</span>
              </div>
              <span className="font-medium">
                {approvedMemberCount > 1000 ?
                  `${(approvedMemberCount / 1000).toFixed(1)}k` :
                  approvedMemberCount > 0 ? approvedMemberCount.toString() : '...'
                }
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 flex items-center justify-center">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                </div>
                <span>Online</span>
              </div>
              <span className="font-medium">
                {activity?.activeToday !== undefined ? activity.activeToday : '...'}
              </span>
            </div>

          </div>

          <Separator />

          {user && (
            <Button className="w-full">
              Join Community
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Rules */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4" />
            Community Rules
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          {(community?.rules || [
            'Be respectful and constructive',
            'Stay on topic about coding and tech',
            'No spam or self-promotion without context',
            'Use proper post flair when available',
            'Search before posting duplicates'
          ]).map((rule, index) => (
            <div key={index} className="flex gap-3 text-sm">
              <span className="font-medium text-muted-foreground min-w-0 flex-shrink-0">
                {index + 1}.
              </span>
              <span className="text-muted-foreground">{rule}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Moderators */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4" />
            Moderators
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {moderators.map((mod) => (
              <ModeratorItem key={mod.pubkey} pubkey={mod.pubkey} role={mod.role} />
            ))}

            <Button variant="ghost" className="w-full text-xs text-muted-foreground">
              View all moderators
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Related Communities (placeholder) */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Related Communities</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          {[
            { name: 'Programming Hub', members: '4.2k' },
            { name: 'Web Development', members: '1.1k' },
            { name: 'JavaScript Coders', members: '2.3k' }
          ].map((community) => (
            <div key={community.name} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{community.name}</span>
              <span className="text-xs text-muted-foreground">{community.members}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function ModeratorItem({ pubkey, role }: { pubkey: string; role: 'owner' | 'moderator' }) {
  const author = useAuthor(pubkey);
  const metadata = author.data?.metadata;
  const displayName = metadata?.name ?? genUserName(pubkey);
  const profileImage = metadata?.picture;

  const getRoleIcon = () => {
    switch (role) {
      case 'owner':
        return <Crown className="h-3 w-3" />;
      case 'moderator':
        return <Shield className="h-3 w-3" />;
      default:
        return <UserCheck className="h-3 w-3" />;
    }
  };

  const getRoleBadge = () => {
    switch (role) {
      case 'owner':
        return <Badge variant="default" className="text-xs">Owner</Badge>;
      case 'moderator':
        return <Badge variant="secondary" className="text-xs">Mod</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center gap-3">
      <Avatar className="h-6 w-6">
        <AvatarImage src={profileImage} alt={displayName} />
        <AvatarFallback className="text-xs">
          {displayName.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{displayName}</span>
          {getRoleBadge()}
        </div>
      </div>
      {getRoleIcon()}
    </div>
  );
}