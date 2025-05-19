
"use client";

import { AuthForm } from "@/components/auth/auth-form";
import { Logo } from "@/components/common/logo";
import { Suspense, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

function AuthPageContent() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  if (loading || (!loading && user)) {
    // Show loading indicator while checking auth state or during redirect
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Logo className="mb-8" size="large" />
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg">Loading...</p>
      </div>
    );
  }

  // If not loading and no user, show the auth form
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Logo className="mb-8" size="large" />
      <AuthForm />
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Logo className="mb-8" size="large" />
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg">Loading...</p>
      </div>
    }>
      <AuthPageContent />
    </Suspense>
  );
}
