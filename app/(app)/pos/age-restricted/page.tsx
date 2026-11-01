import { ProductFlags } from "@/components/pos/settings";

export const metadata = { title: "Age-Restricted Products" };

export default function Page() {
  return <ProductFlags kind="age" />;
}
