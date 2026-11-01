import Link from "next/link";
import { Button } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-32 text-center">
      <p className="text-5xl font-bold tracking-tight">404</p>
      <p className="text-sm text-muted-foreground">
        This page doesn&apos;t exist yet in the scaffold.
      </p>
      <Link href="/home">
        <Button size="sm">Go Home</Button>
      </Link>
    </div>
  );
}
