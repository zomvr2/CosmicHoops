
"use client";
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db, auth } from '@/lib/firebase'; // Assuming generateDramaticRecap is a server action
import { generateDramaticRecap } from '@/ai/flows/generate-dramatic-recap';
import { collection, query, where, orderBy, getDocs, doc, updateDoc, writeBatch, serverTimestamp, getDoc, addDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Bell, Loader2, CheckCircle, XCircle, MessageSquareText, Users, Swords, CheckCheck } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { cn } from "@/lib/utils";


interface Notification {
  id: string;
  type: 'match_invite' | 'match_confirmed' | 'friend_request' | 'friend_accepted' | 'recap_ready';
  message: string;
  relatedId: string; // e.g., matchId or userId
  isRead: boolean;
  createdAt: any; // Firestore Timestamp
  senderName?: string;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState<Record<string, boolean>>({});


  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      setIsLoading(true);
      try {
        const q = query(
          collection(db, 'notifications'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const fetchedNotifications = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Notification[];
        setNotifications(fetchedNotifications);
      } catch (error) {
        console.error("Error fetching notifications:", error);
        toast({ title: "Error", description: "Could not load notifications.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, [user, toast]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, { isRead: true });
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast({ title: "Error", description: "Failed to update notification.", variant: "destructive" });
    }
  };
  
  const handleMatchConfirmation = async (notification: Notification, confirmed: boolean) => {
    if (!user) return;
    setIsActionLoading(prev => ({ ...prev, [notification.id]: true }));
    const matchId = notification.relatedId;

    try {
      const batch = writeBatch(db);
      const matchRef = doc(db, 'matches', matchId);
      const matchSnap = await getDoc(matchRef);

      if (!matchSnap.exists()) {
        toast({ title: "Error", description: "Match not found.", variant: "destructive" });
        setIsActionLoading(prev => ({ ...prev, [notification.id]: false }));
        return;
      }
      const matchData = matchSnap.data();

      if (confirmed) {
        const winnerId = matchData.player1Score > matchData.player2Score ? matchData.player1Id : matchData.player2Id;
        const loserId = matchData.player1Score < matchData.player2Score ? matchData.player1Id : matchData.player2Id;
        const auraGain = 10; 
        const auraLoss = -5;

        // Update match status and winner
        batch.update(matchRef, {
          status: 'confirmed',
          winnerId: winnerId,
          confirmedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        // Update winner's Aura
        const winnerRef = doc(db, 'users', winnerId);
        const winnerUserSnap = await getDoc(winnerRef); 
        if (winnerUserSnap.exists()) {
           batch.update(winnerRef, { aura: (winnerUserSnap.data().aura || 0) + auraGain });
        }
        
        // Update loser's Aura
        if (winnerId !== loserId) { 
            const loserRef = doc(db, 'users', loserId);
            const loserUserSnap = await getDoc(loserRef); 
            if (loserUserSnap.exists()) {
                batch.update(loserRef, { aura: (loserUserSnap.data().aura || 0) + auraLoss });
            }
        }
        
        // Generate recap (this calls the AI flow)
        const recapInput = {
          player1Name: matchData.player1Name || "Player 1",
          player2Name: matchData.player2Name || "Player 2",
          player1Score: matchData.player1Score,
          player2Score: matchData.player2Score,
        };
        const recapOutput = await generateDramaticRecap(recapInput);
        batch.update(matchRef, { recap: recapOutput.recap });


        // Notify player 1 (original logger) that match is confirmed and recap is ready
         const p1Notification = {
            userId: matchData.player1Id,
            type: 'recap_ready' as 'recap_ready',
            message: `Your match against ${matchData.player2Name || 'Opponent'} is confirmed! Check out the epic recap.`,
            relatedId: matchId,
            isRead: false,
            createdAt: serverTimestamp(),
            senderId: user.uid, // This user (player 2) confirmed
            senderName: user.displayName
        };
        batch.set(doc(collection(db, 'notifications')), p1Notification);


      } else { // Rejected
        batch.update(matchRef, {
          status: 'rejected_by_player2',
          updatedAt: serverTimestamp()
        });
         // Notify player 1 that match is rejected
         const p1Notification = {
            userId: matchData.player1Id,
            type: 'match_invite' as 'match_invite', // Using 'match_invite' type but message shows rejection
            message: `rejected the scores for your match. Please discuss and re-log.`,
            relatedId: matchId,
            isRead: false,
            createdAt: serverTimestamp(),
            senderId: user.uid,
            senderName: user.displayName
        };
        batch.set(doc(collection(db, 'notifications')), p1Notification);
      }

      // Mark current notification as handled (or delete, depending on UX)
      batch.update(doc(db, 'notifications', notification.id), { isRead: true, message: `Match ${confirmed ? 'confirmed' : 'rejected'}. ${confirmed ? 'Aura updated and recap generated.' : ''}` });
      
      await batch.commit();

      toast({ title: "Match Update", description: `Match ${confirmed ? 'confirmed' : 'rejected'} successfully.` });
      // Refresh notifications list by removing the handled one (or filtering based on its new state if updated)
      setNotifications(prev => prev.filter(n => n.id !== notification.id));


    } catch (error: any) {
      console.error("Error confirming match:", error);
      toast({ title: "Error", description: error.message || "Failed to update match status.", variant: "destructive" });
    } finally {
      setIsActionLoading(prev => ({ ...prev, [notification.id]: false }));
    }
  };


  const getIconForNotification = (type: Notification['type']) => {
    switch(type) {
      case 'match_invite': return <Swords className="h-5 w-5 text-yellow-500" />;
      case 'match_confirmed': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'recap_ready': return <MessageSquareText className="h-5 w-5 text-blue-400" />;
      case 'friend_request': return <Users className="h-5 w-5 text-purple-400" />; // Changed icon for friend_request
      case 'friend_accepted': return <CheckCircle className="h-5 w-5 text-pink-400" />; // Changed icon for friend_accepted
      default: return <Bell className="h-5 w-5 text-gray-400" />;
    }
  }


  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <Card className="bg-card/70 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-3xl flex items-center"><Bell className="mr-3 h-8 w-8 text-primary text-glow-primary" />Cosmic Alerts</CardTitle>
          <CardDescription>Updates from across the basketball galaxy.</CardDescription>
        </CardHeader>
      </Card>

      {notifications.length === 0 ? (
        <Card className="bg-card/50">
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center py-8">No new notifications. Your comms are clear, captain!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notifications.map(notif => (
            <Card key={notif.id} className={cn("bg-card/50 transition-all duration-300", !notif.isRead && "border-primary")}>
              <CardContent className="pt-6 flex items-start space-x-4">
                <div className="flex-shrink-0 mt-1">
                  {getIconForNotification(notif.type)}
                </div>
                <div className="flex-grow">
                  <p className={cn("font-medium", !notif.isRead && "text-primary")}>
                    {notif.senderName ? `${notif.senderName} ` : ''}{notif.message}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {notif.createdAt?.toDate ? formatDistanceToNow(notif.createdAt.toDate(), { addSuffix: true }) : 'Recently'}
                  </p>
                  
                  {notif.type === 'match_invite' && !notif.isRead && ( // Only show actions if not read/handled
                    <div className="mt-3 space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-green-400 border-green-400 hover:bg-green-400/10"
                        onClick={() => handleMatchConfirmation(notif, true)}
                        disabled={isActionLoading[notif.id]}
                      >
                        {isActionLoading[notif.id] && <Loader2 className="mr-1 h-3 w-3 animate-spin"/>}
                        <CheckCircle className="mr-1 h-4 w-4" /> Confirm Score
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-red-400 border-red-400 hover:bg-red-400/10"
                        onClick={() => handleMatchConfirmation(notif, false)}
                        disabled={isActionLoading[notif.id]}
                      >
                        {isActionLoading[notif.id] && <Loader2 className="mr-1 h-3 w-3 animate-spin"/>}
                        <XCircle className="mr-1 h-4 w-4" /> Reject Score
                      </Button>
                    </div>
                  )}

                  {(notif.type === 'recap_ready' || notif.type === 'match_confirmed') && (
                     <Button variant="link" size="sm" asChild className="p-0 h-auto text-accent mt-1">
                       <Link href={`/match/${notif.relatedId}`}>View Match</Link>
                     </Button>
                  )}
                  {notif.type === 'friend_request' && (
                     <Button variant="link" size="sm" asChild className="p-0 h-auto text-accent mt-1">
                       <Link href={`/friends?tab=requests`}>View Request</Link>
                     </Button>
                  )}
                   {notif.type === 'friend_accepted' && (
                     <Button variant="link" size="sm" asChild className="p-0 h-auto text-accent mt-1">
                       <Link href={`/profile/${notif.relatedId}`}>View Profile</Link>
                     </Button>
                  )}

                </div>
                {!notif.isRead && notif.type !== 'match_invite' && ( // Don't show mark as read for match_invite as it has specific actions
                  <Button variant="ghost" size="icon" onClick={() => handleMarkAsRead(notif.id)} className="h-8 w-8" aria-label="Mark as read">
                    <CheckCheck className="h-4 w-4 text-muted-foreground hover:text-foreground" title="Mark as read"/>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
