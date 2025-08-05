import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { NostrEvent } from '@nostrify/nostrify';
import { TestApp } from '@/test/TestApp';
import { PostMenu } from './PostMenu';

// Mock the hooks
vi.mock('@/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({ user: null }),
}));

vi.mock('@/hooks/useCommunity', () => ({
  useVibeCodersCommunity: () => ({ data: null }),
}));

vi.mock('@/hooks/useCommunityModeration', () => ({
  usePinnedPosts: () => ({ data: null }),
}));

vi.mock('@/hooks/useCommunityActions', () => ({
  useVibeCodersActions: () => ({
    pinPost: { mutateAsync: vi.fn() },
    removePost: { mutateAsync: vi.fn() },
    banUser: { mutateAsync: vi.fn() },
  }),
}));

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

const mockEvent: NostrEvent = {
  id: 'test-event-id',
  pubkey: 'test-pubkey',
  created_at: Math.floor(Date.now() / 1000),
  kind: 11,
  tags: [['a', '34550:test-community:test']],
  content: 'Test post content',
  sig: 'test-signature',
};

describe('PostMenu', () => {
  it('renders the menu trigger button', () => {
    render(
      <TestApp>
        <PostMenu event={mockEvent} />
      </TestApp>
    );

    const triggerButton = screen.getByRole('button');
    expect(triggerButton).toBeInTheDocument();
    expect(screen.getByText('More options')).toBeInTheDocument();
  });

  it('renders with custom className', () => {
    render(
      <TestApp>
        <PostMenu event={mockEvent} className="custom-class" />
      </TestApp>
    );

    const triggerButton = screen.getByRole('button');
    expect(triggerButton).toHaveClass('custom-class');
  });

  it('renders for reply events', () => {
    render(
      <TestApp>
        <PostMenu event={mockEvent} isReply={true} />
      </TestApp>
    );

    const triggerButton = screen.getByRole('button');
    expect(triggerButton).toBeInTheDocument();
  });

  it('renders for post events', () => {
    render(
      <TestApp>
        <PostMenu event={mockEvent} isReply={false} />
      </TestApp>
    );

    const triggerButton = screen.getByRole('button');
    expect(triggerButton).toBeInTheDocument();
  });
});