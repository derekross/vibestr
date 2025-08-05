import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TestApp } from '@/test/TestApp';
import { ThemeToggle, SimpleThemeToggle } from './ThemeToggle';

describe('ThemeToggle', () => {
  it('renders theme toggle button', () => {
    render(
      <TestApp>
        <ThemeToggle />
      </TestApp>
    );

    const button = screen.getByRole('button', { name: /toggle theme/i });
    expect(button).toBeInTheDocument();
  });

  it('has correct aria attributes', () => {
    render(
      <TestApp>
        <ThemeToggle />
      </TestApp>
    );

    const button = screen.getByRole('button', { name: /toggle theme/i });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).toHaveAttribute('aria-haspopup', 'menu');
  });
});

describe('SimpleThemeToggle', () => {
  it('renders simple theme toggle button', () => {
    render(
      <TestApp>
        <SimpleThemeToggle />
      </TestApp>
    );

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('cycles through themes when clicked', () => {
    render(
      <TestApp>
        <SimpleThemeToggle />
      </TestApp>
    );

    const button = screen.getByRole('button');
    
    // Should start with light theme (default)
    expect(button).toHaveAttribute('aria-label', expect.stringContaining('Switch to dark theme'));
    
    // Click to switch to dark
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-label', expect.stringContaining('Switch to system theme'));
    
    // Click to switch to system
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-label', expect.stringContaining('Switch to light theme'));
  });
});