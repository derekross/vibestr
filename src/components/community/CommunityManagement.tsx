import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Pin, 
  MessageSquare, 
  Shield,
  Settings,
  X
} from 'lucide-react';
import { useVibeCodersCommunity } from '@/hooks/useCommunity';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { isModerator } from '@/lib/community';
import { MemberManagement } from './management/MemberManagement';
import { ContentModeration } from './management/ContentModeration';
import { PinnedPostsManagement } from './management/PinnedPostsManagement';
import { CommunitySettings } from './management/CommunitySettings';

interface CommunityManagementProps {
  onClose: () => void;
}

export function CommunityManagement({ onClose }: CommunityManagementProps) {
  const [activeTab, setActiveTab] = useState('members');
  const { data: community } = useVibeCodersCommunity();
  const { user } = useCurrentUser();

  if (!user || !community || !isModerator(user.pubkey, community)) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">Access Denied</h3>
          <p className="text-muted-foreground text-sm">
            You don't have permission to manage this community.
          </p>
        </CardContent>
      </Card>
    );
  }

  const isOwner = community.creator === user.pubkey;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <Settings className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  Community Management
                  <Badge variant={isOwner ? "default" : "secondary"}>
                    {isOwner ? "Owner" : "Moderator"}
                  </Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Manage {community.name} community settings and content
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Management Tabs */}
      <Card>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="border-b">
              <TabsList className="grid w-full grid-cols-4 h-auto p-1">
                <TabsTrigger value="members" className="flex items-center gap-2 py-3">
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Members</span>
                </TabsTrigger>
                <TabsTrigger value="content" className="flex items-center gap-2 py-3">
                  <MessageSquare className="h-4 w-4" />
                  <span className="hidden sm:inline">Content</span>
                </TabsTrigger>
                <TabsTrigger value="pinned" className="flex items-center gap-2 py-3">
                  <Pin className="h-4 w-4" />
                  <span className="hidden sm:inline">Pinned</span>
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center gap-2 py-3">
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Settings</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6">
              <TabsContent value="members" className="mt-0">
                <MemberManagement community={community} isOwner={isOwner} />
              </TabsContent>

              <TabsContent value="content" className="mt-0">
                <ContentModeration community={community} isOwner={isOwner} />
              </TabsContent>

              <TabsContent value="pinned" className="mt-0">
                <PinnedPostsManagement community={community} isOwner={isOwner} />
              </TabsContent>

              <TabsContent value="settings" className="mt-0">
                <CommunitySettings community={community} isOwner={isOwner} />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}