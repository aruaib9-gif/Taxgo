import { RecurringBills } from "@/components/purchasing/payables";

// The list stays mounted while /new and /<id> open record panels beside it.
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <RecurringBills />
      {children}
    </>
  );
}
