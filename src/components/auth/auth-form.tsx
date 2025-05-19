
"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, collection, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const DEFAULT_AVATAR_URL = "https://i.imgur.com/nkcoOPE.jpeg";

export function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "login";
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (mode === "signup") {
        if (!displayName.trim()) {
          setError("Username is required.");
          setIsLoading(false);
          return;
        }

        // Check if display name is unique
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("displayName", "==", displayName.trim()));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          setError("Username already taken. Please choose another.");
          setIsLoading(false);
          toast({
            title: "Signup Error",
            description: "Username already taken.",
            variant: "destructive",
          });
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { 
          displayName: displayName.trim(),
          photoURL: DEFAULT_AVATAR_URL 
        });
        
        // Create user document in Firestore
        await setDoc(doc(db, "users", userCredential.user.uid), {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: displayName.trim(),
          aura: 0,
          createdAt: serverTimestamp(),
          friends: [],
          description: "",
          bannerUrl: "",
          avatarUrl: DEFAULT_AVATAR_URL,
          isCertifiedHooper: false, // Initialize badge field
          isCosmicMarshall: false,  // Initialize badge field
        });

        await sendEmailVerification(userCredential.user);
        toast({
          title: "Account Created!",
          description: "Please check your email to verify your account.",
        });
        router.push("/dashboard"); 
      } else { // Login mode
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        if (!userCredential.user.emailVerified) {
          toast({
            title: "Email not verified",
            description: "Please verify your email before logging in. A new verification email has been sent.",
            variant: "destructive",
          });
          await sendEmailVerification(userCredential.user);
          setIsLoading(false);
          return;
        }
        toast({ title: "Logged In Successfully!"});
        router.push("/dashboard");
      }
    } catch (err: any) {
      // Handle Firebase specific errors more gracefully
      let errorMessage = "An unknown error occurred.";
      if (err.code) {
        switch (err.code) {
          case "auth/email-already-in-use":
            errorMessage = "This email address is already in use by another account.";
            break;
          case "auth/invalid-email":
            errorMessage = "The email address is not valid.";
            break;
          case "auth/operation-not-allowed":
            errorMessage = "Email/password accounts are not enabled.";
            break;
          case "auth/weak-password":
            errorMessage = "The password is too weak.";
            break;
          case "auth/user-not-found":
          case "auth/wrong-password":
          case "auth/invalid-credential": // For newer Firebase versions
            errorMessage = "Invalid login credentials. Please check your email and password.";
            break;
          default:
            errorMessage = err.message || "Failed to authenticate.";
        }
      } else {
        errorMessage = err.message || "Failed to authenticate.";
      }
      setError(errorMessage);
      toast({
        title: "Authentication Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md bg-card/70 backdrop-blur-md">
      <CardHeader>
        <CardTitle className="text-3xl text-glow-primary">
          {mode === "login" ? "Welcome Back, Star Voyager!" : "Join the Cosmic Court!"}
        </CardTitle>
        <CardDescription>
          {mode === "login" ? "Enter your credentials to access your celestial stats." : "Create an account to start your intergalactic hoops journey."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="displayName">Username</Label>
              <Input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="CosmicBaller123"
                required
                className="bg-background/50"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="player@example.com"
              required
              className="bg-background/50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="bg-background/50"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full glow-accent" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "login" ? "Login" : "Sign Up"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button
          variant="link"
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setError(null);
          }}
          className="text-accent hover:text-primary"
        >
          {mode === "login" ? "Need an account? Sign Up" : "Already have an account? Login"}
        </Button>
      </CardFooter>
    </Card>
  );
}
