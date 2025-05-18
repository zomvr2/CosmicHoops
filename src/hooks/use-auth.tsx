
"use client";

import type { User } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { auth } from "@/lib/firebase";

// Interface for the context value
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  isLoggedIn: boolean;
}

// Define a default value for the context that matches AuthContextType
const defaultAuthContextValue: AuthContextType = {
  user: null,
  loading: true,
  isLoggedIn: false,
};

// Create the context with the default value.
const AuthContext = createContext<AuthContextType>(defaultAuthContextValue);

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
  }, []); // Empty dependency array ensures this runs once on mount

  // Define the value for the provider
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
  // The context should always be available if useAuth is used within AuthProvider
  // The default value in createContext ensures context is never undefined.
  return context;
}
