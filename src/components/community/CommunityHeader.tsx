import { useState } from 'react';
import { Users, Plus, Bell, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useVibeCodersCommunity } from '@/hooks/useCommunity';
import { isModerator, getUniqueModerators } from '@/lib/community';
import { CommunityPostForm } from './CommunityPostForm';
import { CommunityManagement } from './CommunityManagement';

export function CommunityHeader() {
  const { user } = useCurrentUser();
  const { data: community } = useVibeCodersCommunity();
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);
  const [isManagementOpen, setIsManagementOpen] = useState(false);

  const userIsModerator = user && community && isModerator(user.pubkey, community);
  const moderatorCount = community ? getUniqueModerators(community).length : 0;

  return (
    <div className="bg-background border-b">
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-7xl mx-auto">
        {/* Banner Image - spans full width */}
        <div
          className="h-32 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 relative overflow-hidden rounded-lg mb-4"
          style={{
            backgroundImage: community?.banner
              ? `url(${community.banner})`
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Overlay for better text readability */}
          <div className="absolute inset-0 bg-black/20 rounded-lg" />

          {/* Pattern overlay only when no banner */}
          {!community?.banner && (
            <div className="absolute inset-0 opacity-10 rounded-lg">
              <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
                <defs>
                  <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                    <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5"/>
                  </pattern>
                </defs>
                <rect width="100" height="100" fill="url(#grid)" />
              </svg>
            </div>
          )}
        </div>

        {/* Community Info - spans full width */}
        <div className="flex items-start gap-4">
          {/* Community Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold">
                {community?.name || 'Vibe Coding'}
              </h1>
            </div>


            {community?.description && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                {community.description}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {user && (
              <>
                <Dialog open={isPostDialogOpen} onOpenChange={setIsPostDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Create Post
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-hidden">
                    <DialogHeader>
                      <DialogTitle>Create a Post</DialogTitle>
                    </DialogHeader>
                    <CommunityPostForm onSuccess={() => setIsPostDialogOpen(false)} />
                  </DialogContent>
                </Dialog>
                {userIsModerator && (
                  <Dialog open={isManagementOpen} onOpenChange={setIsManagementOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Settings className="h-4 w-4" />
                        Manage
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto" hideClose>
                      <CommunityManagement onClose={() => setIsManagementOpen(false)} />
                    </DialogContent>
                  </Dialog>
                )}
                <Button variant="outline" size="sm" className="gap-2">
                  <Bell className="h-4 w-4" />
                  Join
                </Button>
              </>
            )}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}