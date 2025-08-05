import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Settings } from 'lucide-react';
import { CommunityManagement } from './CommunityManagement';
import { useVibeCodersCommunity } from '@/hooks/useCommunity';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useVibeCodersActions } from '@/hooks/useCommunityActions';
import { isModerator, getUniqueModeratorsCount } from '@/lib/community';
import { useToast } from '@/hooks/useToast';

export function CommunityHeader() {
  const [showManagement, setShowManagement] = useState(false);
  const { data: community, isLoading } = useVibeCodersCommunity();
  const { user } = useCurrentUser();
  const { joinCommunity } = useVibeCodersActions();
  const { toast } = useToast();

  const handleJoinCommunity = async () => {
    try {
      await joinCommunity.mutateAsync({
        message: "I'm excited to join the Vibestr community and share my passion for vibe coding, tools, and experiences!"
      });
      toast({
        title: "Join request sent!",
        description: "Your request to join Vibestr has been submitted to the moderators.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to send join request. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    );
  }

  if (!community) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Community not found</p>
        </CardContent>
      </Card>
    );
  }

  const isUserModerator = user && isModerator(user.pubkey, community);

  if (showManagement && isUserModerator) {
    return <CommunityManagement onClose={() => setShowManagement(false)} />;
  }

  return (
    <Card>
      <CardHeader className="p-3 sm:p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={community.image} alt={community.name} />
              <AvatarFallback className="text-lg font-bold bg-gradient-to-br from-purple-500 to-blue-500 text-white">
                VC
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">
                {community.name}
              </h1>
              <p className="text-muted-foreground">
                {(() => {
                  const count = getUniqueModeratorsCount(community);
                  return `${count} moderator${count !== 1 ? 's' : ''}`;
                })()}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            {isUserModerator && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowManagement(true)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Manage
              </Button>
            )}
            {user && !isUserModerator && (
              <Button 
                onClick={handleJoinCommunity}
                disabled={joinCommunity.isPending}
                size="sm"
              >
                {joinCommunity.isPending ? 'Joining...' : 'Join Community'}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      {community.description && (
        <CardContent className="p-3 sm:p-6">
          <p className="text-sm leading-relaxed">{community.description}</p>
        </CardContent>
      )}
    </Card>
  );
}