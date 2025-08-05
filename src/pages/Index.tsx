import { useSeoMeta } from '@unhead/react';
import { CommunityPage } from "@/components/community/CommunityPage";
import { WelcomeSection } from "@/components/WelcomeSection";
import { useCurrentUser } from "@/hooks/useCurrentUser";

const Index = () => {
  const { user } = useCurrentUser();

  useSeoMeta({
    title: 'Vibestr - Community for Vibe Coding',
    description: 'A community for vibe coding enthusiasts to share tools, tips, tricks, experiences, and apps built on Nostr.',
  });

  // Show welcome section for non-logged-in users, community page for logged-in users
  if (!user) {
    return <WelcomeSection />;
  }

  return <CommunityPage />;
};

export default Index;
