import { AuthForm } from "@/components/auth/auth-form";
import { Logo } from "@/components/common/logo";
import { Suspense } from "react";

function AuthPageContent() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Logo className="mb-8" size="large" />
      <AuthForm />
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthPageContent />
    </Suspense>
  );
}
