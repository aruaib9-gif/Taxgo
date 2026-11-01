import { ArPayments } from "@/components/sales/receivables";

// The list stays mounted while /new and /<id> open record panels beside it.
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ArPayments />
      {children}
    </>
  );
}
