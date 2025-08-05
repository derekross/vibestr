import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Code, Zap, Users, MessageCircle, Sparkles, ArrowRight } from 'lucide-react';
import { LoginArea } from '@/components/auth/LoginArea';

export function WelcomeSection() {
  return (
    <div className="w-full mx-auto px-2 sm:px-4 sm:container sm:max-w-6xl py-12">
      {/* Hero Section */}
      <div className="text-center space-y-8 mb-16">
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <Code className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Vibestr
              </h1>
              <Badge variant="secondary" className="mt-2">
                NIP-72 Community on Nostr
              </Badge>
            </div>
          </div>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Welcome to the ultimate community for <span className="font-semibold text-foreground">vibe coding</span> – 
            where creativity meets code and passion drives innovation.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <LoginArea className="w-full sm:w-auto" />
          <p className="text-sm text-muted-foreground">
            Join the conversation on the decentralized web
          </p>
        </div>
      </div>

      {/* What is Vibe Coding Section */}
      <div className="mb-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            What is <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Vibe Coding</span>?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Vibe coding is about finding your flow state, building with passion, and creating software that resonates with your soul.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="border-2 hover:border-purple-200 dark:hover:border-purple-800 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <CardTitle className="text-lg">Flow State</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Enter the zone where time disappears and code flows effortlessly from your fingertips. 
                It's about finding that perfect rhythm between challenge and skill.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-blue-200 dark:hover:border-blue-800 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle className="text-lg">Passion-Driven</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Build projects that excite you, solve problems you care about, and create solutions 
                that make a difference. Let your enthusiasm fuel your code.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-green-200 dark:hover:border-green-800 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle className="text-lg">Community</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Connect with like-minded developers who understand the joy of clean code, 
                elegant solutions, and the satisfaction of building something beautiful.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Why Join Section */}
      <div className="mb-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Why Join Our Community?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Connect with passionate developers, share your projects, and discover new ways to enhance your coding journey.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center flex-shrink-0 mt-1">
                <MessageCircle className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Share Your Vibe</h3>
                <p className="text-muted-foreground">
                  Post about your coding sessions, breakthrough moments, and the projects that get you excited. 
                  Inspire others with your journey.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0 mt-1">
                <Code className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Discover Tools & Tips</h3>
                <p className="text-muted-foreground">
                  Learn about new tools, frameworks, and techniques that can enhance your development workflow 
                  and help you find your coding flow.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0 mt-1">
                <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Connect & Collaborate</h3>
                <p className="text-muted-foreground">
                  Find collaborators for your projects, get feedback on your ideas, and build lasting 
                  connections with developers who share your passion.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="h-8 w-8 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center flex-shrink-0 mt-1">
                <Sparkles className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Showcase Your Work</h3>
                <p className="text-muted-foreground">
                  Share your latest creations, get constructive feedback, and celebrate your achievements 
                  with a community that appreciates good code.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center flex-shrink-0 mt-1">
                <Zap className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Stay Motivated</h3>
                <p className="text-muted-foreground">
                  Get inspired by others' journeys, overcome coding blocks together, and maintain 
                  your passion for development through community support.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center flex-shrink-0 mt-1">
                <ArrowRight className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Decentralized & Open</h3>
                <p className="text-muted-foreground">
                  Built on Nostr protocol, ensuring your content is truly yours and the community 
                  remains free from centralized control.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="text-center">
        <Card className="border-2 border-dashed border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20">
          <CardContent className="py-12">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-4">
                  Ready to Join the Vibe?
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Connect with your Nostr account and become part of a community that celebrates 
                  the art and passion of coding.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <LoginArea className="w-full sm:w-auto" />
                <div className="text-sm text-muted-foreground">
                  <p>New to Nostr? <Button variant="link" className="p-0 h-auto text-sm" asChild>
                    <a href="https://nostrhub.io" target="_blank" rel="noopener noreferrer">
                      Learn more about the protocol
                    </a>
                  </Button></p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}