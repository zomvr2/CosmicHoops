
"use client";
import { useEffect, useState, type FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, orderBy, updateDoc } from 'firebase/firestore';
import { updateProfile as updateFirebaseProfile } from 'firebase/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles, Swords, Edit3, UserCircle, BarChart3, Save, X, BadgeCheck, LogOut, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import Image from 'next/image';
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Separator } from '@/components/ui/separator';

const DEFAULT_AVATAR_URL = "https://i.imgur.com/nkcoOPE.jpeg";
const DEFAULT_BANNER_URL = "https://placehold.co/1200x300.png"; // Plain white placeholder
const USERNAME_REGEX = /^[a-z0-9._]{3,20}$/;

interface UserProfileData {
  uid: string;
  displayName: string; // This is the @username
  fullName?: string;
  email?: string;
  aura: number;
  avatarUrl?: string;
  createdAt?: any;
  description?: string;
  bannerUrl?: string;
  isCertifiedHooper?: boolean;
  isCosmicMarshall?: boolean;
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

  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [matchHistory, setMatchHistory] = useState<MatchData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isEditing, setIsEditing] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newAvatarUrl, setNewAvatarUrl] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newBannerUrl, setNewBannerUrl] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const [h2hStats, setH2hStats] = useState<H2HStats | null>(null);
  const [isLoadingH2H, setIsLoadingH2H] = useState(false);
  
  const rawPageUserIdParam = params?.userId as string | undefined;

  useEffect(() => {
    const fetchProfileData = async () => {
      setIsLoading(true);
      
      let targetUserId: string | undefined = undefined;
      if (rawPageUserIdParam === 'me' && currentUser) {
        targetUserId = currentUser.uid;
      } else if (rawPageUserIdParam && rawPageUserIdParam !== 'me') {
        targetUserId = rawPageUserIdParam;
      }

      if (!targetUserId) {
        if (!authLoading && rawPageUserIdParam === 'me' && !currentUser) {
          router.push('/auth'); 
        } else if (!authLoading && !rawPageUserIdParam) {
            toast({ title: "Error", description: "User ID not provided.", variant: "destructive" });
            router.push('/dashboard');
        }
        if (!authLoading) setIsLoading(false);
        return;
      }

      try {
        const userDocRef = doc(db, 'users', targetUserId);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const data = userDocSnap.data() as UserProfileData;
          setProfileData({ uid: userDocSnap.id, ...data });
          setNewFullName(data.fullName || '');
          setNewDisplayName(data.displayName || '');
          setNewAvatarUrl(data.avatarUrl || DEFAULT_AVATAR_URL);
          setNewDescription(data.description || '');
          setNewBannerUrl(data.bannerUrl || ''); 
        } else {
          toast({ title: "Error", description: "User profile not found.", variant: "destructive" });
          router.push('/dashboard');
          return;
        }

        const q1 = query(collection(db, 'matches'), where('player1Id', '==', targetUserId), where('status', '==', 'confirmed'), orderBy('createdAt', 'desc'));
        const q2 = query(collection(db, 'matches'), where('player2Id', '==', targetUserId), where('status', '==', 'confirmed'), orderBy('createdAt', 'desc'));
        
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

    if (!authLoading) { 
        fetchProfileData();
    }
  }, [rawPageUserIdParam, currentUser, authLoading, toast, router]);

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
      setNewFullName(profileData.fullName || '');
      setNewDisplayName(profileData.displayName || '');
      setNewAvatarUrl(profileData.avatarUrl || DEFAULT_AVATAR_URL);
      setNewDescription(profileData.description || '');
      setNewBannerUrl(profileData.bannerUrl || '');
    }
    setIsEditing(!isEditing);
  };

  const handleUpdateProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser || !profileData) return;

    const trimmedNewFullName = newFullName.trim();
    if (trimmedNewFullName.length > 50) {
      toast({ title: "Validation Error", description: "Full Name cannot exceed 50 characters.", variant: "destructive" });
      return;
    }
    
    const trimmedNewDisplayName = newDisplayName.trim();
    const normalizedNewUsername = trimmedNewDisplayName.toLowerCase();

    if (!trimmedNewDisplayName) {
      toast({ title: "Validation Error", description: "Username cannot be empty.", variant: "destructive" });
      return;
    }
    if (!USERNAME_REGEX.test(normalizedNewUsername)) {
        toast({ title: "Validation Error", description: "Username must be 3-20 characters and can only contain lowercase letters, numbers, periods (.), and underscores (_).", variant: "destructive" });
        return;
    }

    setIsUpdatingProfile(true);
    try {
      if (normalizedNewUsername !== profileData.displayName) {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("displayName", "==", normalizedNewUsername));
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
        if (auth.currentUser && auth.currentUser.displayName !== normalizedNewUsername) {
            await updateFirebaseProfile(auth.currentUser, { 
              displayName: normalizedNewUsername,
            });
        }
      }

      const currentAuthPhotoURL = auth.currentUser?.photoURL || DEFAULT_AVATAR_URL;
      const newPhotoURLToSet = newAvatarUrl.trim() || DEFAULT_AVATAR_URL;
      if (auth.currentUser && newPhotoURLToSet !== currentAuthPhotoURL) {
         await updateFirebaseProfile(auth.currentUser, { 
            photoURL: newPhotoURLToSet, 
        });
      }

      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        fullName: trimmedNewFullName,
        displayName: normalizedNewUsername, 
        avatarUrl: newAvatarUrl.trim() || DEFAULT_AVATAR_URL, 
        description: newDescription.trim(),
        bannerUrl: newBannerUrl.trim(),
      });

      setProfileData(prev => prev ? { 
        ...prev, 
        fullName: trimmedNewFullName,
        displayName: normalizedNewUsername, 
        avatarUrl: newAvatarUrl.trim() || DEFAULT_AVATAR_URL,
        description: newDescription.trim(),
        bannerUrl: newBannerUrl.trim(),
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

  const handleLogout = async () => {
    await auth.signOut();
    toast({ title: "Logged Out", description: "You have been successfully logged out." });
    router.push("/");
  };

  if (isLoading || authLoading ) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
  }
  
  if (!profileData) {
    return <div className="text-center py-10">User not found or an error occurred.</div>;
  }

  const isOwnProfile = currentUser?.uid === profileData.uid;
  const currentBannerUrl = isEditing && isOwnProfile ? newBannerUrl : profileData.bannerUrl;
  const auraDisplayColor = profileData.aura < 0 ? 'text-red-400' : 'text-glow-accent';
  const auraIconColor = profileData.aura < 0 ? 'text-red-400' : 'text-glow-accent';
  const mainDisplayName = profileData.fullName || profileData.displayName;

  return (
    <TooltipProvider>
      <div className="space-y-0">
        {/* Banner Section */}
        <div className="h-40 md:h-56 bg-gradient-to-br from-primary/30 via-purple-600/30 to-accent/30 relative rounded-lg overflow-hidden">
          {currentBannerUrl && (
              <Image 
                src={currentBannerUrl} 
                alt={mainDisplayName ? `${mainDisplayName}'s banner` : "User banner"}
                layout="fill" 
                objectFit="cover" 
                priority={true}
                data-ai-hint="abstract space"
              />
          )}
          {isOwnProfile && !isEditing && (
            <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={handleToggleEdit} 
                className="bg-background/70 hover:bg-background/90 text-foreground border-foreground/30 p-2 rounded-lg text-xs"
              >
                <Edit3 className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Edit Profile</span>
              </Button>
              <Button 
                variant="outline" 
                size="icon"
                onClick={handleLogout} 
                className="sm:hidden bg-background/70 hover:bg-background/90 text-red-400 border-red-400/30 p-2 rounded-lg"
                aria-label="Logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        
        {/* Main Content Area Below Banner */}
        <div className="px-4 md:px-6">
            {/* Avatar - pulled up to overlap banner */}
          <div className="relative -mt-16 md:-mt-20">
            {isEditing && isOwnProfile ? (
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-muted border-4 border-background shadow-lg flex items-center justify-center text-muted-foreground">
                  <UserCircle className="w-16 h-16 md:w-20 md:h-20" />
                </div>
              ) : (
              <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-background shadow-lg">
                <AvatarImage src={profileData.avatarUrl || DEFAULT_AVATAR_URL} alt={mainDisplayName} />
                <AvatarFallback className="text-4xl">{mainDisplayName?.[0].toUpperCase() || 'P'}</AvatarFallback>
              </Avatar>
            )}
          </div>

          {/* Full Name, Badges */}
          <div className="mt-3">
            <h1 className="text-2xl md:text-3xl font-bold leading-tight flex items-center gap-x-2">
              {mainDisplayName}
              {profileData.isCertifiedHooper && (
                <Tooltip>
                  <TooltipTrigger>
                    <BadgeCheck className="h-5 w-5 text-blue-400" />
                  </TooltipTrigger>
                  <TooltipContent><p>Certified Hooper</p></TooltipContent>
                </Tooltip>
              )}
              {profileData.isCosmicMarshall && (
                <Tooltip>
                  <TooltipTrigger>
                    <ShieldCheck className="h-5 w-5 text-orange-400" />
                  </TooltipTrigger>
                  <TooltipContent><p>Cosmic Marshall</p></TooltipContent>
                </Tooltip>
              )}
            </h1>
          </div>

          {/* Username and Aura */}
          <div className="mt-1 flex justify-between items-center">
            <p className="text-muted-foreground">@{profileData.displayName}</p>
            <div className={`flex items-center font-bold ${auraDisplayColor}`}>
              <Sparkles className={`w-4 h-4 mr-1 ${auraIconColor}`} aria-hidden="true"/>
              <span>{profileData.aura} Aura</span>
            </div>
          </div>
        </div>
      
        {/* Description Card or Edit Form Section */}
        <div className="px-4 md:px-6 mt-8">
          <Card className="bg-card/70 backdrop-blur-md">
            <CardContent className="p-6">
              {isEditing && isOwnProfile ? (
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div>
                    <Label htmlFor="newFullName" className="text-foreground/80">Full Name</Label>
                    <Input id="newFullName" type="text" value={newFullName} onChange={(e) => setNewFullName(e.target.value)} placeholder="Your full name (e.g. Alex Cosmic)" className="bg-background/50 mt-1" />
                    <p className="text-xs text-muted-foreground mt-1">1-50 characters. This is how others will see you.</p>
                  </div>
                  <div>
                    <Label htmlFor="newDisplayName" className="text-foreground/80">Username (@)</Label>
                    <Input id="newDisplayName" type="text" value={newDisplayName} onChange={(e) => setNewDisplayName(e.target.value)} placeholder="Your unique username (e.g. alex_cosmic)" className="bg-background/50 mt-1" required />
                    <p className="text-xs text-muted-foreground mt-1">3-20 characters. Lowercase, numbers, '.', or '_'.</p>
                    <p className="text-xs text-muted-foreground mt-1">Username must be unique and will be checked upon saving.</p>
                  </div>
                  <div>
                    <Label htmlFor="newAvatarUrl" className="text-foreground/80">Avatar URL</Label>
                    <Input id="newAvatarUrl" type="url" value={newAvatarUrl} onChange={(e) => setNewAvatarUrl(e.target.value)} placeholder="https://example.com/avatar.png" className="bg-background/50 mt-1" />
                    <p className="text-xs text-muted-foreground mt-1">Enter a URL for your avatar.</p>
                  </div>
                  <div>
                    <Label htmlFor="newBannerUrl" className="text-foreground/80">Banner Image URL</Label>
                    <Input id="newBannerUrl" type="url" value={newBannerUrl} onChange={(e) => setNewBannerUrl(e.target.value)} placeholder="https://example.com/banner.png" className="bg-background/50 mt-1" />
                    <p className="text-xs text-muted-foreground mt-1">Enter a URL for your profile banner. Leave empty for default gradient.</p>
                  </div>
                  <div>
                    <Label htmlFor="newDescription" className="text-foreground/80">Profile Description</Label>
                    <Textarea id="newDescription" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} placeholder="Tell us about your cosmic journey..." className="bg-background/50 mt-1" rows={3} />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={handleToggleEdit} disabled={isUpdatingProfile}><X className="mr-2 h-4 w-4" /> Cancel</Button>
                    <Button type="submit" disabled={isUpdatingProfile} className="glow-accent">{isUpdatingProfile ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Save Changes</Button>
                  </div>
                </form>
              ) : (
                <>
                  <p className="text-foreground/80 prose prose-invert max-w-none">{profileData.description || "No description provided yet."}</p>
                   {isOwnProfile && (
                    <CardFooter className="sm:hidden px-0 pb-0 pt-6"> {/* Mobile Logout Button inside card */}
                      <Button variant="outline" onClick={handleLogout} className="w-full rounded-full text-red-400 border-red-400/50 hover:border-red-400 hover:text-red-300">
                        <LogOut className="mr-2 h-4 w-4" /> Logout
                      </Button>
                    </CardFooter>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      
        {/* H2H/Match History cards */}
        <div className="px-4 md:px-6 mt-6 space-y-8 pb-8">
          {!isOwnProfile && currentUser && (
            <Card className="bg-card/70 backdrop-blur-md">
              <CardHeader><CardTitle className="text-2xl flex items-center"><BarChart3 className="mr-2 h-6 w-6 text-accent" />Head-to-Head with @{profileData.displayName}</CardTitle><CardDescription>Your battle record against this cosmic warrior.</CardDescription></CardHeader>
              <CardContent>
                {isLoadingH2H ? <div className="flex justify-center items-center py-4"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                  : h2hStats && h2hStats.totalPlayed > 0 ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center"><span className="text-muted-foreground">Total Matches:</span><span className="font-semibold">{h2hStats.totalPlayed}</span></div>
                    <div className="flex justify-between items-center"><span className="text-muted-foreground">Your Wins:</span><span className="font-semibold text-green-400">{h2hStats.currentUserWins}</span></div>
                    <div className="flex justify-between items-center"><span className="text-muted-foreground">@{profileData.displayName}'s Wins:</span><span className="font-semibold text-red-400">{h2hStats.viewedUserWins}</span></div>
                    {h2hStats.totalPlayed > 0 && (
                      <div className="pt-2">
                        <Progress value={h2hStats.totalPlayed > 0 ? (h2hStats.currentUserWins / h2hStats.totalPlayed) * 100 : 0} className="h-3 [&>div]:bg-gradient-to-r [&>div]:from-green-400 [&>div]:to-primary" aria-label={`Your win rate: ${h2hStats.totalPlayed > 0 ? ((h2hStats.currentUserWins / h2hStats.totalPlayed) * 100).toFixed(0) : 0}%`} />
                         <div className="flex justify-between text-xs mt-1">
                           <span className="text-green-400">You ({h2hStats.totalPlayed > 0 ? ((h2hStats.currentUserWins / h2hStats.totalPlayed) * 100).toFixed(0) : 0}%)</span>
                           <span className="text-red-400">@{profileData.displayName} ({h2hStats.totalPlayed > 0 ? ((h2hStats.viewedUserWins / h2hStats.totalPlayed) * 100).toFixed(0) : 0}%)</span>
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

          <Card className="bg-card/70 backdrop-blur-md mt-6" id="match-history">
            <CardHeader><CardTitle className="text-2xl flex items-center"><Swords className="mr-2 h-6 w-6 text-accent" />Match History</CardTitle><CardDescription>Chronicles of past celestial clashes for @{profileData.displayName}.</CardDescription></CardHeader>
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
                    const matchDate = match.createdAt?.toDate ? new Date(match.createdAt.toDate()).toLocaleDateString() : 'A while ago';
                    return (
                      <li key={match.id} className="p-4 bg-muted/30 rounded-lg border border-border/30">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                          <div>
                            <p className="text-lg font-semibold">vs <Link href={`/profile/${opponentId}`} className="text-accent hover:underline">@{opponentName || "Unknown Player"}</Link></p>
                            <p className={`text-xl font-bold ${didProfileUserWin ? 'text-green-400' : 'text-red-400'}`}>{didProfileUserWin ? 'Victory' : 'Defeat'} ({profileUserScore} - {opponentScore})</p>
                            <p className="text-xs text-muted-foreground">{matchDate}</p>
                          </div>
                          <div className="mt-2 sm:mt-0">
                             <Button variant="outline" size="sm" asChild className="border-primary text-primary hover:bg-primary/10"><Link href={`/match/${match.id}`}>View Recap</Link></Button>
                          </div>
                        </div>
                        {match.recap && (
                          <p className="mt-3 text-sm text-foreground/80 italic border-l-2 border-accent pl-3">"{match.recap.substring(0, 100)}{match.recap.length > 100 ? '...' : ''}"</p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  );
}

    
