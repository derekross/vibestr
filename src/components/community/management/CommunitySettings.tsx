import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

import { 
  Settings, 
  Save, 
  Copy, 
  ExternalLink,
  Info,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import type { CommunityMetadata } from '@/lib/community';

interface CommunitySettingsProps {
  community: CommunityMetadata;
  isOwner: boolean;
}

export function CommunitySettings({ community, isOwner }: CommunitySettingsProps) {
  const [name, setName] = useState(community.name);
  const [description, setDescription] = useState(community.description || '');
  const [image, setImage] = useState('');
  const { toast } = useToast();

  const handleSave = async () => {
    toast({
      title: "Feature coming soon",
      description: "Community settings update functionality will be implemented soon.",
    });
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(community.id);
    toast({
      title: "Copied!",
      description: "Community ID copied to clipboard.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Community Settings</h3>
          <p className="text-sm text-muted-foreground">
            Configure community information and preferences
          </p>
        </div>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Community Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!isOwner}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your community..."
              disabled={!isOwner}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Community Image URL</Label>
            <Input
              id="image"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://example.com/image.jpg"
              disabled={!isOwner}
            />
          </div>

          {isOwner && (
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Community Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Community Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium">Community ID</Label>
              <div className="flex items-center gap-2 mt-1">
                <code className="text-xs bg-muted px-2 py-1 rounded flex-1 font-mono">
                  {community.id}
                </code>
                <Button variant="outline" size="sm" onClick={handleCopyId}>
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Creator</Label>
              <div className="mt-1">
                <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                  {community.creator}
                </code>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Moderators</Label>
              <div className="mt-1 space-y-1">
                {community.moderators.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No additional moderators</p>
                ) : (
                  community.moderators.map(moderator => (
                    <code key={moderator} className="text-xs bg-muted px-2 py-1 rounded font-mono block">
                      {moderator}
                    </code>
                  ))
                )}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Protocol</Label>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">NIP-72</Badge>
                <Badge variant="outline">Chorus Extensions</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Advanced Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="p-4 border border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Relay Configuration</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Configure which relays are used for community content and moderation.
              </p>
              <Button variant="outline" size="sm" disabled>
                <ExternalLink className="h-3 w-3 mr-2" />
                Configure Relays
              </Button>
            </div>

            <div className="p-4 border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Auto-Approval Settings</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Configure automatic approval rules for trusted members.
              </p>
              <Button variant="outline" size="sm" disabled>
                <Settings className="h-3 w-3 mr-2" />
                Configure Auto-Approval
              </Button>
            </div>

            {isOwner && (
              <div className="p-4 border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20 rounded-lg">
                <h4 className="font-medium text-sm mb-2 text-red-700 dark:text-red-300">
                  Danger Zone
                </h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Irreversible actions that affect the entire community.
                </p>
                <Button variant="destructive" size="sm" disabled>
                  <AlertTriangle className="h-3 w-3 mr-2" />
                  Transfer Ownership
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}