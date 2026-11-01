"use client";

// Shared POS pieces: the printed receipt, supervisor approval, keypad and drawer counter.

import { useState } from "react";
import Link from "next/link";
import { Delete } from "lucide-react";
import { readCollection, type Rec } from "@/lib/store";
import { PAY_LABEL, RECEIPT_DEFAULT, checkPin, getSetting } from "@/lib/pos";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";
import { Dialog, Label, btn, inputCls, money, num } from "@/components/accounting/kit";

/* ---------- receipt ---------- */

export type ReceiptData = {
  company: { name: string; address?: string; header?: string; footer?: string; logoUrl?: string };
  sale: { saleNumber: string; saleDate: string; saleTime?: string; cashierName?: string | null; customerName?: string | null; status?: string; tokenNumber?: number };
  lines: { description: string; quantity: number; unitPrice: number; discountAmount: number; taxRate: number; taxAmount: number; lineTotal: number }[];
  totals: { subtotal: number; discount: number; tax: number; total: number; amountPaid: number; changeGiven: number; serviceCharge?: number; tip?: number };
  payments: { method: string; amount: number; reference?: string | null }[];
};

const esc = (s: unknown) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

export function receiptFromSale(sale: Rec): ReceiptData {
  const s = getSetting("receipt", RECEIPT_DEFAULT);
  const created = new Date(String(sale.createdAt ?? Date.now()));
  return {
    company: { name: BRAND.org, address: s.address || undefined, header: s.header || undefined, footer: [s.footer, s.returnPolicy].filter(Boolean).join("\n\n") || undefined, logoUrl: s.logoUrl || undefined },
    sale: { saleNumber: String(sale.saleNumber), saleDate: String(sale.saleDate), saleTime: created.toTimeString().slice(0, 5), cashierName: (sale.cashierName as string) ?? null, customerName: (sale.customerName as string) ?? null, status: String(sale.status), tokenNumber: sale.tokenNumber as number },
    lines: ((sale.lines as Rec[]) ?? []).map((l) => ({ description: String(l.description), quantity: num(l.quantity), unitPrice: num(l.unitPrice), discountAmount: num(l.discountAmount), taxRate: num(l.taxRate), taxAmount: num(l.taxAmount), lineTotal: num(l.lineTotal) })),
    totals: { subtotal: num(sale.subtotal), discount: num(sale.discountAmount), tax: num(sale.taxAmount), total: num(sale.totalAmount), amountPaid: num(sale.amountPaid), changeGiven: num(sale.changeGiven), serviceCharge: num(sale.serviceCharge), tip: num(sale.tip) },
    payments: ((sale.payments as Rec[]) ?? []).map((p) => ({ method: String(p.method), amount: num(p.amount), reference: (p.reference as string) ?? null })),
  };
}

// Monospace till receipt with a per-rate tax breakup (split into CGST/SGST halves, as live prints it).
// Each half of the tax is rounded to cents, as printed on GST receipts.
const half = (t: number) => Math.round((t / 2 + 1e-9) * 100) / 100;

