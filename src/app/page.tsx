import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/common/logo';
import Image from 'next/image';

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8 text-center relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 animate-pulse">
         {/* Placeholder for a more elaborate background if needed */}
      </div>
      
      <div className="z-10 flex flex-col items-center">
        <Logo size="large" className="mb-8" />
        
        <h1 className="text-4xl md:text-5xl font-extrabold mb-6 text-glow-primary">
          Elevate Your Game to the Cosmos
        </h1>
        <p className="text-lg md:text-xl text-foreground/80 max-w-2xl mb-10">
          Turn your real-life 1v1 basketball matches into legendary cosmic battles. Log scores, track stats, and earn Aura as you dominate the court.
        </p>

        <div className="mb-12">
          <Image 
            src="https://placehold.co/600x400.png" 
            alt="Cosmic basketball action" 
            width={600} 
            height={400}
            data-ai-hint="basketball space"
            className="rounded-xl shadow-2xl glow-accent" 
          />
        </div>

        <div className="space-x-4">
          <Button asChild size="lg" className="glow-primary hover:opacity-90 transition-opacity">
            <Link href="/auth">Get Started</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="border-accent text-accent hover:bg-accent/10 transition-colors">
            <Link href="/auth?mode=signup">Sign Up</Link>
          </Button>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl">
          <FeatureCard title="Log Matches" description="Easily record scores from your 1v1 games." />
          <FeatureCard title="Earn Aura" description="Win matches to boost your cosmic Aura and climb the ranks." />
          <FeatureCard title="Dramatic Recaps" description="Relive your victories with AI-generated, epic game summaries." />
        </div>
      </div>
    </main>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="bg-card/50 backdrop-blur-sm p-6 rounded-lg border border-border glow-accent shadow-lg">
      <h3 className="text-2xl font-semibold mb-3 text-accent">{title}</h3>
      <p className="text-foreground/70">{description}</p>
    </div>
  );
}
