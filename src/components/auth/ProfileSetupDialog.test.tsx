import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TestApp } from '@/test/TestApp';
import { ProfileSetupDialog } from './ProfileSetupDialog';

// Mock the hooks
vi.mock('@/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({
    user: { pubkey: 'test-pubkey' },
  }),
}));

vi.mock('@/hooks/useNostrPublish', () => ({
  useNostrPublish: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

vi.mock('@/hooks/useUploadFile', () => ({
  useUploadFile: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

describe('ProfileSetupDialog', () => {
  const mockProps = {
    isOpen: true,
    onClose: vi.fn(),
    onComplete: vi.fn(),
  };

  it('renders profile setup form when open', () => {
    render(
      <TestApp>
        <ProfileSetupDialog {...mockProps} />
      </TestApp>
    );

    expect(screen.getByText('Set Up Your Profile')).toBeInTheDocument();
    expect(screen.getByText('Let others know who you are in the vibe coding community')).toBeInTheDocument();
  });

  it('shows required form fields', () => {
    render(
      <TestApp>
        <ProfileSetupDialog {...mockProps} />
      </TestApp>
    );

    expect(screen.getByLabelText(/Display Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Bio/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Or paste image URL')).toBeInTheDocument();
  });

  it('shows action buttons', () => {
    render(
      <TestApp>
        <ProfileSetupDialog {...mockProps} />
      </TestApp>
    );

    expect(screen.getByText('Create Profile & Join Community')).toBeInTheDocument();
    expect(screen.getByText('Skip for now')).toBeInTheDocument();
  });

  it('calls onComplete when skip button is clicked', () => {
    const onComplete = vi.fn();
    
    render(
      <TestApp>
        <ProfileSetupDialog {...mockProps} onComplete={onComplete} />
      </TestApp>
    );

    fireEvent.click(screen.getByText('Skip for now'));
    expect(onComplete).toHaveBeenCalled();
  });

  it('does not render when closed', () => {
    render(
      <TestApp>
        <ProfileSetupDialog {...mockProps} isOpen={false} />
      </TestApp>
    );

    expect(screen.queryByText('Set Up Your Profile')).not.toBeInTheDocument();
  });
});