import { Plus, Inbox } from "lucide-react";
import { Card, Button, PageHeader } from "@/components/ui";
import type { PageMeta } from "@/lib/page-meta";

export function PageScaffold({ meta }: { meta: PageMeta }) {
  const actions = meta.actions?.map((a, i) => (
    <Button key={a} variant={i === 0 ? "primary" : "outline"} size="sm">
      {i === 0 ? <Plus className="h-4 w-4" /> : null}
      {a}
    </Button>
  ));

  return (
    <div>
      <PageHeader title={meta.title} subtitle={meta.subtitle} actions={actions} />

      {(meta.tabs || meta.filters) && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {meta.tabs?.map((t, i) => (
            <button
              key={t}
              className={
                "rounded-full px-3 py-1 text-xs font-medium " +
                (i === 0
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:text-foreground")
              }
            >
              {t}
            </button>
          ))}
          {meta.filters?.map((f) => (
            <span
              key={f}
              className="rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground"
            >
              {f} ▾
            </span>
          ))}
        </div>
      )}

      {meta.kind === "form" ? (
        <FormPlaceholder title={meta.title} />
      ) : meta.columns ? (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                {meta.columns.map((c) => (
                  <th key={c} className="px-4 py-3 font-medium">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td
                  colSpan={meta.columns.length}
                  className="px-4 py-16 text-center text-sm text-muted-foreground"
                >
                  {meta.emptyTitle ?? "No results."}
                </td>
              </tr>
            </tbody>
          </table>
        </Card>
      ) : (
        <EmptyState
          title={meta.emptyTitle ?? `No ${meta.title.toLowerCase()} yet`}
          hint={meta.emptyHint}
        />
      )}
    </div>
  );
}

function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <Card className="flex flex-col items-center justify-center gap-2 py-20 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
        <Inbox className="h-5 w-5 text-muted-foreground" />
      </span>
      <p className="text-sm font-semibold">{title}</p>
      {hint ? <p className="max-w-sm text-sm text-muted-foreground">{hint}</p> : null}
    </Card>
  );
}

function FormPlaceholder({ title }: { title: string }) {
  return (
    <Card className="mx-auto max-w-2xl p-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Form fields render here. Wire this up to the API when building the module.
      </p>
      <div className="mt-6 grid grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-3 w-24 rounded bg-muted" />
            <div className="h-9 rounded-md border border-input bg-background" />
          </div>
        ))}
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="outline" size="sm">
          Cancel
        </Button>
        <Button size="sm">Save</Button>
      </div>
    </Card>
  );
}
