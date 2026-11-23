import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight, ArrowRightLeft, Check, CircleAlert, Quote } from "lucide-react";
import { BRAND } from "@/lib/brand";
import {
  Container,
  H2,
  Kicker,
  LandingFooter,
  LandingHeader,
  Serif,
  btnOutline,
  btnPrimary,
} from "@/components/landing/chrome";
import { TLogo, Watermark, WhatsAppButton } from "@/components/landing/brand";
import { BackToTop } from "@/components/landing/back-to-top";
import {
  AiNote,
  Caption,
  DataTable,
  Example,
  Figures,
  Flow,
  Fn,
  Ledger,
  Note,
  P,
  PartHeading,
} from "@/components/landing/guide";
import { cn } from "@/lib/utils";

const AI = BRAND.fullName;

export const metadata = {
  title: `Inventory module`, // the root layout appends "· Tax GO"
  description: `The ${AI} inventory module in full: 23 functions across products, warehouses, barcode operations, stock movements, replenishment, traceability, costing and AI analytics — with worked examples for each.`,
};

/** The chart colours, as the guide draws them. */
const CHART = {
  blue: "#4285F4",
  green: "#5CB85C",
  orange: "#ED8A5B",
  amber: "#F2CE5C",
  purple: "#A78BE8",
} as const;

/** The inventory lifecycle, end to end. */
const lifecycle: [string, string][] = [
  ["Product configuration", "Products · Categories · Attributes · Units of measure"],
  ["Warehouse configuration", "Warehouses · Bins · Storage locations"],
  ["Stock acquisition", "Purchasing · Goods receipt · Landed costs"],
  ["Inventory operations", "Scanning · Transfers · Production · Quality control"],
  ["Stock control", "Reconciliation · Scrap · Batch and serial tracking"],
  ["Inventory accounting", "Stock valuation · Journals · General ledger"],
  ["Inventory intelligence", "Demand forecasting · Reorder advice · AI analytics"],
];

/** The dashboard's headline figures. */
const dashboard: [string, string][] = [
  ["Total inventory value", "$485,000"],
  ["Active products", "2,450"],
  ["Units in stock", "28,750"],
  ["Warehouse locations", "6"],
  ["Low stock products", "38"],
  ["Out-of-stock products", "12"],
  ["Slow-moving inventory", "$42,500"],
  ["Pending quality checks", "8"],
];

const alerts = [
  "38 products below reorder level",
  "15 product batches approaching expiry",
  "8 quality inspections pending",
  "5 stock adjustments awaiting approval",
];

/** The category hierarchy. */
const categories: [string, string[]][] = [
  ["Electronics", ["Computers", "Mobile phones", "Accessories"]],
  ["Clothing", ["Men's clothing", "Women's clothing", "Children's clothing"]],
  ["Food & beverages", ["Dry foods", "Fresh produce", "Beverages"]],
  ["Industrial supplies", ["Raw materials", "Tools", "Spare parts"]],
];

const shirts: [string, string, string][] = [
  ["Black", "/inventory/shirt-black.jpg", "A black cotton t-shirt laid flat"],
  ["White", "/inventory/shirt-white.jpg", "A white cotton t-shirt laid flat"],
  ["Blue", "/inventory/shirt-blue.jpg", "A blue cotton t-shirt laid flat"],
];

const warehouses: { country: string; name: string; value: string; src: string; alt: string }[] = [
  {
    country: "Canada",
    name: "Ottawa warehouse",
    value: "$150,000",
    src: "/inventory/warehouse-ottawa.jpg",
    alt: "A modern distribution centre seen from the car park",
  },
  {
    country: "Ireland",
    name: "Dublin warehouse",
    value: "$85,000",
    src: "/inventory/warehouse-dublin.jpg",
    alt: "A logistics park with loading bays",
  },
  {
    country: "Nigeria",
    name: "Lagos warehouse",
    value: "$65,000",
    src: "/inventory/warehouse-lagos.jpg",
    alt: "A newly built warehouse and its yard",
  },
];

/** The scan station's three operations. */
const scanning: { title: string; text: string; src: string; alt: string }[] = [
  {
    title: "Receive",
    text: "Scan goods in against the purchase order.",
    src: "/inventory/scan-automation.jpg",
    alt: "A warehouse worker scanning cartons on a conveyor",
  },
  {
    title: "Pick",
    text: "Scan products out as orders are assembled.",
    src: "/inventory/scan-accuracy.jpg",
    alt: "A picker scanning a shelf label in a racking aisle",
  },
  {
    title: "Cycle count",
    text: "Scan shelves to verify recorded quantities.",
    src: "/inventory/scan-software.jpg",
    alt: "A handheld terminal showing stock quantities in a warehouse",
  },
];

/** The computer assembly in the stock journal. */
const components: [string, string, string][] = [
  ["Motherboard", "$150", "/inventory/part-motherboard.jpg"],
  ["Processor", "$200", "/inventory/part-cpu.jpg"],
  ["Memory", "$80", "/inventory/part-memory.jpg"],
  ["Power supply", "$70", "/inventory/part-psu.jpg"],
  ["SSD", "$100", "/inventory/part-ssd.jpg"],
  ["Case", "$100", "/inventory/part-case.jpg"],
];

/** The desk's bill of materials. */
const bom: [string, string, string][] = [
  ["1 wooden top", "$80", "/inventory/desk-top.jpg"],
  ["4 metal legs", "$100", "/inventory/desk-legs.jpg"],
  ["1 fittings kit", "$20", "/inventory/desk-fittings.jpg"],
];

/** Supplier to warehouse, and what gets added on the way. */
const landed: { title: string; text: string; src: string; alt: string }[] = [
  {
    title: "Supplier invoice",
    text: "The original product cost.",
    src: "/inventory/landed-supplier.jpg",
    alt: "Packaged industrial goods ready for despatch",
  },
  {
    title: "International freight",
    text: "Shipping and insurance.",
    src: "/inventory/landed-freight.jpg",
    alt: "A container ship at sea",
  },
  {
    title: "Customs & clearance",
    text: "Duties and handling fees.",
    src: "/inventory/landed-customs.jpg",
    alt: "Containers stacked at a port terminal",
  },
  {
    title: "Warehouse receipt",
    text: "The final acquisition cost.",
    src: "/inventory/landed-receipt.jpg",
    alt: "A pallet being unloaded at a warehouse dock",
  },
];

/** The stock ageing bands. */
const ageing: [string, number, string][] = [
  ["0–30 days", 210000, CHART.green],
  ["31–60 days", 125000, CHART.blue],
  ["61–90 days", 75000, CHART.amber],
  ["91–180 days", 32500, CHART.orange],
  ["Over 180 days", 42500, CHART.purple],
];

/** What the stock ledger did to the balance. */
const ledgerRows: [string, string, string, string, number][] = [
  ["Nov 1", "Opening stock", "—", "—", 100],
  ["Nov 3", "Purchase receipt", "200", "—", 300],
  ["Nov 7", "Sales delivery", "—", "80", 220],
  ["Nov 10", "Warehouse transfer out", "—", "50", 170],
  ["Nov 15", "Stock adjustment", "5", "—", 175],
  ["Nov 18", "Scrap", "—", "10", 165],
  ["Nov 21", "Sales delivery", "—", "40", 125],
];

/** Availability by product. */
const availability: [string, number, number][] = [
  ["Laptops", 200, 50],
  ["Monitors", 300, 100],
  ["Printers", 100, 20],
  ["Routers", 350, 150],
];

