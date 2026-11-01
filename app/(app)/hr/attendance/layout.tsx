import { Attendance } from "@/components/hr/time";

// The list stays mounted while sub-routes open panels beside it (or replace it, for full pages).
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Attendance />
      {children}
    </>
  );
}
