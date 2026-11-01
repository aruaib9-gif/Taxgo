"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { AuthSplit } from "@/components/auth/auth-shell";
import { Alert, FieldLabel, PasswordInput, PhoneInput, SectionLabel, inputClass, primaryButton } from "@/components/auth/fields";
import { BRAND } from "@/lib/brand";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const password = String(data.get("password") ?? "");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== data.get("confirmPassword")) return setError("Passwords don't match.");
    setError(null);
    router.push("/onboarding");
  }

  return (
    <AuthSplit kicker="Her first day">
      <h1 className="text-3xl font-semibold leading-tight tracking-tight text-foreground">Hire {BRAND.fullName}.</h1>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">She needs 30 seconds, then she gets to work.</p>

      <form className="mt-6 space-y-5" onSubmit={submit}>
        <div className="space-y-2.5">
          <SectionLabel>You</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel htmlFor="firstName" strong>
                First Name
              </FieldLabel>
              <input id="firstName" name="firstName" autoComplete="given-name" required className={inputClass} />
            </div>
            <div>
              <FieldLabel htmlFor="lastName" strong>
                Last Name
              </FieldLabel>
              <input id="lastName" name="lastName" autoComplete="family-name" className={inputClass} />
            </div>
          </div>
        </div>

        <div className="space-y-2.5">
          <SectionLabel>Reach you at</SectionLabel>
          <div>
            <FieldLabel htmlFor="email" strong>
              Email
            </FieldLabel>
            <input id="email" name="email" type="email" autoComplete="email" placeholder="you@company.com" required className={inputClass} />
          </div>
          <div>
            <FieldLabel htmlFor="phone" strong>
              Phone number<span className="ml-1 font-normal text-muted-foreground">(optional)</span>
            </FieldLabel>
            <PhoneInput id="phone" />
          </div>
        </div>

        <div className="space-y-2.5">
          <SectionLabel>Secure it</SectionLabel>
          <div>
            <FieldLabel htmlFor="password" strong>
              Password
            </FieldLabel>
            <PasswordInput id="password" name="password" autoComplete="new-password" required />
          </div>
          <div>
            <FieldLabel htmlFor="confirmPassword" strong>
              Confirm Password
            </FieldLabel>
            <PasswordInput id="confirmPassword" name="confirmPassword" autoComplete="new-password" required />
          </div>
        </div>

        {error && <Alert>{error}</Alert>}

        <button type="submit" className={primaryButton}>
          Hire {BRAND.fullName} <ArrowRight />
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        Already work with her?{" "}
        <Link href="/login" className="text-primary underline-offset-4 hover:underline">
          Sign In
        </Link>
      </p>
    </AuthSplit>
  );
}