/** What Inventory Intelligence raises. */
const insights: [string, string, string][] = [
  [
    "Stockout risk",
    "38 products are approaching critical levels. On current demand, 12 may run out within seven days.",
    "Review replenishment requirements.",
  ],
  [
    "Working capital",
    "$42,500 sits in inventory with no qualifying movement for over 180 days.",
    "Review promotions, returns and purchasing restrictions.",
  ],
  [
    "Expiry risk",
    "15 batches valued at $8,750 are approaching their expiry dates.",
    "Prioritise eligible batches and assess write-down risks.",
  ],
  [
    "Warehouse optimisation",
    "Demand in Toronto exceeds available stock while Ottawa holds a surplus.",
    "Review a proposed transfer of 150 units.",
  ],
  [
    "Abnormal adjustments",
    "Five unusual inventory corrections need investigation.",
    "Review the till operators and approval records.",
  ],
];

const kpis: [string, string][] = [
  ["Inventory turnover", "Cost of goods sold divided by average inventory value"],
  ["Days inventory outstanding", "Average days inventory stays invested before sale"],
  ["Stockout rate", "How often required products are unavailable"],
  ["Inventory accuracy", "How closely system records match physical stock"],
  ["Scrap rate", "The proportion of inventory written off"],
  ["Inventory carrying cost", "The cost of holding and maintaining stock"],
  ["Order fulfilment rate", "The proportion of customer demand met"],
  ["Slow-moving inventory", "Stock with little or no movement in a period"],
  ["Gross margin", "Sales revenue less cost of goods sold"],
  ["GMROI", "Gross margin return on inventory investment"],
];

/** The accounting matrix. */
const matrix: [string, string, string][] = [
  ["Purchase receipt", "Inventory", "GRNI / clearing account"],
  ["Sales delivery", "Cost of goods sold", "Inventory"],
  ["Purchase return", "Payable / clearing account", "Inventory"],
  ["Production consumption", "Work in progress", "Raw materials"],
  ["Production completion", "Finished goods", "Work in progress"],
  ["Direct stock conversion", "Finished goods", "Raw materials"],
  ["Scrap", "Inventory loss expense", "Inventory"],
  ["Stock shortage", "Inventory adjustment expense", "Inventory"],
  ["Stock surplus", "Inventory", "Appropriate adjustment account"],
  ["Landed cost", "Inventory / COGS", "Payable / clearing account"],
  ["Internal bin movement", "No posting", "No posting"],
];

/** What you can ask her. */
const asks: [string, string][] = [
  ["Show me our current inventory position.", "Generate an inventory dashboard summary"],
  ["Create products from this supplier catalogue.", "Prepare product records for validation"],
  ["Organise these products into categories.", "Recommend a category hierarchy"],
  ["Create variants for these shirts.", "Prepare colour and size combinations"],
  ["Review our units of measure.", "Identify measurement inconsistencies"],
  ["Show inventory across all warehouses.", "Consolidate warehouse stock reports"],
  ["Where are these products stored?", "Identify recorded bins and locations"],
  ["Calculate this month's inventory losses.", "Analyse scrap and adjustment transactions"],
  ["Who approved these till stock corrections?", "Retrieve stock history and approval records"],
  ["Review discrepancies from today's stock count.", "Analyse scan and count results"],
  ["Which suppliers have the most quality failures?", "Generate a supplier quality analysis"],
  ["Which products are running out of stock?", "Analyse balances against reorder thresholds"],
  ["Move excess stock to Toronto.", "Prepare a proposed stock transfer"],
  ["Calculate the cost of producing 500 units.", "Analyse BOM and consumption requirements"],
  ["Prepare purchase requisitions for low-stock items.", "Recommend replenishment quantities"],
  ["Reconcile the physical stock with the system.", "Prepare a discrepancy and adjustment report"],
  ["Explain why inventory value decreased.", "Trace movements through the stock ledger"],
  ["Show products that haven't moved in six months.", "Generate a stock ageing analysis"],
  ["Which product batches are expiring?", "Analyse expiry dates and quantities"],
  ["Track this product's serial number.", "Retrieve that unit's movement history"],
  ["Calculate materials needed for tomorrow's production.", "Evaluate the BOM requirements"],
  ["Calculate the true cost of our latest imports.", "Prepare landed cost allocations"],
  ["How can we reduce excess inventory?", "Analyse performance and recommend actions"],
];

const integrations: [string, string][] = [
  ["Purchasing", "Replenishment, supplier prices, goods receipts and returns"],
  ["Sales", "Product availability, orders, deliveries and customer returns"],
  ["Accounting", "Inventory valuation, cost of sales and financial reporting"],
  ["Retail Xpress", "Real-time retail movements and till adjustment approvals"],
  ["Manufacturing", "Raw material consumption, production and BOM management"],
  ["Parcel-King", "Warehouse dispatch, transport and delivery coordination"],
  ["Quality", "Inspections, defects and supplier quality performance"],
  ["AI agents", "Demand forecasting, recommendations and automation"],
  ["Analytics", "Inventory efficiency, profitability and performance"],
];

const controls: [string, string][] = [
  ["Unique SKUs and barcodes", "Prevent duplicate or incorrect product identification"],
  ["Warehouse-level permissions", "Restrict unauthorised inventory activities"],
  ["Stock adjustment approvals", "Prevent unauthorised changes to balances"],
  ["Scrap approval procedures", "Control unnecessary write-offs"],
  ["Batch and serial tracking", "Maintain detailed product traceability"],
  ["Quality control checkpoints", "Identify defective or non-compliant goods"],
  ["Physical stock counts", "Verify recorded quantities"],
  ["Reorder policies", "Reduce shortages and excessive purchasing"],
  ["Expiry monitoring", "Reduce losses from expired products"],
  ["Inventory-to-GL reconciliation", "Keep stock valuation and the ledger consistent"],
  ["Historical audit trails", "Maintain evidence of activities and approvals"],
  ["Period locking", "Prevent unauthorised historical adjustments"],
];

