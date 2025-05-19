
"use client";
import { useState, useEffect, type FormEvent } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc, writeBatch } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Swords } from 'lucide-react';
import type { User as FirebaseUser } from 'firebase/auth';
import Link from 'next/link'; // Added Link import

interface Friend {
  id: string;
  displayName: string;
}

export default function StartMatchPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriendId, setSelectedFriendId] = useState<string>('');
  const [player1Score, setPlayer1Score] = useState<string>('');
  const [player2Score, setPlayer2Score] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingFriends, setIsFetchingFriends] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchFriends = async () => {
      setIsFetchingFriends(true);
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          const friendIds = userData.friends || [];
          if (friendIds.length > 0) {
            const friendsQuery = query(collection(db, 'users'), where('uid', 'in', friendIds));
            const friendsSnap = await getDocs(friendsQuery);
            const fetchedFriends = friendsSnap.docs.map(doc => ({ id: doc.id, displayName: doc.data().displayName || 'Unnamed Player' }));
            setFriends(fetchedFriends);
          }
        }
      } catch (error) {
        console.error("Error fetching friends:", error);
        toast({ title: "Error", description: "Could not fetch friends list.", variant: "destructive" });
      } finally {
        setIsFetchingFriends(false);
      }
    };

    fetchFriends();
  }, [user, toast]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!user || !selectedFriendId || player1Score === '' || player2Score === '') {
      toast({ title: "Error", description: "Please fill all fields.", variant: "destructive" });
      return;
    }

    const p1Score = parseInt(player1Score);
    const p2Score = parseInt(player2Score);

    if (isNaN(p1Score) || isNaN(p2Score) || p1Score < 0 || p2Score < 0) {
      toast({ title: "Error", description: "Scores must be non-negative numbers.", variant: "destructive" });
      return;
    }
    if (p1Score === p2Score) {
      toast({ title: "Error", description: "Scores cannot be tied. One player must win.", variant: "destructive" });
      return;
    }


    setIsLoading(true);
    try {
      const matchData = {
        player1Id: user.uid,
        player2Id: selectedFriendId,
        player1Name: user.displayName, // Store names for easier display
        player2Name: friends.find(f => f.id === selectedFriendId)?.displayName,
        player1Score: p1Score,
        player2Score: p2Score,
        status: 'pending_player2', // Player 2 needs to confirm
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const matchRef = await addDoc(collection(db, 'matches'), matchData);

      // Create notification for player 2
      const notificationData = {
        userId: selectedFriendId, // Recipient
        type: 'match_invite' as 'match_invite',
        message: `${user.displayName || 'A player'} has logged a match with you. Please confirm.`,
        relatedId: matchRef.id, // ID of the match document
        isRead: false,
        createdAt: serverTimestamp(),
        senderId: user.uid,
        senderName: user.displayName
      };
      await addDoc(collection(db, 'notifications'), notificationData);


      toast({ title: "Match Logged!", description: "Waiting for your friend to confirm the score." });
      router.push('/dashboard');
    } catch (error) {
      console.error("Error logging match:", error);
      toast({ title: "Error", description: "Could not log match.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="bg-card/70 backdrop-blur-md">
        <CardHeader>
          <div className="flex items-center space-x-2 mb-2">
            <Swords className="h-8 w-8 text-accent text-glow-accent" />
            <CardTitle className="text-3xl">Log New Cosmic Clash</CardTitle>
          </div>
          <CardDescription>Record the outcome of your latest 1v1 battle. May the best Hooper win!</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="friend">Select Opponent</Label>
              {isFetchingFriends ? (
                 <div className="flex items-center space-x-2 text-muted-foreground mt-2">
                   <Loader2 className="h-4 w-4 animate-spin" /> <span>Loading friends...</span>
                 </div>
              ) : friends.length === 0 ? (
                <p className="text-sm text-muted-foreground mt-2">
                  No friends found. <Link href="/friends" className="text-accent hover:underline">Add friends</Link> to log a match.
                </p>
              ) : (
                <Select onValueChange={setSelectedFriendId} value={selectedFriendId} required>
                  <SelectTrigger id="friend" className="bg-background/50 mt-1">
                    <SelectValue placeholder="Choose your challenger" />
                  </SelectTrigger>
                  <SelectContent>
                    {friends.map(friend => (
                      <SelectItem key={friend.id} value={friend.id}>
                        {friend.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 items-end">
              <div>
                <Label htmlFor="player1Score">{user.displayName || "Your"} Score (Player 1)</Label>
                <Input
                  id="player1Score"
                  type="number"
                  value={player1Score}
                  onChange={(e) => setPlayer1Score(e.target.value)}
                  placeholder="e.g., 11"
                  required
                  className="bg-background/50 mt-1"
                  min="0"
                />
              </div>
              <div>
                <Label htmlFor="player2Score">Opponent's Score (Player 2)</Label>
                <Input
                  id="player2Score"
                  type="number"
                  value={player2Score}
                  onChange={(e) => setPlayer2Score(e.target.value)}
                  placeholder="e.g., 7"
                  required
                  className="bg-background/50 mt-1"
                  min="0"
                />
              </div>
            </div>
            
            <Button type="submit" className="w-full glow-primary" disabled={isLoading || isFetchingFriends || friends.length === 0 || !selectedFriendId}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Log Match
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
