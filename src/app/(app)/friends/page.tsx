
"use client";
import { useState, useEffect, type FormEvent } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion, arrayRemove, addDoc, serverTimestamp, getDoc, writeBatch, DocumentData } from 'firebase/firestore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Users, CheckCircle, XCircle, Loader2, Search, Send } from 'lucide-react';
import Link from 'next/link';

const DEFAULT_AVATAR_URL = "https://i.imgur.com/nkcoOPE.jpeg";

interface UserProfile {
  uid: string;
  displayName: string;
  email?: string;
  avatarUrl?: string;
}

interface FriendRequest {
  id: string;
  fromUserId: string;
  fromUserName: string; // denormalized for display
  status: 'pending' | 'accepted' | 'declined';
  toUserId: string; // Added for checking sent requests status
}

export default function FriendsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]); // Track sent requests status
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState({
    friends: true,
    requests: true,
    search: false,
    action: false, // For accept/decline/send actions
  });

  // Fetch friends
  useEffect(() => {
    if (!user) return;
    const fetchFriends = async () => {
      setIsLoading(prev => ({ ...prev, friends: true }));
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const friendUIDs = userDocSnap.data().friends || [];
          if (friendUIDs.length > 0) {
            const q = query(collection(db, 'users'), where('uid', 'in', friendUIDs));
            const querySnapshot = await getDocs(q);
            setFriends(querySnapshot.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile)));
          } else {
            setFriends([]);
          }
        }
      } catch (error) {
        console.error("Error fetching friends:", error);
        toast({ title: "Error", description: "Failed to load friends.", variant: "destructive" });
      }
      setIsLoading(prev => ({ ...prev, friends: false }));
    };
    fetchFriends();
  }, [user, toast]);

  // Fetch friend requests (incoming and sent)
  useEffect(() => {
    if (!user) return;
    const fetchRequests = async () => {
      setIsLoading(prev => ({ ...prev, requests: true }));
      try {
        // Incoming requests
        const qIncoming = query(collection(db, 'friendRequests'), where('toUserId', '==', user.uid), where('status', '==', 'pending'));
        const incomingSnapshot = await getDocs(qIncoming);
        const incomingReqs = await Promise.all(incomingSnapshot.docs.map(async (d) => {
          const reqData = d.data();
          const senderDoc = await getDoc(doc(db, 'users', reqData.fromUserId));
          return { 
            id: d.id, 
            ...reqData, 
            fromUserName: senderDoc.exists() ? senderDoc.data().displayName : 'Unknown User' 
          } as FriendRequest;
        }));
        setFriendRequests(incomingReqs);

        // Sent requests (to see their status)
        const qSent = query(collection(db, 'friendRequests'), where('fromUserId', '==', user.uid));
        const sentSnapshot = await getDocs(qSent);
        setSentRequests(sentSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as FriendRequest)));

      } catch (error) {
        console.error("Error fetching friend requests:", error);
        toast({ title: "Error", description: "Failed to load friend requests.", variant: "destructive" });
      }
      setIsLoading(prev => ({ ...prev, requests: false }));
    };
    fetchRequests();
  }, [user, toast]);

  const handleSearchUser = async (e: FormEvent) => {
    e.preventDefault();
    if (!searchEmail.trim() || !user) return;
    setIsLoading(prev => ({ ...prev, search: true }));
    setSearchResults([]);
    try {
      const q = query(collection(db, 'users'), where('email', '==', searchEmail.trim()));
      const querySnapshot = await getDocs(q);
      const results: UserProfile[] = [];
      querySnapshot.forEach((doc) => {
        if (doc.id !== user.uid) { // Don't show self
          results.push({ uid: doc.id, ...doc.data() } as UserProfile);
        }
      });
      setSearchResults(results);
      if (results.length === 0) {
        toast({ title: "Not Found", description: "No user found with that email." });
      }
    } catch (error) {
      console.error("Error searching user:", error);
      toast({ title: "Error", description: "Failed to search user.", variant: "destructive" });
    }
    setIsLoading(prev => ({ ...prev, search: false }));
  };

  const handleSendFriendRequest = async (targetUserId: string) => {
    if (!user) return;
    setIsLoading(prev => ({ ...prev, action: true }));
    try {
      // Check if a request already exists (either way or already friends)
      const existingRequestQuery1 = query(collection(db, 'friendRequests'), where('fromUserId', '==', user.uid), where('toUserId', '==', targetUserId));
      const existingRequestQuery2 = query(collection(db, 'friendRequests'), where('fromUserId', '==', targetUserId), where('toUserId', '==', user.uid));
      
      const [snap1, snap2] = await Promise.all([getDocs(existingRequestQuery1), getDocs(existingRequestQuery2)]);

      if (!snap1.empty || !snap2.empty) {
         toast({ title: "Request Exists", description: "A friend request already exists or is pending with this user.", variant: "default" });
         setIsLoading(prev => ({ ...prev, action: false }));
         return;
      }
      // Check if already friends
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists() && userDoc.data().friends?.includes(targetUserId)) {
        toast({ title: "Already Friends", description: "You are already friends with this user.", variant: "default" });
        setIsLoading(prev => ({ ...prev, action: false }));
        return;
      }

      const newRequestRef = await addDoc(collection(db, 'friendRequests'), {
        fromUserId: user.uid,
        toUserId: targetUserId,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      // Add to sent requests locally for immediate feedback
      const targetUser = searchResults.find(u => u.uid === targetUserId) || friends.find(u => u.uid === targetUserId);
      setSentRequests(prev => [...prev, { id: newRequestRef.id, fromUserId: user.uid!, fromUserName: user.displayName || '', status: 'pending', toUserId: targetUserId }]);


      // Notification for the recipient
      await addDoc(collection(db, 'notifications'), {
        userId: targetUserId,
        type: 'friend_request',
        message: `${user.displayName || 'Someone'} sent you a friend request.`,
        relatedId: user.uid, // UID of the sender
        isRead: false,
        createdAt: serverTimestamp(),
        senderId: user.uid,
        senderName: user.displayName
      });

      toast({ title: "Success", description: "Friend request sent!" });
      setSearchResults(prev => prev.filter(u => u.uid !== targetUserId)); // Optionally remove from search results
    } catch (error) {
      console.error("Error sending friend request:", error);
      toast({ title: "Error", description: "Failed to send friend request.", variant: "destructive" });
    }
    setIsLoading(prev => ({ ...prev, action: false }));
  };

  const handleFriendRequestResponse = async (requestId: string, newStatus: 'accepted' | 'declined', fromUserId?: string) => {
    if (!user) return;
    setIsLoading(prev => ({ ...prev, action: true }));
    try {
      const batch = writeBatch(db);
      const requestRef = doc(db, 'friendRequests', requestId);
      batch.update(requestRef, { status: newStatus });

      let notificationMessage = '';
      let notificationType: 'friend_accepted' | 'friend_declined' = 'friend_accepted';


      if (newStatus === 'accepted' && fromUserId) {
        const currentUserRef = doc(db, 'users', user.uid);
        const friendUserRef = doc(db, 'users', fromUserId);
        batch.update(currentUserRef, { friends: arrayUnion(fromUserId) });
        batch.update(friendUserRef, { friends: arrayUnion(user.uid) });
        notificationMessage = `${user.displayName || 'Someone'} accepted your friend request!`;
        notificationType = 'friend_accepted';
      } else if (newStatus === 'declined' && fromUserId) {
         notificationMessage = `${user.displayName || 'Someone'} declined your friend request.`;
         // notificationType = 'friend_declined'; // if you want to notify declines
      }


      await batch.commit();
      
      // Send notification if accepted (or declined if implemented)
      if (newStatus === 'accepted' && fromUserId && notificationMessage) {
         await addDoc(collection(db, 'notifications'), {
           userId: fromUserId, // Notify the original sender
           type: notificationType,
           message: notificationMessage,
           relatedId: user.uid, 
           isRead: false,
           createdAt: serverTimestamp(),
           senderId: user.uid,
           senderName: user.displayName
         });
      }

      setFriendRequests(prev => prev.filter(req => req.id !== requestId));
      if (newStatus === 'accepted' && fromUserId) {
        const newFriendProfileDoc = await getDoc(doc(db, 'users', fromUserId));
        if (newFriendProfileDoc.exists()) {
           const newFriendData = newFriendProfileDoc.data() as UserProfile;
           setFriends(prev => [...prev, { uid: newFriendProfileDoc.id, ...newFriendData }]);
        }
      }
      toast({ title: "Success", description: `Friend request ${newStatus}.` });
    } catch (error) {
      console.error("Error responding to friend request:", error);
      toast({ title: "Error", description: "Failed to respond to friend request.", variant: "destructive" });
    }
     setIsLoading(prev => ({ ...prev, action: false }));
  };

  const getRequestStatusForUser = (targetUserId: string) => {
    if (friends.some(f => f.uid === targetUserId)) return "Already Friends";
    const sentReq = sentRequests.find(req => req.toUserId === targetUserId && req.status === 'pending');
    if (sentReq) return "Request Sent";
    const receivedReq = friendRequests.find(req => req.fromUserId === targetUserId && req.status === 'pending');
    if (receivedReq) return "Request Received";
    return null;
  }

  if (!user) return null;

  return (
    <div className="space-y-6">
      <Card className="bg-card/70 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-3xl flex items-center"><Users className="mr-3 h-8 w-8 text-primary text-glow-primary" />Cosmic Connections</CardTitle>
          <CardDescription>Manage your allies and rivals across the galaxy.</CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="my-friends" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-muted/50">
          <TabsTrigger value="my-friends">My Friends</TabsTrigger>
          <TabsTrigger value="requests">Friend Requests ({friendRequests.length})</TabsTrigger>
          <TabsTrigger value="add-friend">Add Friend</TabsTrigger>
        </TabsList>

        <TabsContent value="my-friends" className="mt-4">
          <Card className="bg-card/50">
            <CardHeader><CardTitle>Your Squad</CardTitle></CardHeader>
            <CardContent>
              {isLoading.friends ? <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /> : friends.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No friends yet. Go make some cosmic connections!</p>
              ) : (
                <ul className="space-y-3">
                  {friends.map(friend => (
                    <li key={friend.uid} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={friend.avatarUrl || DEFAULT_AVATAR_URL} alt={friend.displayName} />
                          <AvatarFallback>{friend.displayName?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{friend.displayName}</span>
                      </div>
                       <Button variant="ghost" size="sm" asChild className="text-accent hover:text-primary">
                         <Link href={`/profile/${friend.uid}`}>View Profile</Link>
                       </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="mt-4">
          <Card className="bg-card/50">
            <CardHeader><CardTitle>Pending Invites</CardTitle></CardHeader>
            <CardContent>
              {isLoading.requests ? <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /> : friendRequests.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No pending friend requests.</p>
              ) : (
                <ul className="space-y-3">
                  {friendRequests.map(req => (
                    <li key={req.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center space-x-3">
                         <Avatar>
                           {/* Assuming the sender (fromUserId) might not have an avatarUrl in req directly */}
                           {/* You might need to fetch sender's profile for avatar here if needed, or use fallback */}
                           <AvatarFallback>{req.fromUserName?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                         </Avatar>
                        <span className="font-medium">{req.fromUserName} wants to connect!</span>
                      </div>
                      <div className="space-x-2">
                        <Button size="sm" variant="ghost" className="text-green-400 hover:bg-green-400/10" onClick={() => handleFriendRequestResponse(req.id, 'accepted', req.fromUserId)} disabled={isLoading.action}>
                          <CheckCircle className="mr-1 h-4 w-4"/> Accept
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-400 hover:bg-red-400/10" onClick={() => handleFriendRequestResponse(req.id, 'declined', req.fromUserId)} disabled={isLoading.action}>
                          <XCircle className="mr-1 h-4 w-4"/> Decline
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="add-friend" className="mt-4">
          <Card className="bg-card/50">
            <CardHeader><CardTitle>Find New Hoopers</CardTitle><CardDescription>Search for users by their email address.</CardDescription></CardHeader>
            <CardContent>
              <form onSubmit={handleSearchUser} className="flex space-x-2 mb-6">
                <Input
                  type="email"
                  placeholder="Enter user's email"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  className="bg-background/50"
                />
                <Button type="submit" disabled={isLoading.search || !searchEmail.trim()} className="glow-accent">
                  {isLoading.search ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </form>
              {isLoading.search && <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />}
              {searchResults.length > 0 && (
                <ul className="space-y-3">
                  {searchResults.map(foundUser => {
                    const requestStatus = getRequestStatusForUser(foundUser.uid);
                    return (
                      <li key={foundUser.uid} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center space-x-3">
                           <Avatar>
                             <AvatarImage src={foundUser.avatarUrl || DEFAULT_AVATAR_URL} alt={foundUser.displayName} />
                             <AvatarFallback>{foundUser.displayName?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                           </Avatar>
                          <span className="font-medium">{foundUser.displayName}</span>
                        </div>
                        {requestStatus ? (
                          <span className="text-sm text-muted-foreground">{requestStatus}</span>
                        ) : (
                          <Button size="sm" onClick={() => handleSendFriendRequest(foundUser.uid)} disabled={isLoading.action} className="text-sm">
                            <UserPlus className="mr-1 h-4 w-4" /> Send Request
                          </Button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
