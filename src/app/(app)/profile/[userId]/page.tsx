
"use client";
import { useEffect, useState, type FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, orderBy, updateDoc } from 'firebase/firestore';
import { updateProfile as updateFirebaseProfile } from 'firebase/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Star, Swords, Edit3, UserCircle, BarChart3, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { Progress } from "@/components/ui/progress";

interface UserProfileData {
  uid: string;
  displayName: string;
  email?: string;
  aura: number;
  avatarUrl?: string;
  createdAt?: any;
  description?: string;
  bannerUrl?: string;
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

interface H2HStats {
  currentUserWins: number;
  viewedUserWins: number;
  totalPlayed: number;
}

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const userIdFromParams = params.userId === 'me' ? currentUser?.uid : params.userId as string;

  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [matchHistory, setMatchHistory] = useState<MatchData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isEditing, setIsEditing] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newAvatarUrl, setNewAvatarUrl] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newBannerUrl, setNewBannerUrl] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const [h2hStats, setH2hStats] = useState<H2HStats | null>(null);
  const [isLoadingH2H, setIsLoadingH2H] = useState(false);
  const [userId, setUserId] = useState<string | undefined>(userIdFromParams);

  useEffect(() => {
    if (params.userId === 'me' && currentUser) {
      setUserId(currentUser.uid);
    } else if (params.userId !== 'me') {
      setUserId(params.userId as string);
    }
  }, [params.userId, currentUser]);


  useEffect(() => {
    if (!userId) {
      if (!authLoading && params.userId === 'me' && !currentUser) {
        router.push('/auth');
      }
      return;
    }

    const fetchProfileData = async () => {
      setIsLoading(true);
      try {
        const userDocRef = doc(db, 'users', userId);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const data = userDocSnap.data() as UserProfileData;
          setProfileData({ uid: userDocSnap.id, ...data });
          setNewDisplayName(data.displayName || '');
          setNewAvatarUrl(data.avatarUrl || '');
          setNewDescription(data.description || '');
          setNewBannerUrl(data.bannerUrl || '');
        } else {
          toast({ title: "Error", description: "User profile not found.", variant: "destructive" });
          router.push('/dashboard');
          return;
        }

        const q1 = query(collection(db, 'matches'), where('player1Id', '==', userId), where('status', '==', 'confirmed'), orderBy('createdAt', 'desc'));
        const q2 = query(collection(db, 'matches'), where('player2Id', '==', userId), where('status', '==', 'confirmed'), orderBy('createdAt', 'desc'));
        
        const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
        
        const matches: MatchData[] = [];
        snap1.forEach(doc => matches.push({ id: doc.id, ...doc.data() } as MatchData));
        snap2.forEach(doc => {
          if (!matches.find(m => m.id === doc.id)) {
            matches.push({ id: doc.id, ...doc.data()} as MatchData);
          }
        });
        
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
  }, [userId, toast, router, authLoading, currentUser, params.userId]);


  useEffect(() => {
    const fetchH2HStats = async () => {
      if (!profileData || !currentUser || profileData.uid === currentUser.uid) {
        setH2hStats(null);
        return;
      }
      setIsLoadingH2H(true);
      try {
        const currentUserId = currentUser.uid;
        const viewedUserId = profileData.uid;
        const q1 = query(collection(db, 'matches'), where('player1Id', '==', currentUserId), where('player2Id', '==', viewedUserId), where('status', '==', 'confirmed'));
        const q2 = query(collection(db, 'matches'), where('player1Id', '==', viewedUserId), where('player2Id', '==', currentUserId), where('status', '==', 'confirmed'));
        const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
        const h2hMatchesRaw: MatchData[] = [];
        snap1.forEach(doc => h2hMatchesRaw.push({ id: doc.id, ...doc.data() } as MatchData));
        snap2.forEach(doc => h2hMatchesRaw.push({ id: doc.id, ...doc.data() } as MatchData));
        const h2hMatchIds = new Set<string>();
        const h2hMatches = h2hMatchesRaw.filter(match => {
            if (h2hMatchIds.has(match.id)) return false;
            h2hMatchIds.add(match.id);
            return true;
        });
        let currentUserWins = 0;
        let viewedUserWins = 0;
        h2hMatches.forEach(match => {
          if (match.winnerId === currentUserId) currentUserWins++;
          else if (match.winnerId === viewedUserId) viewedUserWins++;
        });
        setH2hStats({ currentUserWins, viewedUserWins, totalPlayed: h2hMatches.length });
      } catch (error) {
        console.error("Error fetching H2H stats:", error);
        toast({ title: "H2H Error", description: "Could not load head-to-head stats.", variant: "destructive" });
        setH2hStats(null);
      } finally {
        setIsLoadingH2H(false);
      }
    };
    if (profileData && currentUser) fetchH2HStats();
  }, [profileData, currentUser, toast]);

  const handleToggleEdit = () => {
    if (profileData) {
      setNewDisplayName(profileData.displayName || '');
      setNewAvatarUrl(profileData.avatarUrl || '');
      setNewDescription(profileData.description || '');
      setNewBannerUrl(profileData.bannerUrl || '');
    }
    setIsEditing(!isEditing);
  };

  const handleUpdateProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser || !profileData) return;
    if (!newDisplayName.trim()) {
      toast({ title: "Validation Error", description: "Username cannot be empty.", variant: "destructive" });
      return;
    }

    setIsUpdatingProfile(true);
    try {
      // Check for display name uniqueness if it has changed
      if (newDisplayName.trim() !== profileData.displayName) {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("displayName", "==", newDisplayName.trim()));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          let nameTaken = false;
          querySnapshot.forEach((doc) => {
            if (doc.id !== currentUser.uid) {
              nameTaken = true;
            }
          });
          if (nameTaken) {
            toast({ title: "Update Error", description: "Username already taken. Please choose another.", variant: "destructive" });
            setIsUpdatingProfile(false);
            return;
          }
        }
      }

      // Update Firebase Auth profile (only displayName and photoURL are standard)
      await updateFirebaseProfile(auth.currentUser!, { 
        displayName: newDisplayName.trim(),
        photoURL: newAvatarUrl.trim() || null, 
      });

      // Update Firestore document
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        displayName: newDisplayName.trim(),
        avatarUrl: newAvatarUrl.trim() || '', 
        description: newDescription.trim(),
        bannerUrl: newBannerUrl.trim() || '',
      });

      // Update local state
      setProfileData(prev => prev ? { 
        ...prev, 
        displayName: newDisplayName.trim(), 
        avatarUrl: newAvatarUrl.trim() || '',
        description: newDescription.trim(),
        bannerUrl: newBannerUrl.trim() || '',
      } : null);
      
      toast({ title: "Success", description: "Profile updated successfully!" });
      setIsEditing(false);
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({ title: "Error", description: error.message || "Failed to update profile.", variant: "destructive" });
    } finally {
      setIsUpdatingProfile(false);
    }
  };


  if (isLoading || authLoading || !userId) {
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
           <Image 
             src={profileData.bannerUrl || "https://placehold.co/1200x300.png?text=No+Banner"} 
             data-ai-hint="galaxy nebula space" 
             alt={profileData.displayName ? `${profileData.displayName}'s banner` : "User banner"}
             layout="fill" 
             objectFit="cover" 
             className="opacity-50" 
             priority={true} // Consider adding for LCP if this is a primary image
           />
           <div className="absolute bottom-0 left-0 right-0 p-6 flex items-end space-x-4">
            {!isEditing ? (
              <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-background shadow-lg">
                <AvatarImage src={profileData.avatarUrl || `https://placehold.co/128x128.png?text=${profileData.displayName?.[0]}`} data-ai-hint="abstract avatar" alt={profileData.displayName} />
                <AvatarFallback className="text-4xl">{profileData.displayName?.[0].toUpperCase() || 'P'}</AvatarFallback>
              </Avatar>
            ) : (
              <div className="h-24 w-24 md:h-32 md:w-32 border-4 border-background shadow-lg bg-muted rounded-full flex items-center justify-center text-muted-foreground">
                 Edit Mode
              </div>
            )}
            <div>
              {!isEditing ? (
                <CardTitle className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg">{profileData.displayName}</CardTitle>
              ) : (
                <div className="pb-2"> {/* Placeholder for spacing if needed */} </div>
              )}
              <CardDescription className="text-primary-foreground/80 drop-shadow-sm">Joined {profileData.createdAt?.toDate ? formatDistanceToNow(profileData.createdAt.toDate(), {addSuffix: true}) : 'the cosmos'}</CardDescription>
            </div>
           </div>
        </div>
        <CardContent className="pt-8">
          {isEditing && isOwnProfile ? (
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div>
                <Label htmlFor="newDisplayName" className="text-foreground/80">Username</Label>
                <Input
                  id="newDisplayName"
                  type="text"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  placeholder="Your new cosmic alias"
                  className="bg-background/50 mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="newAvatarUrl" className="text-foreground/80">Avatar URL</Label>
                <Input
                  id="newAvatarUrl"
                  type="url"
                  value={newAvatarUrl}
                  onChange={(e) => setNewAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.png"
                  className="bg-background/50 mt-1"
                />
                 <p className="text-xs text-muted-foreground mt-1">Enter a URL to an image for your avatar.</p>
              </div>
              <div>
                <Label htmlFor="newBannerUrl" className="text-foreground/80">Banner Image URL</Label>
                <Input
                  id="newBannerUrl"
                  type="url"
                  value={newBannerUrl}
                  onChange={(e) => setNewBannerUrl(e.target.value)}
                  placeholder="https://example.com/banner.png"
                  className="bg-background/50 mt-1"
                />
                 <p className="text-xs text-muted-foreground mt-1">Enter a URL for your profile banner.</p>
              </div>
              <div>
                <Label htmlFor="newDescription" className="text-foreground/80">Profile Description</Label>
                <Textarea
                  id="newDescription"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Tell us about your cosmic journey..."
                  className="bg-background/50 mt-1"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={handleToggleEdit} disabled={isUpdatingProfile}>
                  <X className="mr-2 h-4 w-4" /> Cancel
                </Button>
                <Button type="submit" disabled={isUpdatingProfile} className="glow-accent">
                  {isUpdatingProfile ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Changes
                </Button>
              </div>
            </form>
          ) : (
            <>
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center text-2xl font-bold text-accent">
                  <Star className="w-8 h-8 mr-2 text-glow-accent" />
                  <span>{profileData.aura} Aura</span>
                </div>
                {isOwnProfile && (
                  <Button variant="outline" onClick={handleToggleEdit} className="border-accent text-accent hover:bg-accent/10">
                    <Edit3 className="mr-2 h-4 w-4" /> Edit Profile
                  </Button>
                )}
              </div>
              {profileData.description && (
                <p className="mt-6 text-foreground/80 md:text-left text-center">{profileData.description}</p>
              )}
              {!profileData.description && (
                 <p className="mt-6 text-muted-foreground md:text-left text-center italic">No description provided yet.</p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {!isOwnProfile && currentUser && (
        <Card className="bg-card/50">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center"><BarChart3 className="mr-2 h-6 w-6 text-accent" />Head-to-Head with {profileData.displayName}</CardTitle>
            <CardDescription>Your battle record against this cosmic warrior.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingH2H ? (
              <div className="flex justify-center items-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : h2hStats && h2hStats.totalPlayed > 0 ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Matches:</span>
                  <span className="font-semibold">{h2hStats.totalPlayed}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Your Wins:</span>
                  <span className="font-semibold text-green-400">{h2hStats.currentUserWins}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{profileData.displayName}'s Wins:</span>
                  <span className="font-semibold text-red-400">{h2hStats.viewedUserWins}</span>
                </div>
                {h2hStats.totalPlayed > 0 && (
                  <div className="pt-2">
                    <Progress
                      value={h2hStats.totalPlayed > 0 ? (h2hStats.currentUserWins / h2hStats.totalPlayed) * 100 : 0}
                      className="h-3 [&>div]:bg-gradient-to-r [&>div]:from-green-400 [&>div]:to-primary"
                      aria-label={`Your win rate: ${h2hStats.totalPlayed > 0 ? ((h2hStats.currentUserWins / h2hStats.totalPlayed) * 100).toFixed(0) : 0}%`}
                    />
                     <div className="flex justify-between text-xs mt-1">
                       <span className="text-green-400">You ({h2hStats.totalPlayed > 0 ? ((h2hStats.currentUserWins / h2hStats.totalPlayed) * 100).toFixed(0) : 0}%)</span>
                       <span className="text-red-400">{profileData.displayName} ({h2hStats.totalPlayed > 0 ? ((h2hStats.viewedUserWins / h2hStats.totalPlayed) * 100).toFixed(0) : 0}%)</span>
                    </div>
                  </div>
                )}
              </div>
            ) : h2hStats && h2hStats.totalPlayed === 0 ? (
              <p className="text-muted-foreground text-center py-4">No matches played against each other yet.</p>
            ) : !isLoadingH2H ? (
              <p className="text-muted-foreground text-center py-4">Could not load head-to-head stats.</p>
            ) : null}
          </CardContent>
        </Card>
      )}

      <Card className="bg-card/50">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center" id="match-history"><Swords className="mr-2 h-6 w-6 text-accent" />Match History</CardTitle>
          <CardDescription>Chronicles of past celestial clashes for {profileData.displayName}.</CardDescription>
        </CardHeader>
        <CardContent>
          {matchHistory.length === 0 ? (
            <p className="text-muted-foreground text-center py-6">No matches played yet. The arena awaits!</p>
          ) : (
            <ul className="space-y-4">
              {matchHistory.map(match => {
                const isPlayer1ProfileUser = match.player1Id === profileData.uid;
                const opponentName = isPlayer1ProfileUser ? match.player2Name : match.player1Name;
                const opponentId = isPlayer1ProfileUser ? match.player2Id : match.player1Id;
                const profileUserScore = isPlayer1ProfileUser ? match.player1Score : match.player2Score;
                const opponentScore = isPlayer1ProfileUser ? match.player2Score : match.player1Score;
                const didProfileUserWin = match.winnerId === profileData.uid;

                return (
                  <li key={match.id} className="p-4 bg-muted/30 rounded-lg shadow-md hover:shadow-primary/30 transition-shadow">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                      <div>
                        <p className="text-lg font-semibold">
                          vs <Link href={`/profile/${opponentId}`} className="text-accent hover:underline">{opponentName || "Unknown Player"}</Link>
                        </p>
                        <p className={`text-xl font-bold ${didProfileUserWin ? 'text-green-400' : 'text-red-400'}`}>
                          {didProfileUserWin ? 'Victory' : 'Defeat'} ({profileUserScore} - {opponentScore})
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
