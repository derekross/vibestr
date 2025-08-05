import { CommunityHeader } from './CommunityHeader';
import { CommunityPostForm } from './CommunityPostForm';
import { CommunityFeed } from './CommunityFeed';

export function CommunityPage() {
  return (
    <div className="w-full mx-auto px-2 sm:px-4 sm:container sm:max-w-4xl py-6">
      <div className="space-y-6">
        {/* Community Header */}
        <CommunityHeader />
        
        {/* Post Creation Form */}
        <CommunityPostForm />
        
        {/* Community Feed */}
        <CommunityFeed />
      </div>
    </div>
  );
}