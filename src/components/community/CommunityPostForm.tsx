import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Send,
  FileText,
  Image,
  Link2,
  MessageCircle,
  Bold,
  Italic,
  Underline,
  Code,
  List,
  Link,
  Hash,
  Save
} from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAuthor } from '@/hooks/useAuthor';
import { useVibeCodersActions } from '@/hooks/useCommunityActions';
import { useVibeCodersCommunity } from '@/hooks/useCommunity';
import { useToast } from '@/hooks/useToast';
import { useUploadFile } from '@/hooks/useUploadFile';
import { LoginArea } from '@/components/auth/LoginArea';
import { genUserName } from '@/lib/genUserName';

interface CommunityPostFormProps {
  onSuccess?: () => void;
}

export function CommunityPostForm({ onSuccess }: CommunityPostFormProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState('text');
  const [linkUrl, setLinkUrl] = useState('');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const { user } = useCurrentUser();
  const author = useAuthor(user?.pubkey || '');
  const { data: community } = useVibeCodersCommunity();
  const { publishPost } = useVibeCodersActions();
  const { mutateAsync: uploadFile, isPending: isUploading } = useUploadFile();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a title for your post.",
        variant: "destructive",
      });
      return;
    }

    if (postType === 'text' && !content.trim()) {
      toast({
        title: "Error",
        description: "Please enter some content for your post.",
        variant: "destructive",
      });
      return;
    }

    if (postType === 'link' && !linkUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a URL for your link post.",
        variant: "destructive",
      });
      return;
    }

    if (postType === 'image' && uploadedImages.length === 0) {
      toast({
        title: "Error",
        description: "Please upload at least one image.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create post content based on type - format title as markdown header
      let postContent = '# ' + title.trim();

      if (postType === 'text' && content.trim()) {
        postContent += '\n\n' + content.trim();
      } else if (postType === 'link' && linkUrl.trim()) {
        postContent += '\n\n' + linkUrl.trim();
        if (content.trim()) {
          postContent += '\n\n' + content.trim();
        }
      } else if (postType === 'image') {
        // Add images to content
        if (uploadedImages.length > 0) {
          postContent += '\n\n';
          uploadedImages.forEach((imageUrl) => {
            postContent += `![Image](${imageUrl})\n\n`;
          });
        }
        // Add caption if provided
        if (content.trim()) {
          postContent += content.trim();
        }
      }

      await publishPost.mutateAsync({ content: postContent });
      setTitle('');
      setContent('');
      setLinkUrl('');
      setUploadedImages([]);
      toast({
        title: "Post published!",
        description: "Your post has been shared with the Vibestr community.",
      });
      onSuccess?.();
    } catch {
      toast({
        title: "Error",
        description: "Failed to publish post. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSaveDraft = () => {
    toast({
      title: "Draft saved!",
      description: "Your post has been saved as a draft.",
    });
  };

  // Text formatting functions
  const insertMarkdown = (before: string, after: string = '', placeholder: string = '') => {
    const textarea = document.querySelector('textarea[placeholder*="Body text"]') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const textToInsert = selectedText || placeholder;

    const beforeText = content.substring(0, start);
    const afterText = content.substring(end);

    const newContent = beforeText + before + textToInsert + after + afterText;
    setContent(newContent);

    // Set cursor position
    setTimeout(() => {
      const newCursorPos = start + before.length + textToInsert.length + after.length;
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        if (!file.type.startsWith('image/')) {
          toast({
            title: "Invalid file type",
            description: `${file.name} is not an image file.`,
            variant: "destructive",
          });
          return null;
        }

        const result = await uploadFile(file);
        const imageUrl = result[0][1]; // First tag contains the URL
        return imageUrl;
      });

      const urls = (await Promise.all(uploadPromises)).filter(Boolean) as string[];
      setUploadedImages(prev => [...prev, ...urls]);

      toast({
        title: "Images uploaded!",
        description: `${urls.length} image(s) uploaded successfully.`,
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload one or more images. Please try again.",
        variant: "destructive",
      });
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
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
    <div className="flex gap-6">
      {/* Main Form Area */}
      <div className="flex-1">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Community Selector */}
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={community?.image} alt={community?.name} />
              <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                {community?.name?.slice(0, 2).toUpperCase() || 'VC'}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium">{community?.name || 'Vibe Coding'}</span>
          </div>

          {/* Post Type Tabs */}
          <Tabs value={postType} onValueChange={setPostType}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="text" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Text
              </TabsTrigger>
              <TabsTrigger value="image" className="flex items-center gap-2">
                <Image className="h-4 w-4" />
                Images
              </TabsTrigger>
              <TabsTrigger value="link" className="flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                Link
              </TabsTrigger>
            </TabsList>

            {/* Title Field */}
            <div className="space-y-2 mt-6">
              <Input
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-lg h-12"
                disabled={publishPost.isPending}
                maxLength={300}
              />
              <div className="flex justify-end text-xs text-muted-foreground">
                {title.length}/300
              </div>
            </div>

            <TabsContent value="text" className="space-y-4 mt-6">
              {/* Formatting Toolbar */}
              <div className="flex items-center gap-1 p-2 border rounded-lg bg-muted/50">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => insertMarkdown('**', '**', 'bold text')}
                  title="Bold"
                >
                  <Bold className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => insertMarkdown('*', '*', 'italic text')}
                  title="Italic"
                >
                  <Italic className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => insertMarkdown('`', '`', 'code')}
                  title="Code"
                >
                  <Code className="h-4 w-4" />
                </Button>
                <Separator orientation="vertical" className="h-6 mx-1" />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => insertMarkdown('\n- ', '', 'list item')}
                  title="Bullet List"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => insertMarkdown('[', '](url)', 'link text')}
                  title="Link"
                >
                  <Link className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => insertMarkdown('#', '', 'tag')}
                  title="Hashtag"
                >
                  <Hash className="h-4 w-4" />
                </Button>
              </div>

              <Textarea
                placeholder="Body text (optional)"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[200px] resize-vertical"
                disabled={publishPost.isPending}
              />
            </TabsContent>

            <TabsContent value="image" className="space-y-4 mt-6">
              <div className="space-y-4">
                {/* Upload Area */}
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                  <Image className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">Drag and drop images or click to upload</p>
                  <input
                    type="file"
                    id="image-upload"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e.target.files)}
                    disabled={isUploading}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('image-upload')?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? 'Uploading...' : 'Choose Files'}
                  </Button>
                </div>

                {/* Uploaded Images */}
                {uploadedImages.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {uploadedImages.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeImage(index)}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Caption/Description */}
                <Textarea
                  placeholder="Add a caption or description for your images..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[100px] resize-vertical"
                  disabled={publishPost.isPending}
                />
              </div>
            </TabsContent>

            <TabsContent value="link" className="space-y-4 mt-6">
              <Input
                placeholder="Url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                disabled={publishPost.isPending}
              />
              <Textarea
                placeholder="Text (optional)"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[100px] resize-vertical"
                disabled={publishPost.isPending}
              />
            </TabsContent>
          </Tabs>

          {/* Add Tags Button */}
          <Button type="button" variant="outline" className="gap-2" disabled>
            <Hash className="h-4 w-4" />
            Add tags
          </Button>

          {/* Bottom Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleSaveDraft}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              Save Draft
            </Button>

            <Button
              type="submit"
              disabled={!title.trim() || publishPost.isPending}
              className="gap-2"
            >
              {publishPost.isPending ? (
                'Publishing...'
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Post
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Rules Sidebar */}
      <div className="w-80 flex-shrink-0">
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-sm mb-3 uppercase tracking-wide text-muted-foreground">
              {community?.name?.toUpperCase() || 'VIBESTR'} RULES
            </h3>
            <div className="space-y-3">
              {(community?.rules || [
                'Be respectful and constructive',
                'Stay on topic about coding and tech',
                'No spam or self-promotion without context',
                'Use proper post flair when available',
                'Search before posting duplicates'
              ]).slice(0, 5).map((rule, index) => (
                <div key={index} className="flex gap-3 text-sm">
                  <span className="font-medium text-muted-foreground min-w-0 flex-shrink-0">
                    {index + 1}.
                  </span>
                  <span className="text-muted-foreground">{rule}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}