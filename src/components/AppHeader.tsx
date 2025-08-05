import { Badge } from '@/components/ui/badge';
import { Code } from 'lucide-react';
import { LoginArea } from '@/components/auth/LoginArea';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NotificationBell } from '@/components/NotificationBell';

export function AppHeader() {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 relative">
      <div className="container mx-auto px-2 sm:px-4 py-3 overflow-visible">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <Code className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-bold">Vibestr</h1>
            </div>
            <Badge variant="secondary" className="text-xs">
              NIP-72 Community
            </Badge>
          </div>

          {/* Navigation and Login */}
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <NotificationBell />

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Login Area */}
            <LoginArea className="max-w-48" />
          </div>
        </div>
      </div>
    </header>
  );
}