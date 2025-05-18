"use client";
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Star, Swords, Edit3, UserCircle, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';

interface UserProfileData {
  uid: string;
  displayName: string;
  email?: string;
  aura: number;
  avatarUrl?: string;
  createdAt?: any; 
}

interface MatchData {
  id: string;
  player1Id: string;
  player2Id: string;
  player1Name: string;
  player2Name: string;
  player1Score: number;
  player2Score: number;
  status: string;
  winnerId?: string;
  createdAt: any;
  recap?: string;
}

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const userId = params.userId === 'me' ? currentUser?.uid : params.userId as string;

  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [matchHistory, setMatchHistory] = useState<MatchData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false); // For future edit functionality

  useEffect(() => {
    if (!userId) {
      if (!authLoading) router.push('/auth'); // Redirect if no user and auth is resolved
      return;
    }

    const fetchProfileData = async () => {
      setIsLoading(true);
      try {
        const userDocRef = doc(db, 'users', userId);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          setProfileData({ uid: userDocSnap.id, ...userDocSnap.data() } as UserProfileData);
        } else {
          toast({ title: "Error", description: "User profile not found.", variant: "destructive" });
          router.push('/dashboard'); // Or a 404 page
          return;
        }

        // Fetch match history involving this user
        const q1 = query(collection(db, 'matches'), where('player1Id', '==', userId), where('status', '==', 'confirmed'), orderBy('createdAt', 'desc'));
        const q2 = query(collection(db, 'matches'), where('player2Id', '==', userId), where('status', '==', 'confirmed'), orderBy('createdAt', 'desc'));
        
        const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
        
        const matches: MatchData[] = [];
        snap1.forEach(doc => matches.push({ id: doc.id, ...doc.data() } as MatchData));
        snap2.forEach(doc => { // Avoid duplicates if a user plays against themselves (though unlikely)
          if (!matches.find(m => m.id === doc.id)) {
            matches.push({ id: doc.id, ...doc.data()} as MatchData);
          }
        });
        
        // Sort all matches by date
        matches.sort((a,b) => (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0));

        setMatchHistory(matches);

      } catch (error) {
        console.error("Error fetching profile data:", error);
        toast({ title: "Error", description: "Could not load profile information.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [userId, toast, router, authLoading]);

  if (isLoading || authLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
  }

  if (!profileData) {
    return <div className="text-center py-10">User not found or an error occurred.</div>;
  }

  const isOwnProfile = currentUser?.uid === profileData.uid;

  return (
    <div className="space-y-8">
      <Card className="bg-card/70 backdrop-blur-md shadow-2xl overflow-hidden">
        <div className="h-40 md:h-56 bg-gradient-to-br from-primary via-purple-600 to-accent relative">
           <Image src="https://placehold.co/1200x300.png" data-ai-hint="galaxy nebula" alt="Galactic Background" layout="fill" objectFit="cover" className="opacity-50" />
           <div className="absolute bottom-0 left-0 right-0 p-6 flex items-end space-x-4">
            <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-background shadow-lg">
              <AvatarImage src={profileData.avatarUrl || `https://placehold.co/128x128.png?text=${profileData.displayName?.[0]}`} alt={profileData.displayName} />
              <AvatarFallback className="text-4xl">{profileData.displayName?.[0].toUpperCase() || 'P'}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg">{profileData.displayName}</CardTitle>
              <CardDescription className="text-primary-foreground/80 drop-shadow-sm">Joined {profileData.createdAt?.toDate ? formatDistanceToNow(profileData.createdAt.toDate(), {addSuffix: true}) : 'the cosmos'}</CardDescription>
            </div>
           </div>
        </div>
        <CardContent className="pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center text-2xl font-bold text-accent">
              <Star className="w-8 h-8 mr-2 text-glow-accent" />
              <span>{profileData.aura || 0} Aura</span>
            </div>
            {isOwnProfile && (
              <Button variant="outline" onClick={() => setIsEditing(true)} disabled={isEditing} className="border-accent text-accent hover:bg-accent/10">
                <Edit3 className="mr-2 h-4 w-4" /> Edit Profile {isEditing && "(Coming Soon)"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Placeholder for Head-to-Head Stats if viewing another user's profile */}
      {!isOwnProfile && currentUser && (
        <Card className="bg-card/50">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center"><BarChart3 className="mr-2 h-6 w-6 text-accent" />Head-to-Head with {profileData.displayName}</CardTitle>
            <CardDescription>Your battle record against this cosmic warrior.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Head-to-head stats coming soon!</p>
            {/* TODO: Calculate and display H2H stats */}
          </CardContent>
        </Card>
      )}

      <Card className="bg-card/50">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center" id="match-history"><Swords className="mr-2 h-6 w-6 text-accent" />Match History</CardTitle>
          <CardDescription>Chronicles of past celestial clashes.</CardDescription>
        </CardHeader>
        <CardContent>
          {matchHistory.length === 0 ? (
            <p className="text-muted-foreground text-center py-6">No matches played yet. The arena awaits!</p>
          ) : (
            <ul className="space-y-4">
              {matchHistory.map(match => {
                const opponentName = match.player1Id === userId ? match.player2Name : match.player1Name;
                const opponentId = match.player1Id === userId ? match.player2Id : match.player1Id;
                const userScore = match.player1Id === userId ? match.player1Score : match.player2Score;
                const opponentScore = match.player1Id === userId ? match.player2Score : match.player1Score;
                const didWin = match.winnerId === userId;

                return (
                  <li key={match.id} className="p-4 bg-muted/30 rounded-lg shadow-md hover:shadow-primary/30 transition-shadow">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                      <div>
                        <p className="text-lg font-semibold">
                          vs <Link href={`/profile/${opponentId}`} className="text-accent hover:underline">{opponentName}</Link>
                        </p>
                        <p className={`text-xl font-bold ${didWin ? 'text-green-400' : 'text-red-400'}`}>
                          {didWin ? 'Victory' : 'Defeat'} ({userScore} - {opponentScore})
                        </p>
                        <p className="text-xs text-muted-foreground">
                           {match.createdAt?.toDate ? formatDistanceToNow(match.createdAt.toDate(), { addSuffix: true }) : 'A while ago'}
                        </p>
                      </div>
                      <div className="mt-2 sm:mt-0">
                         <Button variant="outline" size="sm" asChild className="border-primary text-primary hover:bg-primary/10">
                           <Link href={`/match/${match.id}`}>View Recap</Link>
                         </Button>
                      </div>
                    </div>
                    {match.recap && (
                      <p className="mt-3 text-sm text-foreground/80 italic border-l-2 border-accent pl-3">
                        "{match.recap.substring(0, 100)}{match.recap.length > 100 ? '...' : ''}"
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
