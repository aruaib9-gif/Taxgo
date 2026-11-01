import { Opportunities } from "@/components/crm/pipeline";

// The list stays mounted while sub-routes open panels beside it.
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Opportunities />
      {children}
    </>
  );
}
