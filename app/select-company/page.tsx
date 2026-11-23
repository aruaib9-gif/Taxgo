import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { CompanyPicker } from "@/components/company-picker";

export const metadata = { title: "Select company" };

export default function SelectCompanyPage() {
  return (
    <div className="flex min-h-screen flex-col items-center bg-(--body) px-6 py-10">
      <div className="mb-8">
        <BrandMark href="/home" />
      </div>
      <div className="w-full max-w-md">
        <h1 className="text-center text-2xl font-bold tracking-tight">Choose a company</h1>
        <p className="mb-6 mt-1 text-center text-sm text-muted-foreground">Pick the company you want to work in.</p>

        <CompanyPicker />

        <p className="mt-6 text-center text-sm">
          <Link href="/login" className="text-muted-foreground hover:text-foreground">Log out</Link>
        </p>
      </div>
    </div>
  );
}
