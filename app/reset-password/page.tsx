"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";

const field = "h-11 w-full rounded-full border border-input bg-background px-4 pr-11 text-sm outline-none focus:ring-2 focus:ring-ring";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pwd.length < 8) return setError("Password must be at least 8 characters.");
    if (pwd !== confirm) return setError("Passwords don't match.");
    setError(null);
    setDone(true);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-(--body) px-6">
      <div className="absolute top-8">
        <BrandMark href="/" />
      </div>
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-sm">
        {done ? (
          <div className="text-center">
            <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-ai-done/15 text-ai-done">
              <CheckCircle2 className="h-6 w-6" />
            </span>
            <h1 className="text-xl font-bold tracking-tight">Password updated</h1>
            <p className="mt-2 text-sm text-muted-foreground">You can now sign in with your new password.</p>
            <button onClick={() => router.push("/login")} className="mt-6 h-11 w-full rounded-full bg-primary font-semibold text-primary-foreground hover:opacity-90">
              Go to sign in
            </button>
          </div>
        ) : (
          <>
            <div className="text-center">
              <h1 className="text-xl font-bold tracking-tight">Set a new password</h1>
              <p className="mt-2 text-sm text-muted-foreground">Choose a strong password you don&apos;t use elsewhere.</p>
            </div>
            <form className="mt-6 space-y-4" onSubmit={submit}>
              <div>
                <label className="mb-1.5 block text-sm font-medium">New password</label>
                <div className="relative">
                  <input type={show ? "text" : "password"} className={field} placeholder="••••••••" value={pwd} onChange={(e) => setPwd(e.target.value)} />
                  <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground" aria-label="Toggle password">
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Confirm password</label>
                <input type={show ? "text" : "password"} className={field} placeholder="••••••••" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
              </div>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <button className="h-11 w-full rounded-full bg-primary font-semibold text-primary-foreground hover:opacity-90">
                Update password
              </button>
            </form>
            <Link href="/login" className="mt-5 flex items-center justify-center text-sm font-medium text-primary">
              Back to sign in
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
