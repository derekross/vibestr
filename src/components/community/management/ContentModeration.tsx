import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Trash2
} from 'lucide-react';
import { useVibeCodersPosts } from '@/hooks/useCommunityPosts';
import { usePostApprovals } from '@/hooks/useCommunityModeration';
import { useAuthor } from '@/hooks/useAuthor';
import { useVibeCodersActions } from '@/hooks/useCommunityActions';
import { useToast } from '@/hooks/useToast';
import { useIsMobile } from '@/hooks/useIsMobile';
import { NoteContent } from '@/components/NoteContent';
import { genUserName } from '@/lib/genUserName';
import { formatDistanceToNow } from 'date-fns';
import type { CommunityMetadata } from '@/lib/community';
import type { NostrEvent } from '@nostrify/nostrify';

interface ContentModerationProps {
  community: CommunityMetadata;
  isOwner: boolean;
}

export function ContentModeration({ community: _community, isOwner: _isOwner }: ContentModerationProps) {
  const [activeTab, setActiveTab] = useState('pending');
  const { data: posts, isLoading } = useVibeCodersPosts(100);
  const { data: approvals } = usePostApprovals();
  const { approvePost } = useVibeCodersActions();
  const { toast } = useToast();

  // Create a map of approved post IDs
  const approvedPostIds = new Set(
    approvals?.map(approval => {
      const eTag = approval.tags.find(([name]) => name === 'e');
      return eTag?.[1];
    }).filter(Boolean) || []
  );

  // Separate posts into pending and approved
  const pendingPosts = posts?.filter(post => !approvedPostIds.has(post.id)) || [];
  const approvedPosts = posts?.filter(post => approvedPostIds.has(post.id)) || [];

  const handleApprovePost = async (post: NostrEvent) => {
    try {
      await approvePost.mutateAsync({ postEvent: post });
      toast({
        title: "Post approved",
        description: "The post has been approved and is now visible to all community members.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to approve post. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Content Moderation</h3>
          <p className="text-sm text-muted-foreground">
            Review and moderate community posts
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
            <span className="truncate">
              <span className="hidden sm:inline">Pending ({pendingPosts.length})</span>
              <span className="sm:hidden">P ({pendingPosts.length})</span>
            </span>
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
            <span className="truncate">
              <span className="hidden sm:inline">Approved ({approvedPosts.length})</span>
              <span className="sm:hidden">A ({approvedPosts.length})</span>
            </span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
            <XCircle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
            <span className="truncate">
              <span className="hidden sm:inline">Reports (0)</span>
              <span className="sm:hidden">R (0)</span>
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Pending Posts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingPosts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No posts pending approval
                </p>
              ) : (
                <div className="space-y-4">
                  {pendingPosts.map(post => (
                    <ModerationPostCard
                      key={post.id}
                      post={post}
                      status="pending"
                      onApprove={() => handleApprovePost(post)}
                      onReject={() => {}}
                      isLoading={approvePost.isPending}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Approved Posts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {approvedPosts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No approved posts yet
                </p>
              ) : (
                <div className="space-y-4">
                  {approvedPosts.slice(0, 10).map(post => (
                    <ModerationPostCard
                      key={post.id}
                      post={post}
                      status="approved"
                      onApprove={() => {}}
                      onReject={() => {}}
                      isLoading={false}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="h-5 w-5" />
                Reported Content
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center py-8">
                No reported content
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface ModerationPostCardProps {
  post: NostrEvent;
  status: 'pending' | 'approved' | 'rejected';
  onApprove: () => void;
  onReject: () => void;
  isLoading: boolean;
}

function ModerationPostCard({
  post,
  status,
  onApprove,
  onReject,
  isLoading
}: ModerationPostCardProps) {
  const author = useAuthor(post.pubkey);
  const metadata = author.data?.metadata;
  const displayName = metadata?.name ?? genUserName(post.pubkey);
  const profileImage = metadata?.picture;
  const createdAt = new Date(post.created_at * 1000);
  const isMobile = useIsMobile();

  const getStatusBadge = () => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-xs"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="default" className="text-xs"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="text-xs"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
    }
  };

  return (
    <div className="border rounded-lg p-3 sm:p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src={profileImage} alt={displayName} />
            <AvatarFallback className="text-xs">
              {displayName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm truncate">{displayName}</span>
              {getStatusBadge()}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(createdAt, { addSuffix: true })}
            </p>
          </div>
        </div>
      </div>

      <div className="text-sm leading-relaxed break-words">
        <NoteContent event={post} />
      </div>

      {status === 'pending' && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2">
          <Button
            size="sm"
            onClick={onApprove}
            disabled={isLoading}
            className="flex-1 sm:flex-none"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            {isLoading ? (isMobile ? 'Approving...' : 'Approving...') : (isMobile ? 'Approve' : 'Approve')}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onReject}
            className="flex-1 sm:flex-none"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Reject
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="flex-1 sm:flex-none"
          >
            <Eye className="h-4 w-4 mr-2" />
            {isMobile ? 'Details' : 'View Details'}
          </Button>
        </div>
      )}

      {status === 'approved' && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 sm:flex-none"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Remove
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="flex-1 sm:flex-none"
          >
            <Eye className="h-4 w-4 mr-2" />
            {isMobile ? 'View' : 'View Post'}
          </Button>
        </div>
      )}
    </div>
  );
}