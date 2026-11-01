import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { TGMark } from "@/components/landing/brand";

export function BrandMark({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
      <TGMark className="text-[11px]" />
      <span>{BRAND.fullName}</span>
    </Link>
  );
}
