import { Templates } from "@/components/system/settings";

// The list stays mounted while sub-routes open panels beside it.
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Templates />
      {children}
    </>
  );
}
