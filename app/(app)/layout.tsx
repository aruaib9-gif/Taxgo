import { Suspense } from "react";
import { Shell } from "@/components/shell";

/**
 * Module screens read the query string (?status=OVERDUE, ?customer=…, ?print=1)
 * with useSearchParams, which Next requires to sit under a Suspense boundary so
 * the shell can still be prerendered. One boundary here covers every route in
 * the group; the shell itself renders statically around it.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Shell>
      <Suspense>{children}</Suspense>
    </Shell>
  );
}
