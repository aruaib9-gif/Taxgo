import { Campaigns } from "@/components/crm/engage";

// The list stays mounted while sub-routes open panels beside it.
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Campaigns />
      {children}
    </>
  );
}
