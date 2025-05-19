
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/common/logo';
import Image from 'next/image';
import { ChevronRight, Swords, Sparkles, MessageSquareText, Users, CheckCircle, Rocket, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  className?: string;
}

function FeatureCard({ icon: Icon, title, description, className }: FeatureCardProps) {
  return (
    <Card className={cn("bg-card/60 backdrop-blur-sm border-primary/30 hover:border-primary/70 transition-all duration-300 transform hover:scale-105 glow-primary", className)}>
      <CardHeader className="items-center pb-4">
        <div className="p-3 bg-primary/20 rounded-full mb-3">
          <Icon className="h-8 w-8 text-primary text-glow-primary" />
        </div>
        <CardTitle className="text-xl text-center text-glow-primary">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-center text-sm">{description}</p>
      </CardContent>
    </Card>
  );
}

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="px-4 lg:px-6 h-16 flex items-center sticky top-0 z-50 w-full border-b border-border/40 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Link href="/" className="flex items-center justify-center" prefetch={false}>
          <Logo size="small" className="text-2xl" />
        </Link>
        <nav className="ml-auto flex items-center gap-4 sm:gap-6">
          {/* Placeholder Links - update hrefs as needed */}
          <Link className="text-sm font-medium hover:text-primary transition-colors" href="#features" prefetch={false}>
            Features
          </Link>
          <Link className="text-sm font-medium hover:text-primary transition-colors" href="#how-it-works" prefetch={false}>
            How It Works
          </Link>
          {/* <Button variant="outline" size="sm" asChild className="hidden sm:inline-flex border-accent text-accent hover:bg-accent/10 hover:text-accent">
            <Link href="/auth">View Demo</Link>
          </Button> */}
          <Button size="sm" asChild className="glow-primary hover:opacity-90 transition-opacity">
            <Link href="/auth?mode=signup">Sign In / Sign Up</Link>
          </Button>
        </nav>
      </header>
      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-20 md:py-32 lg:py-40 xl:py-48 flex flex-col items-center text-center relative overflow-hidden">
           <div
            aria-hidden="true"
            className="absolute inset-0 grid grid-cols-2 -space-x-52 opacity-40 transition-opacity duration-500 group-hover:opacity-50 dark:opacity-20"
          >
            <div className="h-56 bg-gradient-to-br from-primary to-purple-400 blur-[106px] dark:from-blue-700 dark:to-purple-400"></div>
            <div className="h-32 bg-gradient-to-r from-cyan-400 to-sky-300 blur-[106px] dark:from-indigo-700 dark:to-sky-500"></div>
          </div>
          <div className="container px-4 md:px-6 relative z-10">
            <div className="text-center mb-6">
              <Link href="/auth?mode=signup" className="inline-block rounded-lg bg-muted/50 px-3 py-1 text-sm border border-border hover:border-primary/50 transition-colors" prefetch={false}>
                <span className="flex items-center gap-1">
                  <span>Track Your 1v1 Basketball Battles</span>
                  <ChevronRight className="h-4 w-4 text-primary" />
                </span>
              </Link>
            </div>
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none text-glow-primary leading-tight">
              Cosmic Hoops: Gamify Your<br />1v1 Basketball Universe.
            </h1>
            <p className="mx-auto max-w-[700px] text-foreground/80 md:text-xl mt-6 mb-10">
              Log your 1v1 basketball matches, challenge friends, climb the leaderboard, and get AI-powered dramatic recaps of your epic clashes. The galaxy is your court!
            </p>
            <div className="flex justify-center items-center h-48 md:h-64 lg:h-72 my-12">
              <Image
                src="https://placehold.co/600x300.png"
                alt="Cosmic Hoops abstract visual"
                width={600}
                height={300}
                data-ai-hint="basketball space abstract glow"
                className="rounded-xl shadow-2xl glow-accent opacity-75 object-cover"
                priority
              />
            </div>
            <div className="flex flex-col gap-4 min-[400px]:flex-row justify-center">
              <Button size="lg" asChild className="glow-primary hover:opacity-90 transition-opacity">
                <Link href="/auth?mode=signup">Get Started for Free</Link>
              </Button>
              {/* <Button variant="outline" size="lg" asChild className="border-accent text-accent hover:bg-accent/20 hover:text-accent transition-colors">
                <Link href="/auth">View Demo</Link>
              </Button> */}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-16 md:py-24 lg:py-32 bg-background/50 border-t border-b border-border/40">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-glow-accent">Features That Launch You Into Orbit</h2>
              <p className="mt-4 max-w-2xl mx-auto text-muted-foreground md:text-lg">
                Everything you need to take your friendly rivalries to a cosmic scale.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              <FeatureCard
                icon={Swords}
                title="Log Every Clash"
                description="Easily record scores from your 1v1 basketball games. Keep a detailed history of your cosmic duels."
              />
              <FeatureCard
                icon={Sparkles}
                title="Boost Your Aura"
                description="Win matches and complete challenges to increase your Aura. Prove your dominance in the intergalactic basketball scene."
              />
              <FeatureCard
                icon={MessageSquareText}
                title="Epic AI Recaps"
                description="Relive your greatest victories with dramatic, AI-generated recaps, just like professional sports commentary."
              />
              <FeatureCard
                icon={Users}
                title="Connect & Compete"
                description="Add friends, track your head-to-head stats, and see who truly rules the court in your cosmic circle."
              />
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="w-full py-16 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-glow-accent">Ready for Liftoff?</h2>
              <p className="mt-4 max-w-2xl mx-auto text-muted-foreground md:text-lg">
                Getting started with Cosmic Hoops is as easy as a slam dunk.
              </p>
            </div>
            <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="space-y-6">
                {[
                  { icon: CheckCircle, title: "Sign Up & Create Profile", description: "Join the cosmos and set up your unique Hooper identity." },
                  { icon: Users, title: "Add Friends", description: "Connect with your rivals and build your cosmic basketball network." },
                  { icon: Swords, title: "Log Your Matches", description: "Record the scores of your 1v1 battles after each game." },
                  { icon: Zap, title: "Confirm & Rise", description: "Opponents confirm scores. Watch your Aura change and get epic recaps!" },
                ].map((step, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="flex-shrink-0 mt-1">
                      <step.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{step.title}</h3>
                      <p className="text-muted-foreground text-sm">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-center items-center">
                <Image
                  src="https://placehold.co/400x400.png"
                  alt="Cosmic Hoops App Screenshot Mockup"
                  width={400}
                  height={400}
                  data-ai-hint="app screen basketball stats"
                  className="rounded-xl shadow-2xl glow-primary opacity-80"
                />
              </div>
            </div>
             <div className="text-center mt-16">
              <Button size="lg" asChild className="glow-primary hover:opacity-90 transition-opacity">
                <Link href="/auth?mode=signup">Claim Your Court Now</Link>
              </Button>
            </div>
          </div>
        </section>

      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t border-border/40">
        <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} Cosmic Hoops. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4 text-muted-foreground" href="#" prefetch={false}>
            Terms of Service
          </Link>
          <Link className="text-xs hover:underline underline-offset-4 text-muted-foreground" href="#" prefetch={false}>
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}

// Helper cn function if not globally available (it is in lib/utils)
function cn(...inputs: (string | undefined | null | false)[]) {
  return inputs.filter(Boolean).join(' ');
}
