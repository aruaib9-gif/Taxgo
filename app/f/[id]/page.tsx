import { PublicWebForm } from "@/components/crm/public-form";

export const metadata = { title: "Contact us" };

export default async function Page({ params }: PageProps<"/f/[id]">) {
  const { id } = await params;
  return <PublicWebForm id={id} />;
}
