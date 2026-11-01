import { CATALOG_TITLES } from "@/components/analytics/titles";
import { CatalogReport } from "@/components/analytics/registers";

export async function generateMetadata({ params }: PageProps<"/reports/[report]">) {
  const { report } = await params;
  return { title: CATALOG_TITLES[report] ?? "Report" };
}

export default async function Page({ params }: PageProps<"/reports/[report]">) {
  const { report } = await params;
  return <CatalogReport key={report} slug={report} />;
}