export default function InventoryPage() {
  return (
    <div className="lp-site bg-lp-canvas text-lp-body">
      <LandingHeader hrefPrefix="/" />

      {/* heading */}
      <section className="relative overflow-hidden bg-[radial-gradient(ellipse_70%_90%_at_100%_0%,var(--lp-glow-a)_0%,var(--lp-glow-b)_45%,transparent_80%)]">
        <Watermark showTile={false} className="left-1/2 top-0 hidden w-320 -translate-x-1/2 text-(--lp-map) lg:block" />
        <Container className="relative pb-14 pt-14">
          <div className="relative z-10">
            <Link
              href="/handles"
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-lp-muted transition-colors hover:text-lp-ink"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Her task &amp; our products
            </Link>
            <H2 className="mt-7">
              Know what you have. <Serif className="text-[32px] sm:text-[40px]">Know what it costs.</Serif>
            </H2>
            <p className="mt-4 max-w-3xl text-[16px] leading-[1.65] text-lp-body">
              The inventory module runs the whole life of a product — creating records, organising warehouses, receiving
              goods, tracking movements, managing production, controlling costs and analysing performance. Inventory is
              not just how many you have: it is where they are, what they cost, how fast they sell, when they expire and
              when to reorder.
            </p>
            <p className="mt-3 max-w-3xl text-[16px] font-medium leading-[1.65] text-lp-ink">
              Because inventory sits inside the same system as purchasing, sales, manufacturing, retail and accounting,
              the physical stock and its financial value stay in step.
            </p>
          </div>
        </Container>
      </section>

      {/* the lifecycle */}
      <section className="border-y border-lp-line bg-lp-alt">
        <Container className="py-12">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.2em] text-lp-muted">
            The {AI} inventory lifecycle
          </h2>
          <Flow steps={lifecycle} />
          <Note>
            The guide below uses the supplied {AI} functionality as its foundation, with illustrative examples and
            recommended operational controls.
          </Note>
        </Container>
      </section>

      {/* the 23 functions */}
      <section>
        <Container className="pb-20 pt-14">
          <div className="mx-auto max-w-4xl">
            <PartHeading title="Inventory dashboard & product configuration" />

            <Fn id="dashboard" title="Inventory dashboard — the central view">
              <P>
                A single overview of the inventory position, valuation, stock movements, warehouse performance and
                whatever needs attention — so owners, warehouse managers, accountants and buyers do not have to compile
                reports by hand.
              </P>
              <Caption>Inventory overview — all warehouses, November 2026</Caption>
              <div className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                {dashboard.map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-lp-line bg-lp-card px-4 py-3.5">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-lp-muted">{label}</p>
                    <p className="mt-1 text-[20px] font-semibold tracking-[-0.03em] text-lp-ink">{value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-2.5 rounded-xl border border-needs-human/30 bg-needs-human/6 px-5 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-needs-human">Inventory alerts</p>
                <ul className="mt-2.5 grid gap-1.5 text-[13.5px] text-lp-body sm:grid-cols-2">
                  {alerts.map((a) => (
                    <li key={a} className="flex gap-2">
                      <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-needs-human" strokeWidth={2} />
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
              <Note>Illustrative {AI} dashboard, not live inventory data.</Note>
              <AiNote>
                {AI} can analyse stock trends, spot unusual movements, highlight shortages and send management a daily
                inventory summary.
              </AiNote>
            </Fn>

            <Fn id="products" title="Products — goods & services">
              <P>
                A central database for everything bought, sold, manufactured or distributed. Each product record is the
                reference point across inventory, purchasing, sales, manufacturing and accounting — physical goods,
                services, raw materials, finished goods, consumables and components.
              </P>
              <Caption>Example — a product record</Caption>
              <div className="mt-3 flex flex-col gap-5 rounded-xl border border-lp-line bg-lp-card p-5 sm:flex-row">
                <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-lg bg-lp-alt sm:w-56">
                  <Image
                    src="/inventory/product-laptop.jpg"
                    alt="A business laptop, open, seen from the front"
                    fill
                    sizes="(min-width: 640px) 224px, 90vw"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-[15px] font-semibold tracking-[-0.02em] text-lp-ink">
                      Business laptop — 16GB RAM
                    </span>
                    <span className="rounded-full bg-ai-done/12 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-ai-done">
                      Active
                    </span>
                  </div>
                  <p className="mt-1 text-[13px] text-lp-muted">SKU IT-LAP-001 · Computers &amp; IT equipment</p>
                  <dl className="mt-4 grid gap-x-8 gap-y-2 text-[13.5px] sm:grid-cols-2">
                    {[
                      ["Purchase cost", "$700"],
                      ["Selling price", "$1,000"],
                      ["Stock on hand", "250 units"],
                      ["Inventory value", "$175,000"],
                      ["Unit of measure", "Each"],
                      ["Barcode", "8901234567890"],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-4 border-b border-lp-line pb-1.5 last:border-b-0">
                        <dt className="text-lp-muted">{k}</dt>
                        <dd className="font-medium text-lp-ink">{v}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
              <Note>
                A product record can carry its description, SKU, barcode, category, prices, taxes, inventory accounts,
                tracking requirements and reorder policies. Service products — consultancy, support — do not normally
                create stock movements.
              </Note>
              <AiNote>
                She can draft product descriptions, find duplicate SKUs, suggest classifications, analyse pricing and
                flag products whose profitability is slipping.
              </AiNote>
            </Fn>

            <Fn id="categories" title="Product categories — the classification hierarchy">
              <P>
                Categories group products into a hierarchy, which makes a large catalogue manageable and supports
                reporting by group, category purchasing policies, valuation analysis and profitability comparisons.
              </P>
              <Caption>Example — category hierarchy</Caption>
              <div className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                {categories.map(([group, children]) => (
                  <div key={group} className="rounded-xl border border-lp-line bg-lp-card px-4 py-3.5">
                    <p className="text-[14px] font-semibold tracking-[-0.02em] text-lp-ink">{group}</p>
                    <ul className="mt-2 space-y-1 text-[13px] text-lp-muted">
                      {children.map((c) => (
                        <li key={c}>{c}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <AiNote>
                {AI} can recommend a category for a new product and point out inconsistent classifications.
              </AiNote>
            </Fn>

            <Fn id="attributes" title="Product attributes — variants">
              <P>
                Attributes define what separates variations of the same product — colour, size, material, capacity,
                weight, style — so variants live under one product instead of as unrelated records.
              </P>
              <Caption>Example — classic t-shirt</Caption>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {shirts.map(([colour, src, alt]) => (
                  <figure key={colour} className="overflow-hidden rounded-xl border border-lp-line bg-lp-card">
                    <div className="relative aspect-[4/3] bg-lp-alt">
                      <Image src={src} alt={alt} fill sizes="(min-width: 640px) 30vw, 90vw" className="object-cover" />
                    </div>
                    <figcaption className="px-4 py-3 text-[13.5px] font-medium text-lp-ink">{colour}</figcaption>
                  </figure>
                ))}
              </div>
              <Figures
                items={[
                  ["Attribute: colour", "3 values"],
                  ["Attribute: size", "S · M · L · XL"],
                  ["Possible variants", "12"],
                ]}
              />
              <Note>
                Each variant can carry its own SKU, barcode, quantity, purchase price and selling price where supported.
              </Note>
              <AiNote>
                She can recommend attributes, analyse which variants sell fastest, and identify the sizes or colours
                building up excess stock.
              </AiNote>
            </Fn>

            <Fn id="uom" title="Unit of measure — how stock is counted">
              <P>
                A unit of measure defines how a product is purchased, stored, consumed or sold. Different industries
                need different units and different decimal precision.
              </P>
              <DataTable
                head={["Unit", "Classification", "Example precision"]}
                rows={[
                  ["Each", "Quantity", "0"],
                  ["Box", "Packaging", "0"],
                  ["Dozen", "Quantity", "0"],
                  ["Kilogram", "Weight", "3"],
                  ["Gram", "Weight", "2"],
                  ["Litre", "Volume", "3"],
                  ["Metre", "Length", "3"],
                  ["Square metre", "Area", "2"],
                  ["Hour", "Service time", "2"],
                ]}
              />
              <Example>
                One carton is the purchasing unit; with a conversion factor of 12, it becomes 12 individual units for
                stock and sale.
              </Example>
              <AiNote>
                {AI} can find inconsistent units, detect conversion errors and flag invalid decimal quantities.
              </AiNote>
            </Fn>

            <PartHeading title="Warehouse & physical inventory management" />

            <Fn id="warehouses" title="Warehouses — running more than one">
              <P>
                Each warehouse keeps its own quantities, valuation and transaction history — which matters for
                retailers, manufacturers, distributors, logistics companies and multinationals.
              </P>
              <Caption>Example — a multinational structure</Caption>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {warehouses.map((w) => (
                  <figure key={w.name} className="overflow-hidden rounded-xl border border-lp-line bg-lp-card">
                    <div className="relative aspect-[3/2] bg-lp-alt">
                      <Image src={w.src} alt={w.alt} fill sizes="(min-width: 640px) 30vw, 90vw" className="object-cover" />
                    </div>
                    <figcaption className="px-4 pb-4 pt-3">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-lp-muted">{w.country}</p>
                      <p className="mt-0.5 text-[14px] font-semibold tracking-[-0.02em] text-lp-ink">{w.name}</p>
                      <p className="mt-0.5 text-[15px] font-semibold text-lp-brand">{w.value}</p>
                    </figcaption>
                  </figure>
                ))}
              </div>
              <Note>
                Illustrative warehouses within one inventory structure, valued in a common reporting currency. A
                warehouse carries its code, address, responsible manager, storage locations, status and inventory
                account mappings.
              </Note>
              <AiNote>
                {AI} can compare warehouse performance, find shortages across locations and recommend redistribution.
              </AiNote>
            </Fn>

            <Fn id="bins" title="Bins and locations — inside the warehouse">
              <P>
                Bins and locations are named storage positions — an aisle, rack, shelf, compartment or area — so staff
                know exactly where a product sits instead of searching the building.
              </P>
              <div className="mt-4 flex flex-wrap items-center gap-4 rounded-xl border border-lp-line bg-lp-card px-5 py-4">
                <span className="rounded-lg bg-lp-alt px-3 py-2 text-[14px] font-semibold text-lp-ink">Bin A-01</span>
                <ArrowRightLeft className="h-4 w-4 text-lp-brand" strokeWidth={2} />
                <span className="rounded-lg bg-lp-alt px-3 py-2 text-[14px] font-semibold text-lp-ink">Bin C-03</span>
                <span className="text-[13.5px] text-lp-muted">50 units moved within the same warehouse</span>
              </div>
              <Warning>
                Moving products between bins in one warehouse is a physical movement only. It does not change
                warehouse-level valuation and creates no general ledger posting.
              </Warning>
              <AiNote>
                She can recommend storage locations, identify misplaced stock and help shorten picking routes.
              </AiNote>
            </Fn>

            <Fn id="scrap" title="Scrap — damaged, expired or lost stock">
              <P>
                Scrap writes inventory out when it is damaged, expired, defective, lost or otherwise unusable. Every
                transaction records the product, quantity, warehouse, reason, reference and the person responsible, and
                is valued at average cost.
              </P>
              <Caption>Example — damaged inventory</Caption>
              <div className="mt-3 flex flex-col gap-5 rounded-xl border border-lp-line bg-lp-card p-5 sm:flex-row">
                <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-lg bg-lp-alt sm:w-48">
                  <Image
                    src="/inventory/scrap-damaged.jpg"
                    alt="A damaged carton being inspected in a warehouse"
                    fill
                    sizes="(min-width: 640px) 192px, 90vw"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] text-lp-body">10 damaged products found during a warehouse inspection.</p>
                  <Figures
                    items={[
                      ["Quantity scrapped", "10 units"],
                      ["Average unit cost", "$50"],
                      ["Stock after scrap", "490 units"],
                      ["Inventory loss", "$500"],
                    ]}
                  />
                </div>
              </div>
              <Caption>Automatic accounting entry</Caption>
              <Ledger
                rows={[
                  ["Inventory scrap / loss expense", "$500", "—"],
                  ["Inventory", "—", "$500"],
                ]}
              />
              <Note>
                Common reasons: expiry, theft, accidental damage, manufacturing defects, obsolescence and handling
                errors.
              </Note>
              <AiNote>
                {AI} can identify recurring scrap patterns, total losses by warehouse or product, and highlight unusual
                write-offs for review.
              </AiNote>
            </Fn>

            <Fn id="stock-history" title="Stock history — till adjustments & approvals">
              <P>
                An audit trail of stock corrections, new product requests and scrap raised at point-of-sale tills: who
                asked, when, why, and who approved or rejected it. It matters wherever retail staff can touch inventory
                through Retail Xpress.
              </P>
              <Flow
                steps={[
                  ["Till operator raises a request", "Stock correction · New product · Scrap"],
                  ["Recorded in stock history", "Operator · Till · Date · Reason · Quantity"],
                  ["Manager reviews it", "Verify the information and the inventory impact"],
                  ["Approved or rejected", "Apply the adjustment, or keep the rejection on record"],
                ]}
              />
              <DataTable
                head={["Request", "Raised by", "Reviewed by", "Status"]}
                rows={[
                  ["Stock correction +5", "Till operator 01", "Store manager", <Status key="a" kind="ok">Approved</Status>],
                  ["New product request", "Till operator 03", "Product manager", <Status key="b" kind="wait">Pending</Status>],
                  ["Scrap 10 units", "Till operator 02", "Store manager", <Status key="c" kind="ok">Approved</Status>],
                  ["Stock correction −20", "Till operator 04", "Store manager", <Status key="d" kind="no">Rejected</Status>],
                ]}
              />
              <AiNote>
                She can spot repeated corrections from one till, analyse unusual adjustment patterns and flag activity
                worth investigating.
              </AiNote>
            </Fn>

            <PartHeading title="Barcode operations & quality management" />

            <Fn id="scan-station" title="Scan station — barcode-driven operations">
              <P>
                One interface for warehouse work with a barcode scanner, or a typed barcode or SKU: receiving, picking
                and cycle counting. Scan or type, press Enter, and the product is identified.
              </P>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {scanning.map((s) => (
                  <figure key={s.title} className="overflow-hidden rounded-xl border border-lp-line bg-lp-card">
                    <div className="relative aspect-[3/2] bg-lp-alt">
                      <Image src={s.src} alt={s.alt} fill sizes="(min-width: 640px) 30vw, 90vw" className="object-cover" />
                    </div>
                    <figcaption className="px-4 pb-4 pt-3">
                      <p className="text-[14px] font-semibold tracking-[-0.02em] text-lp-ink">{s.title}</p>
                      <p className="mt-1 text-[13px] leading-[1.5] text-lp-muted">{s.text}</p>
                    </figcaption>
                  </figure>
                ))}
              </div>
              <Note>
                Barcode operations cut manual entry and improve both the speed and the accuracy of warehouse work.
              </Note>
              <AiNote>
                {AI} can identify repeated scanning errors, suggest matches for unrecognised products and analyse
                processing efficiency.
              </AiNote>
            </Fn>

            <Fn id="quality" title="Quality — inventory quality control">
              <P>
                Quality control points attach to goods receipts, production and stock transfers. When a matching event
                happens, a pending quality check is created automatically; failures join the quality alert queue.
              </P>
              <Flow
                steps={[
                  ["A matching event occurs", "Goods receipt · Production · Stock transfer"],
                  ["A quality check is raised", "Quantity · Condition · Specifications · Test results"],
                  ["Passed, or failed", "Release the goods, or add them to the alert queue"],
                ]}
              />
              <Example>
                A pharmaceutical distributor sets checks for expiry dates, packaging condition, temperature compliance
                and batch identification on every goods receipt.
              </Example>
              <AiNote>
                She can analyse quality failures, identify underperforming suppliers, detect recurring defects and
                recommend corrective action.
              </AiNote>
            </Fn>

            <PartHeading title="Inventory balances & stock movements" />

            <Fn id="stock-balances" title="Stock balances — what is available now">
              <P>
                The current quantity of every product across warehouses and locations, so purchasing, sales and
                operations can tell whether there is enough stock to meet demand.
              </P>
              <DataTable
                head={["Product", "Warehouse", "On hand", "Reserved", "Available"]}
                rows={[
                  ["Laptops", "Ottawa", "250", "50", "200"],
                  ["Monitors", "Toronto", "400", "100", "300"],
                  ["Printers", "Dublin", "120", "20", "100"],
                  ["Routers", "Lagos", "500", "150", "350"],
                ]}
              />
              <Caption>Availability by product</Caption>
              <ul className="mt-3 space-y-3">
                {availability.map(([product, available, reserved]) => {
                  const total = available + reserved;
                  return (
                    <li key={product}>
                      <div className="flex items-baseline justify-between text-[13.5px]">
                        <span className="font-medium text-lp-ink">{product}</span>
                        <span className="text-lp-muted">
                          {available} available · {reserved} reserved
                        </span>
                      </div>
                      <div className="mt-1 flex h-2 overflow-hidden rounded-full bg-lp-alt">
                        <div style={{ width: `${(available / total) * 100}%`, backgroundColor: CHART.green }} />
                        <div style={{ width: `${(reserved / total) * 100}%`, backgroundColor: CHART.amber }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
              <Note>
                Availability may also have to account for quarantined goods, pending transactions and other
                restrictions.
              </Note>
              <AiNote>
                {AI} can identify products approaching a stockout, compare availability with outstanding sales orders
                and recommend replenishment.
              </AiNote>
            </Fn>

            <Fn id="stock-transfers" title="Stock transfers — between warehouses">
              <P>
                Transfers move stock between warehouses without treating it as a purchase or a sale. The record holds
                the source, the destination, the products, the quantities, the dates and the status.
              </P>
              <Caption>Example — Ottawa to Toronto</Caption>
              <div className="mt-3 grid items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
                <div className="rounded-xl border border-lp-line bg-lp-card px-4 py-3.5">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-lp-muted">Ottawa · source</p>
                  <p className="mt-1 text-[18px] font-semibold tracking-[-0.02em] text-lp-ink">500 → 350</p>
                </div>
                <div className="flex items-center justify-center gap-2 text-lp-brand">
                  <ArrowRight className="h-4 w-4" />
                  <span className="text-[13px] font-semibold">150 units</span>
                </div>
                <div className="rounded-xl border border-lp-line bg-lp-card px-4 py-3.5">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-lp-muted">Toronto · destination</p>
                  <p className="mt-1 text-[18px] font-semibold tracking-[-0.02em] text-lp-ink">200 → 350</p>
                </div>
              </div>
              <P small>Total company stock before the transfer: 700 units. After it: 700 units.</P>
              <Note>
                A completed transfer within one legal entity does not normally create revenue or profit. Where
                warehouses use separate inventory accounts a reclassification may be needed, and goods in transit may
                need tracking of their own. Transfers between legal entities need intercompany accounting and tax
                treatment.
              </Note>
              <AiNote>
                She can recommend transfers from stock levels, demand, warehouse capacity and replenishment needs.
              </AiNote>
            </Fn>

            <Fn id="stock-journal" title="Stock journal — consumption & production">
              <P>
                The stock journal records inventory consumed and inventory produced, with valuation and ledger posting
                handled automatically — for manufacturing, assembly, repackaging, conversion and internal consumption.
              </P>
              <Caption>Example — assembling a computer</Caption>
              <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
                {components.map(([name, cost, src]) => (
                  <figure key={name} className="overflow-hidden rounded-xl border border-lp-line bg-lp-card">
                    <div className="relative aspect-square bg-lp-alt">
                      <Image src={src} alt={name} fill sizes="(min-width: 1024px) 15vw, 45vw" className="object-cover" />
                    </div>
                    <figcaption className="px-3 pb-3 pt-2">
                      <p className="text-[12.5px] font-medium text-lp-ink">{name}</p>
                      <p className="text-[12.5px] text-lp-muted">{cost}</p>
                    </figcaption>
                  </figure>
                ))}
              </div>
              <div className="mt-3 flex flex-col gap-4 rounded-xl border border-lp-brand/30 bg-lp-brand/6 p-4 sm:flex-row sm:items-center">
                <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-lg bg-lp-alt sm:w-40">
                  <Image
                    src="/inventory/finished-computer.jpg"
                    alt="An assembled desktop computer"
                    fill
                    sizes="(min-width: 640px) 160px, 90vw"
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="text-[14px] font-semibold tracking-[-0.02em] text-lp-ink">
                    Consume $700 of raw materials, produce one finished computer
                  </p>
                  <p className="mt-1 text-[13.5px] text-lp-body">$700 of finished goods material value.</p>
                </div>
              </div>
              <Caption>Automatic accounting entry</Caption>
              <Ledger
                rows={[
                  ["Finished goods inventory", "$700", "—"],
                  ["Raw materials inventory", "—", "$700"],
                ]}
              />
              <Note>Production labour and manufacturing overheads may also be allocated to finished goods.</Note>
              <AiNote>
                {AI} can flag unusual consumption, analyse production yields, detect wastage and compare actual
                production costs with expected ones.
              </AiNote>
            </Fn>

            <PartHeading title="Replenishment & reconciliation" />

            <Fn id="reorder-rules" title="Reorder rules — automated replenishment">
              <P>
                Reorder rules set when and how much to replenish: minimum and maximum levels, safety stock, supplier
                lead times and reorder quantities. The point is enough stock to meet demand without tying up working
                capital.
              </P>
              <Figures
                items={[
                  ["Calculated reorder point", "190 units"],
                  ["Recommended replenishment", "340 units"],
                  ["Status", "Replenishment required"],
                ]}
              />
              <Note>
                The reorder point is expected demand over the supplier lead time, plus safety stock. This simplified
                example assumes no outstanding purchase orders, backorders or reservations.
              </Note>
              <AiNote>
                She can read historical sales, seasonal demand, supplier delivery patterns and current stock to
                recommend better policies.
              </AiNote>
            </Fn>

            <Fn id="reconciliations" title="Stock reconciliations — counting what is there">
              <P>
                Reconciliation compares the physical count with the recorded quantity, surfaces the differences and
                lets authorised users investigate and approve the adjustments.
              </P>
              <Flow
                steps={[
                  ["Generate the count", "Warehouse, products and count date"],
                  ["Count physically", "Enter quantities, or use the scan station"],
                  ["Compare", "Differences and their financial impact"],
                  ["Investigate", "Missing transactions · Damage · Counting errors"],
                  ["Approve adjustments", "Update stock and post the entries"],
                ]}
              />
              <Caption>Example — count results</Caption>
              <DataTable
                head={["Product", "System", "Physical", "Variance", "Value"]}
                rows={[
                  ["Laptops", "100", "98", "−2", "−$1,400"],
                  ["Monitors", "200", "205", "+5", "+$1,000"],
                  ["Routers", "500", "495", "−5", "−$250"],
                  [
                    <b key="n" className="font-semibold text-lp-ink">Net adjustment</b>,
                    "",
                    "",
                    "",
                    <b key="v" className="font-semibold text-lp-ink">−$650</b>,
                  ],
                ]}
              />
              <Warning>
                Investigate negative and positive differences individually rather than offsetting them without
                explanation.
              </Warning>
              <AiNote>
                {AI} can identify unusual discrepancies, recommend recounts, analyse past adjustments and prepare the
                report for approval.
              </AiNote>
            </Fn>

            <Fn id="stock-ledger" title="Stock ledger — the transaction history">
              <P>
                A chronological record of every movement, showing exactly how the opening quantity and value became the
                closing position: receipts, deliveries, transfers, returns, production, scrap, adjustments and landed
                costs.
              </P>
              <Caption>Example — one product&rsquo;s ledger</Caption>
              <DataTable
                head={["Date", "Transaction", "In", "Out", "Balance"]}
                rows={ledgerRows.map(([d, t, i, o, b]) => [d, t, i, o, String(b)])}
              />
              <BalanceChart rows={ledgerRows} />
              <Note>
                The ledger should link each transaction to its originating document, unit costs, valuation changes and
                general ledger entries.
              </Note>
              <AiNote>
                She can explain unexpected stock changes, trace discrepancies to the transaction that caused them and
                investigate differences between the subledger and the general ledger.
              </AiNote>
            </Fn>

            <Fn id="stock-ageing" title="Stock ageing — what is not moving">
              <P>
                Ageing measures on-hand value by the days since the last qualifying movement, which is how slow-moving,
                inactive and potentially obsolete stock shows itself.
              </P>
              <Caption>Inventory ageing — total value $485,000</Caption>
              <AgeingChart />
              <div className="mt-4 rounded-xl border border-needs-human/30 bg-needs-human/6 px-4 py-3 text-[13.5px] text-lp-body">
                <b className="font-semibold text-lp-ink">$42,500</b> has been inactive for over 180 days — 8.76% of
                total inventory value. Management can weigh promotions, transfers, purchasing restrictions, supplier
                returns or a write-down.
              </div>
              <Note>Ageing by last movement is not the same as the original acquisition age of the stock.</Note>
              <AiNote>
                {AI} can recommend ways to reduce excess stock, identify what is tying up working capital and highlight
                obsolescence risk.
              </AiNote>
            </Fn>

            <PartHeading title="Traceability & manufacturing" />

            <Fn id="batches" title="Product batches — batch, lot & expiry">
              <P>
                Batches track groups of products by batch or lot number, each with its manufacturing date, receipt date,
                expiry date, supplier reference and quantity — essential for pharmaceuticals, healthcare, food,
                beverages, chemicals and manufacturing.
              </P>
              <Caption>Example — vitamin supplements</Caption>
              <div className="mt-3 flex flex-col gap-5 rounded-xl border border-lp-line bg-lp-card p-5 sm:flex-row">
                <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-lg bg-lp-alt sm:w-44">
                  <Image
                    src="/inventory/batch-label.jpg"
                    alt="A batch code printed on product packaging"
                    fill
                    sizes="(min-width: 640px) 176px, 90vw"
                    className="object-cover"
                  />
                </div>
                <ul className="min-w-0 flex-1 space-y-2">
                  {[
                    ["LOT-2026-001", "Expiry 30 November 2026", "200 units", true],
                    ["LOT-2026-002", "Expiry 31 March 2027", "350 units", false],
                    ["LOT-2026-003", "Expiry 30 June 2027", "500 units", false],
                  ].map(([lot, expiry, qty, soon]) => (
                    <li
                      key={lot as string}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-lp-alt px-3.5 py-2.5"
                    >
                      <span className="text-[13.5px] font-semibold text-lp-ink">{lot}</span>
                      <span className="text-[13px] text-lp-muted">{expiry}</span>
                      <span className="text-[13px] text-lp-body">{qty}</span>
                      <Status kind={soon ? "wait" : "ok"}>{soon ? "Expiring soon" : "Valid"}</Status>
                    </li>
                  ))}
                </ul>
              </div>
              <Note>
                Illustrative batch status as at 21 November 2026. Batches support recalls, expiry monitoring, supplier
                traceability, inspections and first-expiry-first-out picking.
              </Note>
              <AiNote>
                {AI} can identify batches nearing expiry, prioritise the eligible ones for sale, recommend
                redistribution and prepare recall traceability reports.
              </AiNote>
            </Fn>

            <Fn id="serials" title="Serial numbers — tracking one unit">
              <P>
                Serial tracking gives every individual unit its own identifier, where batch tracking gives one
                identifier to a group. It suits computers, phones, vehicles, jewellery, machinery, medical devices and
                other high-value equipment.
              </P>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  ["Batch tracking", "/inventory/batch-pills.jpg", "Bottles of pills on a white background", "100 products · LOT-001", "One shared identifier for a group of units."],
                  ["Serial tracking", "/inventory/serial-phone.jpg", "A mobile phone, front and back", "3 products · SN-001 · SN-002 · SN-003", "One unique identifier per unit."],
                ].map(([title, src, alt, ids, text]) => (
                  <figure key={title} className="overflow-hidden rounded-xl border border-lp-line bg-lp-card">
                    <div className="relative aspect-[5/3] bg-lp-alt">
                      <Image src={src} alt={alt} fill sizes="(min-width: 640px) 45vw, 90vw" className="object-cover" />
                    </div>
                    <figcaption className="px-4 pb-4 pt-3">
                      <p className="text-[14px] font-semibold tracking-[-0.02em] text-lp-ink">{title}</p>
                      <p className="mt-1 text-[13px] text-lp-brand">{ids}</p>
                      <p className="mt-1 text-[13px] leading-[1.5] text-lp-muted">{text}</p>
                    </figcaption>
                  </figure>
                ))}
              </div>
              <DataTable
                head={["Serial number", "Product", "Status"]}
                rows={[
                  ["SN-LAP-0001", "Business laptop", <Status key="1" kind="ok">In stock</Status>],
                  ["SN-LAP-0002", "Business laptop", <Status key="2" kind="wait">Sold</Status>],
                  ["SN-LAP-0003", "Business laptop", <Status key="3" kind="wait">Under warranty</Status>],
                  ["SN-LAP-0004", "Business laptop", <Status key="4" kind="no">Returned</Status>],
                ]}
              />
              <AiNote>
                She can detect duplicate serials, trace a unit&rsquo;s movements, identify missing units and support
                warranty and return investigations.
              </AiNote>
            </Fn>

            <Fn id="bom" title="BOM — bill of materials">
              <P>
                A bill of materials is the recipe: the raw materials, components and quantities needed to make a
                finished product. It standardises production and estimates manufacturing cost — for factories,
                restaurants, bakeries, construction, furniture and assembly.
              </P>
              <Caption>Example — a wooden office desk</Caption>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {bom.map(([name, cost, src]) => (
                  <figure key={name} className="overflow-hidden rounded-xl border border-lp-line bg-lp-card">
                    <div className="relative aspect-[4/3] bg-lp-alt">
                      <Image src={src} alt={name} fill sizes="(min-width: 640px) 30vw, 90vw" className="object-cover" />
                    </div>
                    <figcaption className="flex items-baseline justify-between px-4 py-3">
                      <span className="text-[13.5px] font-medium text-lp-ink">{name}</span>
                      <span className="text-[13.5px] text-lp-muted">{cost}</span>
                    </figcaption>
                  </figure>
                ))}
              </div>
              <div className="mt-3 flex flex-col gap-4 rounded-xl border border-lp-brand/30 bg-lp-brand/6 p-4 sm:flex-row sm:items-center">
                <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-lg bg-lp-alt sm:w-40">
                  <Image
                    src="/inventory/desk-finished.jpg"
                    alt="An assembled wooden office desk"
                    fill
                    sizes="(min-width: 640px) 160px, 90vw"
                    className="object-cover"
                  />
                </div>
                <p className="text-[14px] font-semibold tracking-[-0.02em] text-lp-ink">
                  One finished office desk — $200 of materials
                </p>
              </div>
              <Caption>Example — a production run of 50 desks</Caption>
              <DataTable
                head={["Component", "Required quantity", "Cost"]}
                rows={[
                  ["Wooden tops", "50", "$4,000"],
                  ["Metal legs", "200", "$5,000"],
                  ["Fittings kits", "50", "$1,000"],
                  [
                    <b key="t" className="font-semibold text-lp-ink">Total material cost</b>,
                    "",
                    <b key="v" className="font-semibold text-lp-ink">$10,000</b>,
                  ],
                ]}
              />
              <Note>
                Excludes labour, overheads and wastage. The BOM says what should be consumed; the stock journal records
                what actually was.
              </Note>
              <AiNote>
                {AI} can compare expected against actual consumption, identify expensive components, calculate
                production requirements and point out waste worth removing.
              </AiNote>
            </Fn>

            <PartHeading title="Costing & valuation" />

            <Fn id="landed-costs" title="Landed costs — what the stock really cost">
              <P>
                Landed costs are everything else it took to get the goods here: freight, customs duties, non-recoverable
                import taxes, insurance, handling and clearing fees. Allocated to the receipt, they raise the inventory
                value to the true acquisition cost.
              </P>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {landed.map((step) => (
                  <figure key={step.title} className="overflow-hidden rounded-xl border border-lp-line bg-lp-card">
                    <div className="relative aspect-[3/2] bg-lp-alt">
                      <Image
                        src={step.src}
                        alt={step.alt}
                        fill
                        sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 90vw"
                        className="object-cover"
                      />
                    </div>
                    <figcaption className="px-4 pb-4 pt-3">
                      <p className="text-[14px] font-semibold tracking-[-0.02em] text-lp-ink">{step.title}</p>
                      <p className="mt-1 text-[13px] leading-[1.5] text-lp-muted">{step.text}</p>
                    </figcaption>
                  </figure>
                ))}
              </div>
              <Caption>Example — 100 units bought for $10,000</Caption>
              <Figures
                items={[
                  ["Original unit cost", "$100.00"],
                  ["Additional costs", "$3,000.00"],
                  ["Total landed cost", "$13,000.00"],
                  ["Landed cost per unit", "$130.00"],
                ]}
              />
              <P small>An increase of 30% over the original purchase cost.</P>
              <Caption>Example accounting entry</Caption>
              <Ledger
                rows={[
                  ["Inventory", "$3,000", "—"],
                  ["Accounts payable / landed cost clearing", "—", "$3,000"],
                ]}
              />
              <Note>
                Allocation can be by quantity, value, weight, volume or another basis. Recoverable VAT or GST does not
                normally form part of acquisition cost, and where the goods are already sold the adjustment may belong
                in cost of sales rather than inventory.
              </Note>
              <AiNote>
                She can analyse actual import costs, recommend an allocation method, find missing charges and calculate
                product profitability properly.
              </AiNote>
            </Fn>

            <PartHeading title="Inventory intelligence" />

            <Fn id="intelligence" title="Inventory intelligence — AI-powered analytics">
              <P>
                Traditional inventory software tells you what you have in stock. Intelligent inventory software helps
                you work out what to do with it — analysing performance, identifying risk, forecasting demand and
                preparing recommendations from your own data.
              </P>
              <div className="mt-4 space-y-2.5">
                {insights.map(([title, text, action]) => (
                  <div key={title} className="rounded-xl border border-lp-line bg-lp-card px-5 py-4">
                    <p className="text-[14px] font-semibold tracking-[-0.02em] text-lp-ink">{title}</p>
                    <p className="mt-1 text-[13.5px] leading-[1.6] text-lp-body">{text}</p>
                    <p className="mt-2 text-[13px] text-lp-brand">
                      <b className="font-semibold">Recommended:</b> {action}
                    </p>
                  </div>
                ))}
              </div>
              <Note>
                She can also read historical sales, seasonal patterns, product popularity, promotions and supplier lead
                times to estimate future requirements. Forecasts are uncertain and depend on the quality of the history
                behind them.
              </Note>
            </Fn>
          </div>
        </Container>
      </section>

      {/* performance indicators */}
      <section className="border-y border-lp-line bg-lp-alt">
        <Container className="py-16">
          <Kicker>Inventory performance indicators</Kicker>
          <H2>How inventory efficiency gets measured.</H2>
          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
            <DataTable head={["Indicator", "Definition"]} rows={kpis.map(([k, v]) => [k, v])} />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-lp-muted">
                Worked example
              </p>
              <div className="mt-3 space-y-2">
                {[
                  ["Average inventory investment", "$442,500.00"],
                  ["Inventory turnover", "6.00×"],
                  ["Days inventory outstanding", "60.8 days"],
                  ["Gross profit margin", "33.63%"],
                  ["GMROI", "$3.04"],
                ].map(([k, v]) => (
                  <div
                    key={k}
                    className="flex items-baseline justify-between gap-4 rounded-xl border border-lp-line bg-lp-card px-4 py-3"
                  >
                    <span className="text-[13.5px] text-lp-body">{k}</span>
                    <span className="text-[15px] font-semibold tracking-[-0.02em] text-lp-ink">{v}</span>
                  </div>
                ))}
              </div>
              <Note>Annual gross profit generated per dollar of average inventory investment.</Note>
            </div>
          </div>
        </Container>
      </section>

      {/* accounting integration */}
      <section>
        <Container className="py-16">
          <Kicker>Inventory and the ledger</Kicker>
          <H2>Physical movements, posted as they happen.</H2>
          <p className="mt-4 max-w-3xl text-[15px] leading-[1.65] text-lp-body">
            No separate inventory records to keep, and no manual working out of the financial impact at period end.
            Receipts, deliveries, journals, scrap, landed costs and transfers run through the valuation engine, and
            whatever needs posting reaches the general ledger — the balance sheet for inventory assets, the profit and
            loss for cost of sales and stock losses.
          </p>
          <div className="mt-8 max-w-4xl">
            <DataTable head={["Inventory transaction", "Debit", "Credit"]} rows={matrix.map((r) => [...r])} />
          </div>
          <Note>
            These illustrate perpetual inventory accounting. Actual postings depend on timing, the legal entity,
            valuation methods, account mappings and accounting policy.
          </Note>
        </Container>
      </section>

      {/* agentic AI */}
      <section className="border-y border-lp-line bg-lp-alt">
        <Container className="py-16">
          <Kicker>Agentic AI inventory commands</Kicker>
          <H2>
            You ask. She understands. <Serif className="text-[32px] sm:text-[40px]">She delivers.</Serif>
          </H2>
          <div className="mt-8">
            <DataTable
              head={[`What you ask ${AI}`, "What she can prepare or perform"]}
              rows={asks.map(([q, a]) => [
                <span key={q} className="font-medium text-lp-ink">
                  &ldquo;{q}&rdquo;
                </span>,
                a,
              ])}
            />
          </div>

          <Caption>Example — an agentic inventory workflow</Caption>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            <div className="rounded-2xl border border-lp-line bg-lp-card px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-lp-muted">Business owner</p>
              <p className="mt-2.5 flex gap-2.5 text-[14.5px] leading-[1.6] text-lp-ink">
                <Quote className="mt-1 h-3.5 w-3.5 shrink-0 text-lp-muted/60" strokeWidth={2} />
                <span>
                  {AI}, review inventory across all six warehouses. Identify products running out, slow-moving
                  products, expired inventory, unusual stock corrections, and ways to free up the money tied up in
                  stock.
                </span>
              </p>
            </div>
            <div className="rounded-2xl border border-lp-brand/30 bg-lp-brand/6 px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-lp-brand">{AI}</p>
              <p className="mt-2.5 text-[14.5px] leading-[1.6] text-lp-ink">
                I&rsquo;ve been through your inventory records, warehouse balances, recent sales, purchasing history and
                product movements.
              </p>
              <ul className="mt-3 space-y-1.5 text-[13.5px] leading-[1.5] text-lp-body">
                {[
                  "Analysed 2,450 active products across six warehouses",
                  "38 products below their reorder levels, 12 out of stock",
                  "$42,500 in slow-moving inventory",
                  "15 batches approaching expiry",
                  "Five unusual stock adjustments to review",
                  "Three proposed warehouse transfers, and requisitions for the critical products",
                ].map((line) => (
                  <li key={line} className="flex gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ai-done" strokeWidth={2.5} />
                    {line}
                  </li>
                ))}
              </ul>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {[
                  ["Inventory reviewed", "$485,000"],
                  ["Slow-moving stock", "$42,500"],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-lg bg-lp-card px-3 py-2">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-lp-muted">{k}</p>
                    <p className="text-[15px] font-semibold text-lp-ink">{v}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[13.5px] leading-[1.55] text-lp-body">
                Your inventory optimisation plan is ready for review and approval.
              </p>
            </div>
          </div>
          <Note>
            Illustrative interaction. No transfers, purchase orders or financial adjustments have been executed.
          </Note>
        </Container>
      </section>

      {/* integrations + controls */}
      <section>
        <Container className="py-16">
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <Kicker>Integration with the other modules</Kicker>
              <h2 className="mt-3 text-[24px] font-semibold leading-[1.2] tracking-[-0.04em] text-lp-ink">
                One inventory ecosystem.
              </h2>
              <div className="mt-5 space-y-2">
                {integrations.map(([mod, benefit]) => (
                  <div key={mod} className="rounded-xl border border-lp-line bg-lp-card px-4 py-3">
                    <p className="text-[14px] font-semibold tracking-[-0.02em] text-lp-ink">{mod}</p>
                    <p className="mt-0.5 text-[13px] leading-[1.5] text-lp-muted">{benefit}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Kicker>Controls & governance</Kicker>
              <h2 className="mt-3 text-[24px] font-semibold leading-[1.2] tracking-[-0.04em] text-lp-ink">
                Stock is a large investment to leave unguarded.
              </h2>
              <p className="mt-4 text-[14.5px] leading-[1.65] text-lp-body">
                Poor inventory management means losses, theft, excess working capital, unhappy customers and inaccurate
                financial reporting.
              </p>
              <DataTable head={["Control", "Purpose"]} rows={controls.map(([c, p]) => [c, p])} />
            </div>
          </div>
        </Container>
      </section>

      {/* philosophy */}
      <section className="border-y border-lp-line bg-lp-alt">
        <Container className="py-16">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["/inventory/shelves-1.jpg", "A high-bay warehouse with racking to the ceiling"],
              ["/inventory/shelves-2.jpg", "Barcode labels identifying warehouse shelf locations"],
              ["/inventory/shelves-3.jpg", "Pallet racking holding stock in a distribution centre"],
            ].map(([src, alt]) => (
              <div key={src} className="relative aspect-[3/2] overflow-hidden rounded-xl bg-lp-canvas">
                <Image src={src} alt={alt} fill sizes="(min-width: 640px) 30vw, 90vw" className="object-cover" />
              </div>
            ))}
          </div>
          <div className="mx-auto mt-12 max-w-3xl text-center">
            <Kicker>The {AI} inventory philosophy</Kicker>
            <h2 className="mt-4 text-[28px] font-semibold leading-[1.2] tracking-[-0.04em] text-lp-ink sm:text-[34px]">
              Inventory is money sitting on a shelf.
            </h2>
            <p className="mt-5 text-[15px] leading-[1.7] text-lp-body">
              Every product in a warehouse is money the business has already spent. The longer it sits, the longer the
              wait to get that money back — but too little stock costs sales, customers and opportunities. Good
              inventory management is the balance between availability, efficiency, demand and working capital.
            </p>
            <p className="mt-6 font-serif text-[22px] italic leading-[1.4] text-lp-brand">
              &ldquo;Success is not a cost factor, but an efficiency factor.&rdquo;
            </p>
            <p className="mt-6 text-[15px] leading-[1.7] text-lp-body">
              A business does not necessarily need a bigger warehouse, more stock or more staff. It needs accurate
              information, efficient processes and timely decisions. She analyses, spots the opportunities, prepares
              recommendations and handles the authorised repetitive work; management keeps the significant decisions.
            </p>
            <p className="mt-7 text-[18px] font-semibold leading-normal tracking-[-0.02em] text-lp-ink">
              {AI} — Know what you have. Know where it is.{" "}
              <span className="text-lp-brand">Know what to do next.</span>
            </p>
          </div>
        </Container>
      </section>

      {/* final CTA + footer */}
      <div className="relative overflow-hidden bg-lp-navy text-white">
        <Watermark className="-left-10 top-10 hidden w-155 text-white/5 md:block" tile="opacity-25" />
        <section className="relative">
          <Container className="py-24 text-center">
            <TLogo className="mx-auto h-12 w-12" />
            <h2 className="mt-9 text-[34px] font-semibold leading-[1.1] tracking-[-0.045em] sm:text-[42px]">
              Stop running the back office.
              <br />
              <span className="font-serif font-semibold italic tracking-[-0.02em] text-lp-sky">Tell {AI}.</span>
            </h2>
            <div className="mt-8 flex flex-wrap justify-center gap-2.5">
              <Link href="/register" className={btnPrimary}>
                Hire {AI} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link href="/handles" className={cn(btnOutline, "border-white/40 bg-transparent text-white hover:bg-white/5")}>
                See the other modules <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </Container>
        </section>
        <LandingFooter />
      </div>

      <WhatsAppButton />
      <BackToTop />
    </div>
  );
}

/* ---------- this guide's own pieces ---------- */

/** A status pill: approved, pending, rejected. */
function Status({ kind, children }: { kind: "ok" | "wait" | "no"; children: ReactNode }) {
  const tone = {
    ok: "bg-ai-done/12 text-ai-done",
    wait: "bg-needs-human/12 text-needs-human",
    no: "bg-lp-ink/10 text-lp-muted",
  }[kind];
  return (
    <span className={cn("inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em]", tone)}>
      {children}
    </span>
  );
}

/** A control worth noticing. */
function Warning({ children }: { children: ReactNode }) {
  return (
    <p className="mt-4 flex max-w-3xl gap-2.5 rounded-xl border border-needs-human/30 bg-needs-human/8 px-4 py-3 text-[13.5px] leading-[1.6] text-lp-body">
      <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-needs-human" strokeWidth={1.75} />
      <span>{children}</span>
    </p>
  );
}

/** The stock balance, movement by movement. */
function BalanceChart({ rows }: { rows: [string, string, string, string, number][] }) {
  const max = 300;
  const top = 10;
  const base = 120;
  const left = 44;
  const step = (520 - left) / (rows.length - 1);
  const y = (v: number) => base - (v / max) * (base - top);
  const points = rows.map((r, i) => `${left + i * step},${y(r[4])}`).join(" ");

  return (
    <svg viewBox="0 0 540 160" className="mt-4 w-full" role="img" aria-label="Stock balance over the month">
      {[0, 150, 300].map((v) => (
        <g key={v}>
          <line x1={left} x2="528" y1={y(v)} y2={y(v)} stroke="currentColor" strokeWidth="1" className="text-lp-line" />
          <text x={left - 8} y={y(v) + 4} textAnchor="end" className="fill-lp-muted text-[10px]">
            {v}
          </text>
        </g>
      ))}
      <polyline points={points} fill="none" stroke={CHART.green} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {rows.map((r, i) => (
        <g key={r[0]}>
          <circle cx={left + i * step} cy={y(r[4])} r="3.5" fill={CHART.green} />
          <text x={left + i * step} y={base + 18} textAnchor="middle" className="fill-lp-muted text-[10px]">
            {r[0]}
          </text>
        </g>
      ))}
    </svg>
  );
}

/** Inventory value by how long it has sat still. */
function AgeingChart() {
  const total = ageing.reduce((sum, [, value]) => sum + value, 0);
  return (
    <div className="mt-3">
      <div className="flex h-6 overflow-hidden rounded-lg">
        {ageing.map(([label, value, colour]) => (
          <div key={label} style={{ width: `${(value / total) * 100}%`, backgroundColor: colour }} title={label} />
        ))}
      </div>
      <ul className="mt-3 grid gap-x-6 gap-y-1.5 text-[13px] sm:grid-cols-2 lg:grid-cols-3">
        {ageing.map(([label, value, colour]) => (
          <li key={label} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: colour }} />
            <span className="flex-1 text-lp-body">{label}</span>
            <span className="font-semibold tabular-nums text-lp-ink">${value.toLocaleString("en-US")}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
