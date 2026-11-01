import { RepairDetail } from "@/components/operations/service";

export const metadata = { title: "Repair Order" };

export default async function Page({ params }: PageProps<"/repair-orders/[id]">) {
  const { id } = await params;
  return <RepairDetail id={id} />;
}
