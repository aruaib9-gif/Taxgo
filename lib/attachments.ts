// File attachments, shared by every "Attach" control in the app.
//
// Data lives in the browser (localStorage), which only holds a few MB in total, so the file itself is kept
// only up to INLINE_LIMIT; bigger files keep their name, type and size so the record still shows what was
// attached. Receipts and invoices can also be handed to the Document Inbox, which classifies them for booking.

import { createRecord, updateRecord, type Rec } from "@/lib/store";
import { classify, todayIso } from "@/lib/banking";

export const INLINE_LIMIT = 400_000;

/** File types the Document Inbox accepts. */
export const INBOX_TYPES = ".pdf,.png,.jpg,.jpeg,.webp,.heic,.csv,.xlsx,.txt";

export type Attachment = {
  id: string;
  name: string;
  size: number;
  mime: string;
  /** The file as a data: URL, or null when it was too big to keep in the browser. */
  dataUrl: string | null;
  addedAt: string;
};

const dataUrlOf = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });

export async function readAttachment(file: File): Promise<Attachment> {
  return {
    id: crypto.randomUUID(),
    name: file.name,
    size: file.size,
    mime: file.type,
    dataUrl: file.size <= INLINE_LIMIT ? await dataUrlOf(file) : null,
    addedAt: new Date().toISOString(),
  };
}

export const readAttachments = (files: FileList | File[] | null | undefined) => Promise.all(Array.from(files ?? []).map(readAttachment));

export function fileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Opens a kept attachment: images, PDFs and text preview in a new tab; anything else downloads under its own name. */
export function openAttachment(a: Pick<Attachment, "dataUrl" | "name">) {
  if (!a.dataUrl) return false;
  const [meta, body] = a.dataUrl.split(",");
  const mime = /data:([^;]+)/.exec(meta)?.[1] ?? "application/octet-stream";
  const bytes = Uint8Array.from(atob(body), (c) => c.charCodeAt(0));
  const url = URL.createObjectURL(new Blob([bytes], { type: mime }));
  const download = () => Object.assign(document.createElement("a"), { href: url, download: a.name }).click();
  if (/^(image\/|text\/plain|application\/pdf)/.test(mime)) {
    // No "noopener" feature here: with it window.open always returns null, so a blocked popup could not be detected.
    const w = window.open(url, "_blank");
    if (w) w.opener = null;
    else download();
  } else download();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return true;
}

/** Adds a file to the Document Inbox and classifies it, as the Inbox's own upload does. */
export async function sendToInbox(file: File | Attachment): Promise<Rec> {
  const a = file instanceof File ? await readAttachment(file) : file;
  const d = createRecord("documents", { fileName: a.name, size: a.size, mime: a.mime, dataUrl: a.dataUrl, uploadedAt: a.addedAt, state: "FOR_REVIEW", date: todayIso() });
  const c = classify(d);
  const patch = { kind: c.kind, party: c.party, amount: c.amount || null, confidence: c.confidence, classified: true };
  updateRecord("documents", d.id, patch);
  return { ...d, ...patch };
}
