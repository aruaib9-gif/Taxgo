"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Alert, FieldLabel, PasswordInput, inputClass, primaryButton } from "@/components/auth/fields";

export function InviteForm({ token }: { token: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const password = String(data.get("password") ?? "");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== data.get("confirmPassword")) return setError("Passwords don't match.");
    setError(null);
    router.push("/home");
  }

  return (
    <form className="mt-6 space-y-4" onSubmit={submit}>
      <input type="hidden" name="token" value={token} />
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <FieldLabel htmlFor="firstName">First Name</FieldLabel>
          <input id="firstName" name="firstName" autoComplete="given-name" required className={inputClass} />
        </div>
        <div className="space-y-2">
          <FieldLabel htmlFor="lastName">Last Name</FieldLabel>
          <input id="lastName" name="lastName" autoComplete="family-name" className={inputClass} />
        </div>
      </div>
      <div className="space-y-2">
        <FieldLabel htmlFor="password">Password</FieldLabel>
        <PasswordInput id="password" name="password" autoComplete="new-password" required />
      </div>
      <div className="space-y-2">
        <FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>
        <PasswordInput id="confirmPassword" name="confirmPassword" autoComplete="new-password" required />
      </div>
      {error && <Alert>{error}</Alert>}
      <button type="submit" className={primaryButton}>
        Join your team
      </button>
      <Link href="/login" className="flex items-center justify-center gap-1.5 text-sm text-primary underline-offset-4 hover:underline">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
      </Link>
    </form>
  );
}
