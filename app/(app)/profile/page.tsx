"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Fingerprint, KeyRound, LogOut, ShieldCheck, Upload } from "lucide-react";
import { Card, Button, PageHeader } from "@/components/ui";
import { BRAND } from "@/lib/brand";
import { Select } from "@/components/accounting/pickers";
import { THEMES, applyTheme, currentTheme, type Theme } from "@/lib/theme";

const noSubscribe = () => () => {};

/** The theme picker, wired to the same setting as the top bar's sun/moon menu. */
function ThemeSelect() {
  const saved = useSyncExternalStore(noSubscribe, currentTheme, () => "system" as Theme);
  const [picked, setPicked] = useState<Theme | null>(null);
  return (
    <Select
      value={picked ?? saved}
      onChange={(v) => {
        setPicked(v as Theme);
        applyTheme(v as Theme);
      }}
      options={THEMES.map((t) => ({ value: t.value, label: t.label }))}
      ariaLabel="Theme"
    />
  );
}

const field = "h-9 w-full rounded-md border border-input bg-background px-2.5 text-sm outline-none focus:ring-2 focus:ring-ring";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

function Toggle({ on = false }: { on?: boolean }) {
  return (
    <span className={"relative inline-flex h-5 w-9 items-center rounded-full " + (on ? "bg-primary" : "bg-muted")}>
      <span className={"inline-block h-4 w-4 rounded-full bg-white transition-transform " + (on ? "translate-x-4" : "translate-x-0.5")} />
    </span>
  );
}

export default function ProfilePage() {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="My Profile" subtitle="Your account, security and preferences" />

      {/* Account */}
      <Card className="mb-5 p-6">
        <h2 className="mb-4 text-sm font-semibold">Account</h2>
        <div className="mb-5 flex items-center gap-4">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-lg font-bold text-accent-foreground">
            {BRAND.user.initials}
          </span>
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4" /> Change photo
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Row label="Full name">
            <input className={field} defaultValue={BRAND.user.fullName} />
          </Row>
          <Row label="Email">
            <input type="email" className={field} defaultValue="arua.ib9@gmail.com" />
          </Row>
          <Row label="Phone">
            <input type="tel" className={field} placeholder="+1 416 555 0123" />
          </Row>
          <Row label="Role">
            <input className={field + " text-muted-foreground"} defaultValue="Owner" readOnly />
          </Row>
        </div>
        <div className="mt-5 flex justify-end">
          <Button size="sm">Save changes</Button>
        </div>
      </Card>

      {/* Security */}
      <Card className="mb-5 p-6">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
          <ShieldCheck className="h-4 w-4 text-primary" /> Security
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Row label="Current password">
            <input type="password" className={field} placeholder="••••••••" />
          </Row>
          <Row label="New password">
            <input type="password" className={field} placeholder="••••••••" />
          </Row>
          <Row label="Confirm new password">
            <input type="password" className={field} placeholder="••••••••" />
          </Row>
        </div>
        <div className="mt-4 flex justify-end">
          <Button variant="outline" size="sm">Update password</Button>
        </div>

        <div className="mt-6 space-y-3 border-t border-border pt-5">
          {[
            { icon: Fingerprint, title: "Passkey — fingerprint / face", desc: "Sign in on this device without a password.", on: true },
            { icon: KeyRound, title: "6-digit quick-unlock PIN", desc: "Fast re-entry on trusted devices.", on: false },
            { icon: ShieldCheck, title: "Two-factor authentication", desc: "Require a second step at sign-in.", on: false },
          ].map((s) => (
            <div key={s.title} className="flex items-center justify-between">
              <span className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                  <s.icon className="h-4 w-4" />
                </span>
                <span>
                  <span className="block text-sm font-medium">{s.title}</span>
                  <span className="block text-xs text-muted-foreground">{s.desc}</span>
                </span>
              </span>
              <Toggle on={s.on} />
            </div>
          ))}
        </div>
      </Card>

      {/* Preferences */}
      <Card className="mb-5 p-6">
        <h2 className="mb-4 text-sm font-semibold">Preferences</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Row label="Language">
            <Select defaultValue="English" options={["English", "Français", "العربية", "हिन्दी"]} ariaLabel="Language" />
          </Row>
          <Row label="Timezone">
            <Select
              defaultValue="America/Toronto"
              options={["America/Toronto", "America/Vancouver", "America/New_York", "Europe/London", "Africa/Lagos", "Asia/Dubai", "Asia/Kolkata", "UTC"]}
              ariaLabel="Timezone"
            />
          </Row>
          <Row label="Theme">
            <ThemeSelect />
          </Row>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Use the sun/moon toggle in the top bar to switch theme instantly.</p>
      </Card>

      {/* Sign out */}
      <Card className="flex items-center justify-between p-6">
        <div>
          <p className="text-sm font-semibold">Sign out</p>
          <p className="text-xs text-muted-foreground">End your session on this device.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => router.push("/login")}>
          <LogOut className="h-4 w-4" /> Sign out
        </Button>
      </Card>
    </div>
  );
}