export function receiptHTML(r: ReceiptData, width = "80mm") {
  const row = (a: string, b: string, bold = false) => `<div style="display:flex;justify-content:space-between;${bold ? "font-weight:700;" : ""}"><span>${a}</span><span>${b}</span></div>`;
  const hr = `<div style="border-top:1px dashed #000;margin:4px 0"></div>`;
  const byRate = new Map<number, { taxable: number; tax: number }>();
  for (const l of r.lines) {
    const b = byRate.get(l.taxRate) ?? { taxable: 0, tax: 0 };
    b.taxable += l.lineTotal - l.taxAmount;
    b.tax += l.taxAmount;
    byRate.set(l.taxRate, b);
  }
  const taxable = r.lines.reduce((a, l) => a + l.lineTotal - l.taxAmount, 0);
  const w = width === "a4" ? "180mm" : width === "58mm" ? "50mm" : "72mm";
  return `<div style="width:${w};margin:0 auto;padding:12px 10px;background:#fff;color:#000;font:11px/1.35 ui-monospace,Menlo,Consolas,monospace">
${r.company.logoUrl ? `<div style="text-align:center"><img src="${esc(r.company.logoUrl)}" alt="" style="max-height:48px;margin:0 auto"/></div>` : ""}
<div style="text-align:center;font-size:14px;font-weight:700">${esc(r.company.name)}</div>
${r.company.address ? `<div style="text-align:center;white-space:pre-line">${esc(r.company.address)}</div>` : ""}
${r.company.header ? `<div style="text-align:center;white-space:pre-line">${esc(r.company.header)}</div>` : ""}
${hr}${row("Receipt", esc(r.sale.saleNumber))}${row("Date", `${esc(r.sale.saleDate)} ${esc(r.sale.saleTime ?? "")}`)}${r.sale.cashierName ? row("Cashier", esc(r.sale.cashierName)) : ""}${r.sale.customerName ? row("Customer", esc(r.sale.customerName)) : ""}${r.sale.tokenNumber ? row("Token", `#${r.sale.tokenNumber}`) : ""}
${hr}<table style="width:100%;border-collapse:collapse;font:inherit"><thead><tr style="font-weight:700;border-bottom:1px solid #000"><td>Item</td><td style="text-align:right">Qty</td><td style="text-align:right">Rate</td><td style="text-align:right">GST%</td><td style="text-align:right">Amount</td></tr></thead><tbody>
${r.lines.map((l) => `<tr><td>${esc(l.description)}</td><td style="text-align:right">${l.quantity}</td><td style="text-align:right">${money(l.unitPrice)}</td><td style="text-align:right">${l.taxRate}%</td><td style="text-align:right">${money(l.lineTotal)}</td></tr>`).join("")}
</tbody></table>${hr}
${r.totals.discount > 0 ? row("Discount", `-${money(r.totals.discount)}`) : ""}${row("Taxable Value", money(taxable))}
${byRate.size ? `<div style="font-weight:700;margin-top:2px">GST BREAKUP</div><table style="width:100%;border-collapse:collapse;font:inherit"><tr style="font-weight:700;border-bottom:1px solid #000"><td>Rate</td><td style="text-align:right">Taxable</td><td style="text-align:right">CGST</td><td style="text-align:right">SGST</td></tr>${[...byRate].map(([rate, b]) => `<tr><td>${rate}%</td><td style="text-align:right">${money(b.taxable)}</td><td style="text-align:right">${money(half(b.tax))}</td><td style="text-align:right">${money(half(b.tax))}</td></tr>`).join("")}</table>` : ""}
${row("Total Tax", money(r.totals.tax))}${r.totals.serviceCharge ? row("Service charge", money(r.totals.serviceCharge)) : ""}${r.totals.tip ? row("Tip", money(r.totals.tip)) : ""}
<div style="display:flex;justify-content:space-between;font-size:14px;font-weight:700;margin:4px 0"><span>TOTAL</span><span>${money(r.totals.total)}</span></div>${hr}
${r.payments.map((p) => row(PAY_LABEL[p.method] ?? esc(p.method), money(p.amount))).join("")}${row("Paid", money(r.totals.amountPaid))}${row("Change", money(r.totals.changeGiven))}
${r.company.footer ? `<div style="text-align:center;white-space:pre-line;margin-top:6px">${esc(r.company.footer)}</div>` : ""}
<div style="text-align:center;margin-top:6px">Thank you!</div></div>`;
}

export function ReceiptView({ receipt, width = "80mm", className }: { receipt: ReceiptData; width?: string; className?: string }) {
  return <div className={cn("shadow-sm", className)} dangerouslySetInnerHTML={{ __html: receiptHTML(receipt, width) }} />;
}

export function printReceipt(sale: Rec) {
  const t = readCollection("pos-terminals").find((x) => x.id === sale.terminalId);
  const w = window.open("", "_blank", "width=420,height=700");
  if (!w) return;
  w.document.write(`<!doctype html><html><head><title>${esc(sale.saleNumber)}</title><style>@page{margin:0}body{margin:0}</style></head><body>${receiptHTML(receiptFromSale(sale), String(t?.receiptWidth ?? "80mm"))}<script>window.onload=()=>{window.print()}</script></body></html>`);
  w.document.close();
}

/* ---------- supervisor approval ---------- */

export function ApprovalDialog({ title, onClose, onApproved }: { title: string; onClose: () => void; onApproved: (name: string) => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const hasPin = !!getSetting("supervisor", { pin: "" }).pin;
  function approve() {
    const name = checkPin(pin);
    if (!name) return setError("Wrong PIN.");
    onApproved(name);
  }
  return (
    <Dialog open onClose={onClose} title={title} description="A supervisor enters their PIN to approve this action.">
      {hasPin ? (
        <div className="space-y-2">
          <Label htmlFor="sv-pin">Supervisor PIN</Label>
          <input id="sv-pin" type="password" inputMode="numeric" autoFocus value={pin} onChange={(e) => { setPin(e.target.value); setError(""); }} onKeyDown={(e) => e.key === "Enter" && approve()} className={inputCls} />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No supervisor PIN is set yet. Set one under <Link href="/pos/supervisor-pin" className="underline">POS → Supervisor PIN</Link>.</p>
      )}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onClose} className={btn.outline}>Cancel</button>
        <button type="button" onClick={approve} disabled={!hasPin || !pin} className={btn.primary}>Approve</button>
      </div>
    </Dialog>
  );
}

/* ---------- keypad & drawer count ---------- */

export function Keypad({ value, onChange, allowDecimal = true }: { value: string; onChange: (v: string) => void; allowDecimal?: boolean }) {
  const press = (k: string) => {
    if (k === "del") return onChange(value.slice(0, -1));
    if (k === ".") { if (!allowDecimal || value.includes(".")) return; return onChange(value === "" ? "0." : value + "."); }
    onChange(value === "0" ? k : value + k);
  };
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", allowDecimal ? "." : "", "0", "del"];
  return (
    <div className="grid grid-cols-3 gap-2">
      {keys.map((k, i) => (k === "" ? <div key={i} /> : <button key={i} type="button" onClick={() => press(k)} className={cn(btn.outline, "h-12 text-lg")}>{k === "del" ? <Delete /> : k}</button>))}
    </div>
  );
}

export const DENOMINATIONS = [100, 50, 20, 10, 5, 2, 1, 0.5, 0.25, 0.1, 0.05];
export const countTotal = (c: Record<string, number>) => Math.round(Object.entries(c).reduce((a, [d, q]) => a + Number(d) * (q || 0), 0) * 1000) / 1000;

export function DenominationCounter({ value, onChange }: { value: Record<string, number>; onChange: (v: Record<string, number>) => void }) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        {DENOMINATIONS.map((d) => (
          <label key={d} className="flex items-center gap-2 text-sm">
            <span className="w-14 text-right tabular-nums text-muted-foreground">{money(d)}</span>
            <span className="text-muted-foreground">×</span>
            <input type="number" min={0} aria-label={`Count of ${d}`} value={value[d] ?? ""} onChange={(e) => onChange({ ...value, [d]: Math.max(0, parseInt(e.target.value) || 0) })} className={cn(inputCls, "h-8")} />
          </label>
        ))}
      </div>
      <div className="flex justify-between border-t border-border pt-2 text-sm font-semibold"><span>Counted</span><span className="tabular-nums">{money(countTotal(value))}</span></div>
    </div>
  );
}
