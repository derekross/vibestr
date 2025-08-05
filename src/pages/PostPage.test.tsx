import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { TestApp } from '@/test/TestApp';
import PostPage from './PostPage';

// Mock the hooks
vi.mock('@/hooks/useNostr', () => ({
  useNostr: () => ({
    nostr: {
      query: vi.fn().mockResolvedValue([]),
    },
  }),
}));

// Mock react-router-dom useParams
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ eventId: 'test-event-id' }),
  };
});

describe('PostPage', () => {
  it('renders without crashing', () => {
    render(
      <TestApp>
        <PostPage />
      </TestApp>
    );

    // Should render the main container (now uses w-full on mobile)
    const container = document.querySelector('.w-full');
    expect(container).toBeInTheDocument();
  });

  it('renders loading state when data is loading', () => {
    render(
      <TestApp>
        <PostPage />
      </TestApp>
    );

    // Should show loading skeletons (check for space-y-4 class which is in the loading state)
    const spacingDiv = document.querySelector('.space-y-4');
    expect(spacingDiv).toBeInTheDocument();
  });
});