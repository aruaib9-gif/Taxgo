"use client";

// Shared "Attach" button and attachment list. See lib/attachments.ts for how files are kept.

import { useRef, useState } from "react";
import Link from "next/link";
import { FileText, Paperclip, X } from "lucide-react";
import { fileSize, INBOX_TYPES, INLINE_LIMIT, openAttachment, readAttachments, sendToInbox, type Attachment } from "@/lib/attachments";
import { cn } from "@/lib/utils";

export const RECEIPT_TYPES = ".pdf,.png,.jpg,.jpeg,.webp,.heic";

export function AttachButton({
  onAttach,
  accept,
  multiple = true,
  className,
  children,
  ariaLabel,
}: {
  onAttach: (files: Attachment[], raw: File[]) => void;
  accept?: string;
  multiple?: boolean;
  className?: string;
  children?: React.ReactNode;
  ariaLabel?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  return (
    <>
      <button type="button" className={className} disabled={busy} aria-label={ariaLabel} onClick={() => ref.current?.click()}>
        {children ?? (
          <>
            <Paperclip /> Attach file
          </>
        )}
      </button>
      <input
        ref={ref}
        type="file"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        accept={accept}
        multiple={multiple}
        onChange={async (e) => {
          const raw = Array.from(e.target.files ?? []);
          e.target.value = "";
          if (!raw.length) return;
          setBusy(true);
          try {
            onAttach(await readAttachments(raw), raw);
          } finally {
            setBusy(false);
          }
        }}
      />
    </>
  );
}

export function AttachmentList({ items, onRemove, className }: { items: Attachment[]; onRemove?: (id: string) => void; className?: string }) {
  if (!items.length) return null;
  return (
    <ul className={cn("flex flex-wrap gap-2", className)}>
      {items.map((a) => (
        <li key={a.id} className="flex max-w-full items-center gap-1.5 rounded-md border border-border bg-background py-1 pl-2 pr-1 text-xs">
          <FileText className="size-3.5 shrink-0 text-muted-foreground" />
          {a.dataUrl ? (
            <button type="button" onClick={() => openAttachment(a)} className="truncate font-medium text-primary hover:underline" title={`Open ${a.name}`}>
              {a.name}
            </button>
          ) : (
            <span className="truncate font-medium" title={`Larger than ${fileSize(INLINE_LIMIT)}, so only the name is kept in this browser`}>
              {a.name}
            </span>
          )}
          <span className="shrink-0 text-muted-foreground">{fileSize(a.size)}</span>
          {onRemove && (
            <button type="button" aria-label={`Remove ${a.name}`} onClick={() => onRemove(a.id)} className="grid size-5 shrink-0 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground">
              <X className="size-3" />
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}

/** Attach button that files receipts/invoices into the Document Inbox and links to them. */
export function InboxAttachButton({ className, children }: { className?: string; children?: React.ReactNode }) {
  const [sent, setSent] = useState<{ id: string; name: string }[]>([]);
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <AttachButton
        className={className}
        accept={INBOX_TYPES}
        onAttach={async (files) => {
          const docs = await Promise.all(files.map((f) => sendToInbox(f)));
          setSent(docs.map((d) => ({ id: d.id, name: String(d.fileName) })));
        }}
      >
        {children}
      </AttachButton>
      {sent.length > 0 && (
        <span role="status" className="text-xs text-muted-foreground">
          {sent.length === 1 ? `${sent[0].name} added to the ` : `${sent.length} files added to the `}
          <Link href={sent.length === 1 ? `/documents/${sent[0].id}` : "/documents"} className="font-medium text-primary hover:underline">
            Document Inbox
          </Link>{" "}
          for review.
        </span>
      )}
    </span>
  );
}
