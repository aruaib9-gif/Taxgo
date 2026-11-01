import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PageScaffold } from "@/components/page-scaffold";
import { EntityList } from "@/components/entity-list";
import { metaFor, type PageMeta } from "@/lib/page-meta";
import { schemaFor } from "@/lib/schemas";
import { findNavItem } from "@/lib/nav";

function hrefOf(slug: string[]) {
  return "/" + slug.join("/");
}

function resolve(slug: string[]): PageMeta | null {
  const href = hrefOf(slug);
  const meta = metaFor(href);
  if (meta) return meta;

  const nav = findNavItem(href);
  if (nav) {
    const isForm = href.endsWith("/new");
    return { title: nav.label, kind: isForm ? "form" : "list" };
  }
  return null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const schema = schemaFor(hrefOf(slug));
  if (schema) return { title: schema.title };
  const meta = resolve(slug);
  return { title: meta?.title ?? "Not found" };
}

export default async function CatchAllPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const href = hrefOf(slug);

  // Fully functional list + create form when we have a schema for the route.
  if (schemaFor(href)) return <EntityList href={href} />;

  const meta = resolve(slug);
  if (!meta) notFound();
  return <PageScaffold meta={meta} />;
}
