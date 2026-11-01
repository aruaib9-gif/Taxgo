"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, LogOut, User } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { useDismiss } from "@/lib/use-dismiss";

const item = "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent [&>svg]:size-4 [&>svg]:shrink-0";

export function UserMenu() {
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, setOpen);
  const router = useRouter();

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Account"
        aria-haspopup="menu"
        aria-expanded={open}
        className="relative flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs hover:bg-accent"
      >
        {BRAND.user.initials}
      </button>

      {open ? (
        <div role="menu" className="absolute right-0 top-full z-50 mt-1 w-56 rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md">
          <div className="space-y-1 px-2 py-1.5">
            <p className="text-sm font-medium">{BRAND.user.fullName}</p>
            <p className="truncate text-xs text-muted-foreground">arua.ib9@gmail.com</p>
          </div>
          <div className="-mx-1 my-1 h-px bg-muted" />
          <Link href="/select-company" role="menuitem" onClick={() => setOpen(false)} className={item}>
            <Building2 /> Switch Company
          </Link>
          <Link href="/profile" role="menuitem" onClick={() => setOpen(false)} className={item}>
            <User /> Profile
          </Link>
          <div className="-mx-1 my-1 h-px bg-muted" />
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              router.push("/login");
            }}
            className={item}
          >
            <LogOut /> Log out
          </button>
        </div>
      ) : null}
    </div>
  );
}
