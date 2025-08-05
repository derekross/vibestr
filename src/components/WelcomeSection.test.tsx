import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TestApp } from '@/test/TestApp';
import { WelcomeSection } from './WelcomeSection';

describe('WelcomeSection', () => {
  it('renders welcome section with main heading', () => {
    render(
      <TestApp>
        <WelcomeSection />
      </TestApp>
    );

    expect(screen.getByText('Vibestr')).toBeInTheDocument();
    expect(screen.getByText('NIP-72 Community on Nostr')).toBeInTheDocument();
  });

  it('explains what vibe coding is', () => {
    render(
      <TestApp>
        <WelcomeSection />
      </TestApp>
    );

    // Check for the key concepts of vibe coding
    expect(screen.getByText('Flow State')).toBeInTheDocument();
    expect(screen.getByText('Passion-Driven')).toBeInTheDocument();
    expect(screen.getByText('Community')).toBeInTheDocument();
    
    // Check for the description text
    expect(screen.getByText(/finding your flow state, building with passion/)).toBeInTheDocument();
  });

  it('shows benefits of joining the community', () => {
    render(
      <TestApp>
        <WelcomeSection />
      </TestApp>
    );

    expect(screen.getByText('Why Join Our Community?')).toBeInTheDocument();
    expect(screen.getByText('Share Your Vibe')).toBeInTheDocument();
    expect(screen.getByText('Discover Tools & Tips')).toBeInTheDocument();
    expect(screen.getByText('Connect & Collaborate')).toBeInTheDocument();
  });

  it('includes call to action', () => {
    render(
      <TestApp>
        <WelcomeSection />
      </TestApp>
    );

    expect(screen.getByText('Ready to Join the Vibe?')).toBeInTheDocument();
    expect(screen.getByText(/Connect with your Nostr account/)).toBeInTheDocument();
  });

  it('includes login areas for user authentication', () => {
    render(
      <TestApp>
        <WelcomeSection />
      </TestApp>
    );

    // Should have multiple LoginArea components
    const loginButtons = screen.getAllByText('Log in');
    expect(loginButtons.length).toBeGreaterThan(0);
  });
});