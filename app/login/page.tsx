"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CircleCheck, Fingerprint, KeyRound, Mail } from "lucide-react";
import { AuthSplit } from "@/components/auth/auth-shell";
import { Alert, FieldLabel, LanguageMenu, PasswordInput, inputClass, outlineButton, primaryButton } from "@/components/auth/fields";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";

type Mode = "password" | "magic";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("password");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [linkSent, setLinkSent] = useState(false);

  function switchMode(next: Mode) {
    setMode(next);
    setLinkSent(false);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (mode === "magic") setLinkSent(true);
    else router.push("/home");
  }

  function passkey() {
    if (typeof window === "undefined" || !window.PublicKeyCredential) {
      setError("WebAuthn is not supported in this browser");
      return;
    }
    setError(null);
    router.push("/home");
  }

  return (
    <AuthSplit kicker="While you were away">
      <div className="mb-1 flex justify-end">
        <LanguageMenu />
      </div>
      <h1 className="text-3xl font-semibold leading-tight tracking-tight text-foreground">Welcome back.</h1>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{BRAND.fullName} kept working while you were away.</p>

      <div className="mt-6 space-y-4">
        <div role="tablist" aria-label="Sign-in method" className="grid grid-cols-2 gap-1 rounded-lg bg-foreground/5 p-1">
          {(
            [
              ["password", KeyRound, "Password"],
              ["magic", Mail, "Magic link"],
            ] as const
          ).map(([key, Icon, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={mode === key}
              onClick={() => switchMode(key)}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                mode === key ? "bg-body text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
        </div>

        {error && <Alert>{error}</Alert>}

        <form id="login-form" className="space-y-4" onSubmit={submit}>
          <div className="space-y-2">
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </div>

          {mode === "password" ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Link href="/forgot-password" className="text-xs text-primary underline-offset-4 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <PasswordInput id="password" name="password" autoComplete="current-password" required />
            </div>
          ) : linkSent ? (
            <Alert tone="info">
              <span className="flex gap-2 text-xs leading-relaxed">
                <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                <span>
                  Check your inbox — we sent a one-time sign-in link to <b className="font-medium text-foreground">{email}</b>.
                </span>
              </span>
            </Alert>
          ) : (
            <Alert tone="info">
              <span className="flex gap-2 text-xs leading-relaxed">
                <CircleCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                No password needed — we&rsquo;ll email you a secure one-time link to sign in.
              </span>
            </Alert>
          )}
        </form>

        <div className="flex flex-col gap-3 pt-1">
          <button type="submit" form="login-form" className={primaryButton}>
            {mode === "password" ? (
              "Sign In"
            ) : (
              <>
                <Mail /> {linkSent ? "Send it again" : "Email me a magic link"}
              </>
            )}
          </button>
          <button type="button" onClick={passkey} className={outlineButton}>
            <Fingerprint /> Sign in with fingerprint / face
          </button>
        </div>

        <p className="pt-2 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-primary underline-offset-4 hover:underline">
            Register
          </Link>
        </p>
      </div>
    </AuthSplit>
  );
}
