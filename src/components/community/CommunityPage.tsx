import { CommunityHeader } from './CommunityHeader';
import { CommunityFeed } from './CommunityFeed';
import { CommunitySidebar } from './CommunitySidebar';

export function CommunityPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Community Header - Full Width */}
      <CommunityHeader />

      {/* Main Content - Two Column Layout */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6 max-w-7xl mx-auto">
          {/* Main Feed Column */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Community Feed */}
            <CommunityFeed />
          </div>

          {/* Sidebar Column */}
          <div className="w-80 flex-shrink-0 hidden lg:block">
            <div className="sticky top-6">
              <CommunitySidebar />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}