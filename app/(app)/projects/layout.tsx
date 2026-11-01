import { Projects } from "@/components/projects";

// The list stays mounted while /new and /<id> open record panels beside it; the other
// project pages (tasks, timesheets, billing, edit) render in its place.
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Projects />
      {children}
    </>
  );
}
