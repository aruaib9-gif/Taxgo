"use client";

// Public web-to-lead form at /f/<id>: Name, Email, Phone, Company and a small sum as captcha.

import { useEffect, useState } from "react";
import { readCollection, type Rec } from "@/lib/store";
import { submitWebForm } from "@/lib/crm";
import { BRAND } from "@/lib/brand";
import { btn, inputCls, textareaCls } from "@/components/accounting/kit";

export function PublicWebForm({ id }: { id: string }) {
  const [form, setForm] = useState<Rec | null | undefined>(undefined);
  const [sum, setSum] = useState<[number, number]>([0, 0]);
  const [f, setF] = useState({ name: "", email: "", phone: "", company: "", message: "", captcha: "" });
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => { setForm(readCollection("web-forms").find((x) => x.id === id) ?? null); setSum([1 + Math.floor(Math.random() * 9), 1 + Math.floor(Math.random() * 9)]); }, 0);
    return () => clearTimeout(t);
  }, [id]);
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    if (!f.name.trim()) return setErr("Please enter your name");
    if (!/^\S+@\S+\.\S+$/.test(f.email)) return setErr("Please enter a valid email address");
    if (form.captcha !== false && Number(f.captcha) !== sum[0] + sum[1]) return setErr("The answer to the sum is not right");
    submitWebForm(form, f);
    if (form.redirectUrl) { window.location.href = String(form.redirectUrl); return; }
    setDone(true);
  }
  const box = (children: React.ReactNode) => <main className="flex min-h-screen items-center justify-center bg-background p-4"><div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-sm">{children}</div></main>;
  if (form === undefined) return box(<p className="text-sm text-muted-foreground">Loading…</p>);
  if (!form || form.active === false) return box(<><h1 className="text-lg font-semibold">Form unavailable</h1><p className="mt-1 text-sm text-muted-foreground">This form doesn&apos;t exist or is no longer accepting submissions.</p></>);
  if (done) return box(<><h1 className="text-lg font-semibold">Thank you!</h1><p className="mt-1 text-sm text-muted-foreground">We&apos;ve received your details and will be in touch shortly.</p></>);
  const input = (k: keyof typeof f, label: string, type = "text", req = false) => <div className="space-y-1.5"><label htmlFor={`wf-${k}`} className="text-sm font-medium">{label}{req && <span className="text-destructive"> *</span>}</label><input id={`wf-${k}`} type={type} className={inputCls} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></div>;
  return box(
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div><h1 className="text-xl font-semibold">{String(form.name)}</h1><p className="text-sm text-muted-foreground">Leave your details and we&apos;ll get back to you.</p></div>
      {input("name", "Name", "text", true)}{input("email", "Email", "email", true)}{input("phone", "Phone", "tel")}{input("company", "Company")}
      <div className="space-y-1.5"><label htmlFor="wf-message" className="text-sm font-medium">Message</label><textarea id="wf-message" rows={3} className={textareaCls} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} /></div>
      {form.captcha !== false && input("captcha", `What is ${sum[0]} + ${sum[1]}?`, "number", true)}
      {err && <p role="alert" className="text-sm text-destructive">{err}</p>}
      <button type="submit" className={`${btn.primary} w-full`}>Submit</button>
      <p className="text-center text-xs text-muted-foreground">Powered by {BRAND.fullName}</p>
    </form>,
  );
}
