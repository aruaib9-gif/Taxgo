import { Attributes } from "@/components/inventory/catalog";

// The list stays mounted while /new and /<id> open record panels beside it.
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Attributes />
      {children}
    </>
  );
}
