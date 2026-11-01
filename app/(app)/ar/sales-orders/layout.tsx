import { SalesOrders } from "@/components/sales/orders";

// The list stays mounted while /new and /<id> open record panels beside it.
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SalesOrders />
      {children}
    </>
  );
}
