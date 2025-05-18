"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { BottomNav } from "@/components/layout/bottom-nav";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Loader2 } from "lucide-react";
import { Logo } from "@/components/common/logo";

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
        <Logo size="large" className="mb-4"/>
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg">Loading Cosmic Hoops...</p>
      </div>
    );
  }

  if (!user) {
    // This case should ideally be handled by the redirect,
    // but it's a fallback during the brief moment before redirect happens.
    return null; 
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background text-foreground">
      <SidebarNav />
      <main className="flex-1 md:ml-64 pb-16 md:pb-0">
        {/* Optional: Add a header here for desktop view if needed */}
        <div className="p-4 md:p-8">
         {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
