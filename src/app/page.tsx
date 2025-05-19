import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/common/logo';
import Image from 'next/image';
import { ChevronRight } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="px-4 lg:px-6 h-16 flex items-center sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Link href="/" className="flex items-center justify-center" prefetch={false}>
          <Logo size="small" className="text-2xl" /> 
        </Link>
        <nav className="ml-auto flex items-center gap-4 sm:gap-6">
          <Link className="text-sm font-medium hover:text-primary transition-colors" href="#" prefetch={false}>
            Product
          </Link>
          <Link className="text-sm font-medium hover:text-primary transition-colors" href="#" prefetch={false}>
            Pricing
          </Link>
          <Link className="text-sm font-medium hover:text-primary transition-colors" href="#" prefetch={false}>
            Integrations
          </Link>
          <Link className="text-sm font-medium hover:text-primary transition-colors" href="#" prefetch={false}>
            Blog
          </Link>
          <Button variant="outline" size="sm" asChild className="hidden sm:inline-flex border-accent text-accent hover:bg-accent/10 hover:text-accent">
            <Link href="/auth">View Demo</Link>
          </Button>
          <Button size="sm" asChild className="glow-primary hover:opacity-90 transition-opacity">
            <Link href="/auth?mode=signup">Sign In</Link>
          </Button>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-20 md:py-32 lg:py-40 xl:py-48 flex flex-col items-center text-center">
          <div className="container px-4 md:px-6">
            <div className="inline-block rounded-lg bg-muted/50 px-3 py-1 text-sm mb-6 border border-border hover:border-primary/50 transition-colors">
              <Link href="#" className="flex items-center gap-1" prefetch={false}>
                <span>All in One Team Integration</span>
                <ChevronRight className="h-4 w-4 text-primary" />
              </Link>
            </div>
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none text-glow-primary leading-tight">
              Unite every tool,<br />every team, everywhere.
            </h1>
            <p className="mx-auto max-w-[700px] text-foreground/80 md:text-xl mt-6 mb-10">
              Seamlessly manage projects, automate tasks, and collaborate in real-time
              across all apps and devices—all in one platform.
            </p>
            <div className="flex justify-center items-center h-64 md:h-80 lg:h-96 my-12">
              {/* Placeholder for the central glowing graphic element */}
              <Image
                src="https://placehold.co/400x300.png"
                alt="Central platform graphic"
                width={400}
                height={300}
                data-ai-hint="technology abstract glow"
                className="rounded-xl shadow-2xl glow-accent opacity-75"
              />
            </div>
            <div className="flex flex-col gap-4 min-[400px]:flex-row justify-center">
              <Button size="lg" asChild className="glow-primary hover:opacity-90 transition-opacity">
                <Link href="/auth?mode=signup">Get Started for Free</Link>
              </Button>
              <Button variant="outline" size="lg" asChild className="border-accent text-accent hover:bg-accent/20 hover:text-accent transition-colors">
                <Link href="/auth">View Demo</Link>
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
