import { ProductFlags } from "@/components/pos/settings";

export const metadata = { title: "Weighed Products" };

export default function Page() {
  return <ProductFlags kind="weighed" />;
}
