import { ChartOfAccounts } from "@/components/accounting/chart-of-accounts";

// The list stays mounted while /new and /<id> open record panels beside it.
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ChartOfAccounts />
      {children}
    </>
  );
}
