"use client";

import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BarChart, Swords, Users, Star } from "lucide-react";
import Image from "next/image";

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) return null; // Should be handled by layout

  // Placeholder data
  const auraPoints = 1250;
  const recentMatches = [
    { id: "1", opponent: "NovaBlaster", result: "W 11-7", date: "Yesterday" },
    { id: "2", opponent: "GalaxyHooper", result: "L 5-11", date: "2 days ago" },
    { id: "3", opponent: "CometStriker", result: "W 11-9", date: "3 days ago" },
  ];

  return (
    <div className="space-y-8">
      <Card className="bg-card/70 backdrop-blur-md shadow-xl glow-primary">
        <CardHeader>
          <CardTitle className="text-3xl md:text-4xl text-glow-primary">Welcome, {user.displayName || "Champion"}!</CardTitle>
          <CardDescription>Your cosmic basketball journey continues here. Ready to dominate the galaxy?</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center text-2xl font-bold text-accent">
              <Star className="w-7 h-7 mr-2 text-glow-accent" />
              <span>{auraPoints} Aura</span>
            </div>
            <p className="text-muted-foreground">Your current cosmic energy level. Keep winning to increase it!</p>
          </div>
          <Button asChild size="lg" className="glow-accent">
            <Link href="/start-match">
              <Swords className="mr-2 h-5 w-5" /> Start New Match
            </Link>
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-card/70 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-2xl text-accent">Recent Matches</CardTitle>
            <CardDescription>Your latest cosmic battles.</CardDescription>
          </CardHeader>
          <CardContent>
            {recentMatches.length > 0 ? (
              <ul className="space-y-3">
                {recentMatches.map((match) => (
                  <li key={match.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
                    <div>
                      <p className="font-semibold">vs {match.opponent}</p>
                      <p className={`text-sm ${match.result.startsWith('W') ? 'text-green-400' : 'text-red-400'}`}>{match.result}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{match.date}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">No recent matches. Time to hit the court!</p>
            )}
             <Button variant="link" asChild className="mt-4 text-accent p-0 h-auto">
              <Link href="/profile/me#match-history">View all matches</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card/70 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-2xl text-accent">Quick Actions</CardTitle>
             <CardDescription>Navigate your宇宙 (uchuu - universe).</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <QuickActionCard href="/friends" icon={Users} label="Friends" description="Manage your rivals." />
            <QuickActionCard href="/profile/me" icon={BarChart} label="Stats" description="View your progress." />
            {/* Add more quick actions as needed */}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card/70 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-2xl text-accent">Weekly Missions</CardTitle>
          <CardDescription>Complete challenges for bonus Aura and bragging rights!</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Placeholder for Weekly Missions */}
          <div className="flex items-center justify-center p-6 bg-muted/30 rounded-lg">
            <Image src="https://placehold.co/300x150.png" data-ai-hint="space mission badge" alt="Weekly Mission Banner" width={300} height={150} className="rounded-md opacity-70"/>
          </div>
          <p className="mt-4 text-center text-muted-foreground">New missions arriving soon from Galactic Command!</p>
        </CardContent>
      </Card>

    </div>
  );
}

function QuickActionCard({ href, icon: Icon, label, description }: { href: string; icon: any; label: string; description: string }) {
  return (
    <Link href={href} className="block p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors group">
      <Icon className="w-8 h-8 mb-2 text-primary group-hover:text-glow-primary transition-all" />
      <h4 className="font-semibold text-lg">{label}</h4>
      <p className="text-sm text-muted-foreground">{description}</p>
    </Link>
  );
}
