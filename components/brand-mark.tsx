import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { TLogo } from "@/components/landing/brand";

export function BrandMark({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
      <TLogo className="h-7 w-7" />
      <span>{BRAND.name}</span>
    </Link>
  );
}
