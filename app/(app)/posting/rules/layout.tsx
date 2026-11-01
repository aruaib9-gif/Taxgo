import { PostingRules } from "@/components/system/platform";

// The list stays mounted while sub-routes open panels beside it.
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PostingRules />
      {children}
    </>
  );
}
