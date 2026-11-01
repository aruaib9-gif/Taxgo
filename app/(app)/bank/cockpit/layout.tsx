import { Suspense } from "react";
import { Cockpit } from "@/components/finance/inbox";

// The list stays mounted while sub-routes open panels beside it (or replace it, for full pages).
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense>
        <Cockpit />
      </Suspense>
      {children}
    </>
  );
}
