import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AuthCentered } from "@/components/auth/auth-shell";
import { InviteForm } from "./invite-form";

export const metadata = { title: "Set up your account" };

// Invite acceptance: team members arrive here from an emailed link carrying ?token=…
export default async function SignupPage({ searchParams }: PageProps<"/signup">) {
  const { token } = await searchParams;
  const value = Array.isArray(token) ? token[0] : token;

  return (
    <AuthCentered>
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Set up your account</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          {value
            ? "You've been invited to join your team. Choose a password to get started."
            : "This invite link is missing its token. Ask your administrator to resend the invite."}
        </p>
      </div>

      {value ? (
        <InviteForm token={value} />
      ) : (
        <Link href="/login" className="mt-5 inline-flex items-center gap-1.5 text-sm text-primary underline-offset-4 hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
        </Link>
      )}
    </AuthCentered>
  );
}
