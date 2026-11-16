import { Sparkles, Paperclip, Plus } from "lucide-react";
import { Card, Button } from "@/components/ui";
import { InboxAttachButton } from "@/components/attachments";

export const metadata = { title: "Voucher Entry" };

const voucherTypes = [
  ["Contra", "F4"],
  ["Payment", "F5"],
  ["Receipt", "F6"],
  ["Journal", "F7"],
  ["Sales", "F8"],
  ["Purchase", "F9"],
  ["Debit Note", "F10"],
  ["Credit Note", "F11"],
];

export default function VoucherEntry() {
  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Journal Voucher</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Press F4–F9 to switch voucher type · F7
        </p>
      </div>

      {/* Fill with AI */}
      <Card className="mb-4 bg-accent/40 p-4">
        <p className="mb-2 text-sm font-medium">
          <Sparkles className="mr-1 inline h-4 w-4 text-primary" />
          Fill with AI — describe the transaction or attach a receipt/invoice
        </p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm">
            <Sparkles className="h-4 w-4" /> Suggest entry
          </Button>
          <InboxAttachButton className="inline-flex h-8 items-center gap-1.5 rounded-md border border-input bg-background px-3 text-xs font-medium shadow-sm hover:bg-accent hover:text-accent-foreground">
            <Paperclip className="h-4 w-4" /> Attach receipt/invoice
          </InboxAttachButton>
        </div>
      </Card>

      {/* Voucher type tabs */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {voucherTypes.map(([t, key], i) => (
          <button
            key={t}
            className={
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium " +
              (i === 3
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-card text-muted-foreground hover:bg-muted")
            }
          >
            {t}
            <span className="rounded bg-black/10 px-1 text-[10px]">{key}</span>
          </button>
        ))}
      </div>

      {/* Header fields */}
      <Card className="mb-4 grid grid-cols-2 gap-4 p-5 md:grid-cols-3">
        {["Date", "Fiscal Period", "Voucher No."].map((f) => (
          <div key={f} className="space-y-1.5">
            <label className="text-xs text-muted-foreground">{f}</label>
            <div className="h-9 rounded-md border border-input bg-background" />
          </div>
        ))}
      </Card>

      {/* Ledger entries */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="text-sm font-semibold">Ledger Entries</span>
          <span className="text-xs text-warning">Difference: ₹0.000</span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-4 py-2 font-medium">Ledger</th>
              <th className="px-4 py-2 font-medium">Narration</th>
              <th className="px-4 py-2 text-right font-medium">Debit</th>
              <th className="px-4 py-2 text-right font-medium">Credit</th>
            </tr>
          </thead>
          <tbody>
            {[0, 1].map((r) => (
              <tr key={r} className="border-b border-border/60">
                <td className="px-4 py-2">
                  <div className="h-8 rounded border border-input bg-background text-xs" />
                </td>
                <td className="px-4 py-2">
                  <div className="h-8 rounded border border-input bg-background" />
                </td>
                <td className="px-4 py-2">
                  <div className="h-8 rounded border border-input bg-background" />
                </td>
                <td className="px-4 py-2">
                  <div className="h-8 rounded border border-input bg-background" />
                </td>
              </tr>
            ))}
            <tr>
              <td colSpan={4} className="px-4 py-2">
                <button className="flex items-center gap-1 text-xs font-medium text-primary">
                  <Plus className="h-3.5 w-3.5" /> Add Line
                </button>
              </td>
            </tr>
            <tr className="border-t border-border font-semibold">
              <td className="px-4 py-2" colSpan={2}>
                Total
              </td>
              <td className="px-4 py-2 text-right">₹0.000</td>
              <td className="px-4 py-2 text-right">₹0.000</td>
            </tr>
          </tbody>
        </table>
      </Card>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Tip: type a new ledger name, then <kbd className="rounded border border-border px-1">Alt+C</kbd> to create it inline.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            Cancel (Esc)
          </Button>
          <Button size="sm">Accept (^A)</Button>
        </div>
      </div>
    </div>
  );
}
