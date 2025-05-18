
"use client";

import type { User } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { auth } from "@/lib/firebase";

// Interface for the context value
interface AuthContextType {
  user: User | null;
  loading: boolean;
  isLoggedIn: boolean;
}

// Create the context with an initial undefined value
// It's important that the default value matches the AuthContextType or is undefined
// and handled appropriately in the hook.
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []); // Empty dependency array means this runs once on mount and cleans up on unmount

  // Explicitly define the value for the provider
  const providerValue: AuthContextType = {
    user,
    loading,
    isLoggedIn: !!user,
  };

  return (
    <AuthContext.Provider value={providerValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // This error is thrown if useAuth is used outside of an AuthProvider
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
