import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Pin, 
  PinOff, 
  Plus,
  Search
} from 'lucide-react';
import { usePinnedPosts } from '@/hooks/useCommunityModeration';
import { useVibeCodersPosts } from '@/hooks/useCommunityPosts';
import { useAuthor } from '@/hooks/useAuthor';
import { useToast } from '@/hooks/useToast';
import { NoteContent } from '@/components/NoteContent';
import { genUserName } from '@/lib/genUserName';
import { formatDistanceToNow } from 'date-fns';
import { isPinnedPost } from '@/lib/community';
import type { CommunityMetadata } from '@/lib/community';
import type { NostrEvent } from '@nostrify/nostrify';

interface PinnedPostsManagementProps {
  community: CommunityMetadata;
  isOwner: boolean;
}

export function PinnedPostsManagement({ community: _community, isOwner: _isOwner }: PinnedPostsManagementProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddPinned, setShowAddPinned] = useState(false);
  
  const { data: pinnedPostsEvent } = usePinnedPosts();
  const { data: allPosts } = useVibeCodersPosts(100);
  const { toast } = useToast();

  // const pinnedPostIds = pinnedPostsEvent?.tags
  //   .filter(([name]) => name === 'e')
  //   .map(([, eventId]) => eventId) || [];

  const pinnedPosts = allPosts?.filter(post => 
    isPinnedPost(post.id, pinnedPostsEvent || null)
  ) || [];

  const unpinnedPosts = allPosts?.filter(post => 
    !isPinnedPost(post.id, pinnedPostsEvent || null) &&
    (searchQuery === '' || 
     post.content.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  const handlePinPost = async (_postId: string) => {
    // TODO: Implement pin post functionality
    toast({
      title: "Feature coming soon",
      description: "Pin post functionality will be implemented soon.",
    });
  };

  const handleUnpinPost = async (_postId: string) => {
    // TODO: Implement unpin post functionality
    toast({
      title: "Feature coming soon",
      description: "Unpin post functionality will be implemented soon.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Pinned Posts</h3>
          <p className="text-sm text-muted-foreground">
            Manage pinned posts that appear at the top of the community feed
          </p>
        </div>
        <Button 
          onClick={() => setShowAddPinned(!showAddPinned)}
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Pin Post
        </Button>
      </div>

      {/* Current Pinned Posts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pin className="h-5 w-5" />
            Currently Pinned ({pinnedPosts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pinnedPosts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No posts are currently pinned
            </p>
          ) : (
            <div className="space-y-4">
              {pinnedPosts.map((post, index) => (
                <PinnedPostCard 
                  key={post.id} 
                  post={post} 
                  position={index + 1}
                  onUnpin={() => handleUnpinPost(post.id)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add New Pinned Post */}
      {showAddPinned && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Pin a Post
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search Posts</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search community posts to pin..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {unpinnedPosts.slice(0, 10).map(post => (
                <PostSearchResult 
                  key={post.id} 
                  post={post} 
                  onPin={() => handlePinPost(post.id)}
                />
              ))}
              
              {unpinnedPosts.length === 0 && searchQuery && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No posts found matching "{searchQuery}"
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface PinnedPostCardProps {
  post: NostrEvent;
  position: number;
  onUnpin: () => void;
}

function PinnedPostCard({ post, position, onUnpin }: PinnedPostCardProps) {
  const author = useAuthor(post.pubkey);
  const metadata = author.data?.metadata;
  const displayName = metadata?.name ?? genUserName(post.pubkey);
  const profileImage = metadata?.picture;
  const createdAt = new Date(post.created_at * 1000);

  return (
    <div className="border rounded-lg p-4 space-y-3 bg-purple-50/50 dark:bg-purple-950/20">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <Badge variant="secondary" className="text-xs">
            #{position}
          </Badge>
          <Avatar className="h-8 w-8">
            <AvatarImage src={profileImage} alt={displayName} />
            <AvatarFallback className="text-xs">
              {displayName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{displayName}</span>
              <Badge variant="outline" className="text-xs">
                <Pin className="h-3 w-3 mr-1" />
                Pinned
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(createdAt, { addSuffix: true })}
            </p>
          </div>
        </div>
        
        <Button 
          variant="ghost" 
          size="sm"
          onClick={onUnpin}
        >
          <PinOff className="h-4 w-4 mr-2" />
          Unpin
        </Button>
      </div>

      <div className="text-sm leading-relaxed">
        <NoteContent event={post} />
      </div>
    </div>
  );
}

interface PostSearchResultProps {
  post: NostrEvent;
  onPin: () => void;
}

function PostSearchResult({ post, onPin }: PostSearchResultProps) {
  const author = useAuthor(post.pubkey);
  const metadata = author.data?.metadata;
  const displayName = metadata?.name ?? genUserName(post.pubkey);
  const profileImage = metadata?.picture;
  const createdAt = new Date(post.created_at * 1000);

  return (
    <div className="border rounded-lg p-3 space-y-2">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={profileImage} alt={displayName} />
            <AvatarFallback className="text-xs">
              {displayName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <span className="font-medium text-xs">{displayName}</span>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(createdAt, { addSuffix: true })}
            </p>
          </div>
        </div>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={onPin}
        >
          <Pin className="h-3 w-3 mr-1" />
          Pin
        </Button>
      </div>

      <div className="text-xs leading-relaxed line-clamp-2">
        <NoteContent event={post} />
      </div>
    </div>
  );
}