import { Suspense } from "react";
import { CashBook } from "@/components/analytics/statements";

export const metadata = { title: "Cash & Bank Book" };

export default function Page() {
  return (
    <Suspense>
      <CashBook />
    </Suspense>
  );
}
