
"use client";
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp, writeBatch, collection, addDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Swords, CheckCircle, XCircle, MessageSquareText, User, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateDramaticRecap } from '@/ai/flows/generate-dramatic-recap'; // Assuming this is a server action
import { format } from 'date-fns'; // For formatting dates

interface MatchDetails {
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
  createdAt: any; // Firestore Timestamp
  confirmedAt?: any;
}

export default function MatchDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const matchId = params.matchId as string;

  const [matchDetails, setMatchDetails] = useState<MatchDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    if (!matchId || authLoading) return;
    if (!currentUser && !authLoading) { // Redirect if not logged in after auth check
        router.push('/auth');
        return;
    }


    const fetchMatchDetails = async () => {
      setIsLoading(true);
      try {
        const matchDocRef = doc(db, 'matches', matchId);
        const matchDocSnap = await getDoc(matchDocRef);

        if (matchDocSnap.exists()) {
          const data = matchDocSnap.data();
          // Ensure current user is part of the match
          if (currentUser && (data.player1Id === currentUser.uid || data.player2Id === currentUser.uid)) {
            setMatchDetails({ id: matchDocSnap.id, ...data } as MatchDetails);
          } else {
            toast({ title: "Access Denied", description: "You are not part of this match.", variant: "destructive" });
            router.push('/dashboard');
          }
        } else {
          toast({ title: "Error", description: "Match not found.", variant: "destructive" });
          router.push('/dashboard');
        }
      } catch (error) {
        console.error("Error fetching match details:", error);
        toast({ title: "Error", description: "Could not load match details.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };

    fetchMatchDetails();
  }, [matchId, currentUser, authLoading, router, toast]);

  const handleMatchConfirmation = async (confirmed: boolean) => {
    if (!currentUser || !matchDetails || matchDetails.status !== 'pending_player2' || currentUser.uid !== matchDetails.player2Id) return;

    setIsActionLoading(true);
    try {
      const batch = writeBatch(db);
      const matchRef = doc(db, 'matches', matchId);
      let updatedMatchData: Partial<MatchDetails> = {};

      if (confirmed) {
        const winnerId = matchDetails.player1Score > matchDetails.player2Score ? matchDetails.player1Id : matchDetails.player2Id;
        const loserId = matchDetails.player1Score < matchDetails.player2Score ? matchDetails.player1Id : matchDetails.player2Id;
        const auraGain = 10; 
        const auraLoss = -5; // Loser loses 5 points

        updatedMatchData = {
          status: 'confirmed',
          winnerId: winnerId,
          confirmedAt: serverTimestamp(),
        };
        batch.update(matchRef, updatedMatchData);
        
        // Update winner's Aura
        const winnerUserRef = doc(db, 'users', winnerId);
        const winnerSnap = await getDoc(winnerUserRef);
        if (winnerSnap.exists()) {
            const currentAura = winnerSnap.data().aura || 0;
            batch.update(winnerUserRef, { aura: Math.max(0, currentAura + auraGain) });
        }

        // Update loser's Aura
        if (winnerId !== loserId) { // ensure there is a distinct loser
            const loserUserRef = doc(db, 'users', loserId);
            const loserSnap = await getDoc(loserUserRef);
            if (loserSnap.exists()) {
                const currentAura = loserSnap.data().aura || 0;
                batch.update(loserUserRef, { aura: Math.max(0, currentAura + auraLoss) });
            }
        }

        // Generate recap
        const recapInput = {
          player1Name: matchDetails.player1Name || "Player 1",
          player2Name: matchDetails.player2Name || "Player 2",
          player1Score: matchDetails.player1Score,
          player2Score: matchDetails.player2Score,
        };
        const recapOutput = await generateDramaticRecap(recapInput);
        batch.update(matchRef, { recap: recapOutput.recap });
        updatedMatchData.recap = recapOutput.recap; // For local state update

        // Notify player 1 (original logger)
        const p1Notification = {
            userId: matchDetails.player1Id,
            type: 'recap_ready' as 'recap_ready',
            message: `Your match against ${matchDetails.player2Name} is confirmed! Recap available.`,
            relatedId: matchId,
            isRead: false,
            createdAt: serverTimestamp(),
            senderId: currentUser.uid,
            senderName: currentUser.displayName
        };
        batch.set(doc(collection(db, 'notifications')), p1Notification);

      } else { // Rejected
        updatedMatchData = { status: 'rejected_by_player2' };
        batch.update(matchRef, updatedMatchData);
        // Notify player 1
         const p1Notification = {
            userId: matchDetails.player1Id,
            type: 'match_invite' as 'match_invite', 
            message: `${currentUser.displayName || 'Opponent'} rejected the scores. Please discuss and re-log.`,
            relatedId: matchId,
            isRead: false,
            createdAt: serverTimestamp(),
            senderId: currentUser.uid,
            senderName: currentUser.displayName
        };
        batch.set(doc(collection(db, 'notifications')), p1Notification);
      }
      
      await batch.commit();
      
      setMatchDetails(prev => prev ? { ...prev, ...updatedMatchData } : null);
      toast({ title: "Match Update", description: `Match ${confirmed ? 'confirmed' : 'rejected'} successfully.` });

    } catch (error: any) {
      console.error("Error confirming match:", error);
      toast({ title: "Error", description: error.message || "Failed to update match status.", variant: "destructive" });
    } finally {
      setIsActionLoading(false);
    }
  };


  if (isLoading || authLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
  }

  if (!matchDetails) {
    return <div className="text-center py-10">Match not found or an error occurred.</div>;
  }

  const isPlayer1 = currentUser?.uid === matchDetails.player1Id;
  const canConfirm = matchDetails.status === 'pending_player2' && currentUser?.uid === matchDetails.player2Id;
  const datePlayed = matchDetails.createdAt?.toDate ? format(matchDetails.createdAt.toDate(), 'MMMM d, yyyy HH:mm') : 'N/A';
  const dateConfirmed = matchDetails.confirmedAt?.toDate ? format(matchDetails.confirmedAt.toDate(), 'MMMM d, yyyy HH:mm') : 'N/A';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card className="bg-card/70 backdrop-blur-md shadow-xl glow-primary overflow-hidden">
        <CardHeader className="bg-gradient-to-br from-primary/30 to-accent/30 p-6">
          <div className="flex items-center space-x-3 mb-2">
            <Swords className="h-10 w-10 text-primary text-glow-primary" />
            <CardTitle className="text-3xl md:text-4xl">Cosmic Clash Details</CardTitle>
          </div>
          <CardDescription className="text-foreground/80">
            Battle recorded on: {datePlayed}
            {matchDetails.status === 'confirmed' && ` | Confirmed: ${dateConfirmed}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center text-center md:text-left">
            {/* Player 1 Info */}
            <div className="space-y-2 p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-center md:justify-start space-x-2">
                <User className="h-6 w-6 text-accent"/>
                <h3 className="text-2xl font-semibold">{matchDetails.player1Name}</h3>
              </div>
              <p className="text-4xl font-bold text-primary">{matchDetails.player1Score}</p>
              {matchDetails.status === 'confirmed' && matchDetails.winnerId === matchDetails.player1Id && (
                <div className="flex items-center justify-center md:justify-start text-green-400">
                  <Star className="h-5 w-5 mr-1 fill-current"/> Victorious
                </div>
              )}
            </div>

            {/* Player 2 Info */}
            <div className="space-y-2 p-4 bg-muted/30 rounded-lg">
               <div className="flex items-center justify-center md:justify-start space-x-2">
                <User className="h-6 w-6 text-accent"/>
                <h3 className="text-2xl font-semibold">{matchDetails.player2Name}</h3>
              </div>
              <p className="text-4xl font-bold text-primary">{matchDetails.player2Score}</p>
              {matchDetails.status === 'confirmed' && matchDetails.winnerId === matchDetails.player2Id && (
                <div className="flex items-center justify-center md:justify-start text-green-400">
                  <Star className="h-5 w-5 mr-1 fill-current"/> Victorious
                </div>
              )}
            </div>
          </div>

          {/* Match Status */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Status</p>
            <p className="text-lg font-semibold">
              {matchDetails.status === 'pending_player2' && 'Awaiting Opponent Confirmation'}
              {matchDetails.status === 'confirmed' && 'Match Confirmed'}
              {matchDetails.status === 'rejected_by_player2' && 'Scores Rejected by Opponent'}
            </p>
          </div>
          
          {/* Confirmation Actions */}
          {canConfirm && (
            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4 border-t border-border">
              <Button onClick={() => handleMatchConfirmation(true)} disabled={isActionLoading} className="bg-green-500 hover:bg-green-600 text-white">
                {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <CheckCircle className="mr-2 h-5 w-5" /> Confirm Scores
              </Button>
              <Button variant="destructive" onClick={() => handleMatchConfirmation(false)} disabled={isActionLoading}>
                {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <XCircle className="mr-2 h-5 w-5" /> Reject Scores
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dramatic Recap Section */}
      {matchDetails.status === 'confirmed' && matchDetails.recap && (
        <Card className="bg-card/70 backdrop-blur-md shadow-xl glow-accent">
          <CardHeader>
            <div className="flex items-center space-x-2 mb-1">
                <MessageSquareText className="h-8 w-8 text-accent text-glow-accent" />
                <CardTitle className="text-3xl">The Legendary Recap</CardTitle>
            </div>
            <CardDescription>Relive the epic moments, as told by a dramatic NBA commentator!</CardDescription>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none prose-p:text-foreground/90 prose-headings:text-primary text-lg leading-relaxed p-6 whitespace-pre-line">
            {/* Using a div with whitespace-pre-line to respect newlines from AI */}
            <div>{matchDetails.recap}</div>
          </CardContent>
        </Card>
      )}
      {matchDetails.status === 'confirmed' && !matchDetails.recap && (
         <Card className="bg-card/70 backdrop-blur-md">
            <CardContent className="pt-6 text-center text-muted-foreground">
                Recap is being generated by our cosmic commentators... Check back soon!
            </CardContent>
         </Card>
      )}
    </div>
  );
}
