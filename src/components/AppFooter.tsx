import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

export function AppFooter() {
  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 mt-12">
      <div className="container mx-auto px-2 sm:px-4 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Left side - App info */}
          <div className="text-center sm:text-left">
            <p className="text-sm text-muted-foreground">
              A community for vibe coding enthusiasts
            </p>
          </div>

          {/* Right side - MKStack link */}
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              asChild
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              <a 
                href="https://soapbox.pub/mkstack" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1"
              >
                Vibed with MKStack
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
}