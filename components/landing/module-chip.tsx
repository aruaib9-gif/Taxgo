import type { Module } from "@/lib/modules";
import { cn } from "@/lib/utils";

// A module's glyph on its own tinted chip, in the colour the artwork gives that
// module. The tint is the same hue at low opacity, so it sits on a light or a
// dark card without a second set of values.
export function ModuleChip({
  mod,
  className = "h-9 w-9",
  glyph = "h-4.5 w-4.5",
}: {
  mod: Module;
  className?: string;
  glyph?: string;
}) {
  return (
    <span
      className={cn("grid shrink-0 place-items-center rounded-xl", className)}
      style={{ backgroundColor: `${mod.hue}26`, color: mod.hue }}
    >
      <mod.icon className={glyph} strokeWidth={1.9} />
    </span>
  );
}
