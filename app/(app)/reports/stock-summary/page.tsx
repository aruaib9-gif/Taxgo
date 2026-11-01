import { StockSummary } from "@/components/analytics/registers";

export const metadata = { title: "Stock Summary" };

export default async function Page({ searchParams }: PageProps<"/reports/stock-summary">) {
  const { groupBy } = await searchParams;
  return <StockSummary key={String(groupBy ?? "branch")} byWarehouse={groupBy === "warehouse"} />;
}
