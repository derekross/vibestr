import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Send, Code, Lightbulb, Share2 } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAuthor } from '@/hooks/useAuthor';
import { useVibeCodersActions } from '@/hooks/useCommunityActions';
import { useToast } from '@/hooks/useToast';
import { LoginArea } from '@/components/auth/LoginArea';
import { genUserName } from '@/lib/genUserName';

export function CommunityPostForm() {
  const [content, setContent] = useState('');
  const { user } = useCurrentUser();
  const author = useAuthor(user?.pubkey || '');
  const { publishPost } = useVibeCodersActions();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      toast({
        title: "Error",
        description: "Please enter some content for your post.",
        variant: "destructive",
      });
      return;
    }

    try {
      await publishPost.mutateAsync({ content: content.trim() });
      setContent('');
      toast({
        title: "Post published!",
        description: "Your post has been shared with the Vibestr community.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to publish post. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="py-8 text-center p-3 sm:p-6">
          <div className="max-w-sm mx-auto space-y-4">
            <p className="text-muted-foreground">
              Join the conversation in Vibestr community
            </p>
            <LoginArea className="w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const metadata = author.data?.metadata;
  const displayName = metadata?.name ?? genUserName(user.pubkey);
  const profileImage = metadata?.picture;

  return (
    <Card>
      <CardHeader className="p-3 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Code className="h-5 w-5 text-purple-500" />
          Share with Vibestr
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-start space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={profileImage} alt={displayName} />
              <AvatarFallback className="text-sm">
                {displayName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-3">
              <Textarea
                placeholder="Share your vibe coding experiences, tools, tips, tricks, or apps with the community..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[100px] resize-none"
                disabled={publishPost.isPending}
              />
              
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-xs">
                    <Lightbulb className="h-3 w-3 mr-1" />
                    Tips & Tricks
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <Share2 className="h-3 w-3 mr-1" />
                    Apps & Tools
                  </Badge>
                </div>
                
                <Button 
                  type="submit" 
                  disabled={!content.trim() || publishPost.isPending}
                  size="sm"
                >
                  {publishPost.isPending ? (
                    'Publishing...'
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Post
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}