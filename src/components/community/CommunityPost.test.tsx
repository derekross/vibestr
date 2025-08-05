import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TestApp } from '@/test/TestApp';
import { CommunityPost } from './CommunityPost';
import type { NostrEvent } from '@nostrify/nostrify';

// Mock the hooks
vi.mock('@/hooks/useReactions', () => ({
  useEventReactions: vi.fn(() => ({
    data: {
      likeCount: 0,
      dislikeCount: 0,
      likes: [],
      dislikes: [],
      emojiReactions: [],
      all: []
    }
  })),
  useUserReaction: vi.fn(() => ({
    hasLiked: false,
    hasDisliked: false,
    userReaction: null
  })),
  useReactionActions: vi.fn(() => ({
    likePost: vi.fn(),
    removeReaction: vi.fn(),
    isLoading: false
  }))
}));

vi.mock('@/hooks/useCurrentUser', () => ({
  useCurrentUser: vi.fn(() => ({
    user: {
      pubkey: 'test-pubkey',
      signer: {}
    }
  }))
}));

vi.mock('@/hooks/useAuthor', () => ({
  useAuthor: vi.fn(() => ({
    data: {
      metadata: {
        name: 'Test User',
        picture: 'https://example.com/avatar.jpg'
      }
    }
  }))
}));

vi.mock('@/hooks/useCommunityPosts', () => ({
  useCommunityPostReplies: vi.fn(() => ({
    data: []
  }))
}));

vi.mock('@/hooks/useCommunityActions', () => ({
  useVibeCodersActions: vi.fn(() => ({
    publishReply: {
      mutateAsync: vi.fn(),
      isPending: false
    }
  }))
}));

vi.mock('@/hooks/useCommunityModeration', () => ({
  usePinnedPosts: vi.fn(() => ({
    data: null
  }))
}));

const mockEvent: NostrEvent = {
  id: 'test-event-id',
  pubkey: 'test-pubkey',
  created_at: Math.floor(Date.now() / 1000),
  kind: 1,
  tags: [
    ['h', 'vibecoders']
  ],
  content: 'This is a test post for the community',
  sig: 'test-signature'
};

describe('CommunityPost', () => {
  it('renders post content correctly', () => {
    render(
      <TestApp>
        <CommunityPost event={mockEvent} />
      </TestApp>
    );

    expect(screen.getByText('This is a test post for the community')).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('displays like button with correct initial state', () => {
    render(
      <TestApp>
        <CommunityPost event={mockEvent} />
      </TestApp>
    );

    const likeButton = screen.getByRole('button', { name: /like/i });
    expect(likeButton).toBeInTheDocument();
    expect(likeButton).toHaveTextContent('Like');
  });

  it('shows reply button for logged in users', () => {
    render(
      <TestApp>
        <CommunityPost event={mockEvent} />
      </TestApp>
    );

    const replyButton = screen.getByRole('button', { name: /reply/i });
    expect(replyButton).toBeInTheDocument();
  });

  it('displays replies count correctly', () => {
    render(
      <TestApp>
        <CommunityPost event={mockEvent} />
      </TestApp>
    );

    expect(screen.getByText('0 Replies')).toBeInTheDocument();
  });

  it('can click like button', async () => {
    const mockLikePost = vi.fn();
    const { useReactionActions } = await import('@/hooks/useReactions');
    
    vi.mocked(useReactionActions).mockReturnValue({
      likePost: mockLikePost,
      removeReaction: vi.fn(),
      isLoading: false,
      dislikePost: vi.fn(),
      reactWithEmoji: vi.fn()
    });

    render(
      <TestApp>
        <CommunityPost event={mockEvent} />
      </TestApp>
    );

    const likeButton = screen.getByRole('button', { name: /like/i });
    fireEvent.click(likeButton);

    await waitFor(() => {
      expect(mockLikePost).toHaveBeenCalledWith(mockEvent);
    });
  });
});