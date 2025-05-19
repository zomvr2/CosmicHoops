
"use client";

import { useState, useEffect } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { useAuth } from "@/hooks/use-auth";
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BarChart, Swords, Users, Sparkles, Loader2 } from "lucide-react"; // Changed Star to Sparkles
import Image from "next/image";
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

// Define Match interface (can be moved to a shared types file later)
interface Match {
  id: string;
  player1Id: string;
  player2Id: string;
  player1Name: string;
  player2Name: string;
  player1Score: number;
  player2Score: number;
  status: 'pending_player2' | 'confirmed' | 'rejected_by_player2';
  winnerId?: string;
  recap?: string;
  createdAt: Timestamp; // Firestore Timestamp
  confirmedAt?: Timestamp; // Firestore Timestamp
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [auraPoints, setAuraPoints] = useState<number | null>(null);
  const [recentMatches, setRecentMatches] = useState<Match[]>([]);
  const [isLoadingAura, setIsLoadingAura] = useState(true);
  const [isLoadingMatches, setIsLoadingMatches] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Fetch Aura Points
    const fetchAura = async () => {
      setIsLoadingAura(true);
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setAuraPoints(userDocSnap.data().aura || 0);
        } else {
          setAuraPoints(0); // Default to 0 if no profile found
          console.warn("User profile not found for aura, defaulting to 0.");
        }
      } catch (error) {
        console.error("Error fetching aura points:", error);
        toast({ title: "Error", description: "Could not load your Aura points.", variant: "destructive" });
        setAuraPoints(0); // Default on error
      } finally {
        setIsLoadingAura(false);
      }
    };

    // Fetch Recent Matches
    const fetchRecentMatches = async () => {
      setIsLoadingMatches(true);
      try {
        // Query for matches where user is player1
        const q1 = query(
          collection(db, 'matches'),
          where('player1Id', '==', user.uid),
          where('status', '==', 'confirmed'),
          orderBy('confirmedAt', 'desc'), 
          limit(5) // Fetch a bit more to ensure we get enough after merging
        );
        // Query for matches where user is player2
        const q2 = query(
          collection(db, 'matches'),
          where('player2Id', '==', user.uid),
          where('status', '==', 'confirmed'),
          orderBy('confirmedAt', 'desc'),
          limit(5)
        );

        const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
        
        let matches: Match[] = [];
        snap1.forEach(doc => matches.push({ id: doc.id, ...doc.data() } as Match));
        snap2.forEach(docSnap => { // Renamed to docSnap to avoid conflict
          // Ensure no duplicates if a match somehow appears in both (e.g., self-play though not intended)
          if (!matches.find(m => m.id === docSnap.id)) { 
            matches.push({ id: docSnap.id, ...docSnap.data() } as Match);
          }
        });
        
        // Sort all fetched matches by confirmedAt (most recent first)
        // Handle cases where confirmedAt might be null or undefined if data is old
        matches.sort((a, b) => (b.confirmedAt?.toMillis() || 0) - (a.confirmedAt?.toMillis() || 0));
        
        setRecentMatches(matches.slice(0, 3)); // Take the top 3 most recent matches

      } catch (error) {
        console.error("Error fetching recent matches:", error);
        toast({ title: "Error", description: "Could not load recent matches.", variant: "destructive" });
      } finally {
        setIsLoadingMatches(false);
      }
    };

    fetchAura();
    fetchRecentMatches();

  }, [user, toast]);


  if (!user) return null; 

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
              <Sparkles className="w-7 h-7 mr-2 text-glow-accent" /> {/* Changed Star to Sparkles */}
              {isLoadingAura ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <span>{auraPoints ?? 0} Aura</span>
              )}
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
            {isLoadingMatches ? (
              <div className="flex justify-center items-center py-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : recentMatches.length > 0 ? (
              <ul className="space-y-3">
                {recentMatches.map((match) => {
                  const isPlayer1 = user.uid === match.player1Id;
                  const opponentName = isPlayer1 ? match.player2Name : match.player1Name;
                  const userScore = isPlayer1 ? match.player1Score : match.player2Score;
                  const opponentScore = isPlayer1 ? match.player2Score : match.player1Score;
                  const resultString = userScore > opponentScore ? `W ${userScore}-${opponentScore}` : `L ${userScore}-${opponentScore}`;
                  const matchDate = match.confirmedAt?.toDate();

                  return (
                    <li key={match.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
                      <div>
                        <p className="font-semibold">vs {opponentName || "Unknown Player"}</p>
                        <p className={`text-sm ${userScore > opponentScore ? 'text-green-400' : 'text-red-400'}`}>{resultString}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {matchDate ? formatDistanceToNow(matchDate, { addSuffix: true }) : 'Recently'}
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-muted-foreground text-center py-4">No recent confirmed matches. Time to hit the court!</p>
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

