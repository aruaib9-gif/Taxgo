"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, MailCheck } from "lucide-react";
import { AuthCentered } from "@/components/auth/auth-shell";
import { FieldLabel, inputClass, primaryButton } from "@/components/auth/fields";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");

  const back = (
    <Link href="/login" className="flex items-center justify-center gap-1.5 text-sm text-primary underline-offset-4 hover:underline">
      <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
    </Link>
  );

  return (
    <AuthCentered>
      {sent ? (
        <div className="text-center">
          <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MailCheck className="h-6 w-6" />
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Check your email</h1>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            If an account exists for <span className="font-medium text-foreground">{email || "that address"}</span>, we&apos;ve
            sent a reset link. It expires in 30 minutes.
          </p>
          <div className="mt-5">{back}</div>
        </div>
      ) : (
        <>
          <div className="text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Forgot your password?</h1>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">Enter your email and we&apos;ll send you a reset link.</p>
          </div>
          <form
            className="mt-6 space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              setSent(true);
            }}
          >
            <div className="space-y-2">
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                className={inputClass}
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <button type="submit" className={primaryButton}>
              Send reset link
            </button>
          </form>
          <div className="mt-4">{back}</div>
        </>
      )}
    </AuthCentered>
  );
}
