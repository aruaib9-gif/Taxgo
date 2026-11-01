import { ProductFlags } from "@/components/pos/settings";

export const metadata = { title: "Returnable Deposits" };

export default function Page() {
  return <ProductFlags kind="deposit" />;
}
