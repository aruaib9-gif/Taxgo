"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import {
  Brain,
  Calculator,
  ChevronDown,
  Landmark,
  MessageSquare,
  Package,
  Paperclip,
  Send,
  Shield,
  ShoppingCart,
  SquarePen,
  Target,
  TrendingUp,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { useDismiss } from "@/lib/use-dismiss";
import { cn } from "@/lib/utils";

const SPECIALISTS: { name: string; icon: LucideIcon }[] = [
  { name: "General Assistant", icon: MessageSquare },
  { name: "Virtual CFO", icon: TrendingUp },
  { name: "Virtual Accountant", icon: Calculator },
  { name: "Sales Manager", icon: Target },
  { name: "HR Manager", icon: Users },
  { name: "Inventory Manager", icon: Package },
  { name: "Procurement Officer", icon: ShoppingCart },
  { name: "Compliance Officer", icon: Shield },
  { name: "Treasurer", icon: Landmark },
];

// No AI backend is wired into this build yet; replies say so instead of inventing answers.
const OFFLINE_REPLY = "I'm not connected to an AI service in this build yet, so I can't answer that here.";

type Message = { role: "user" | "assistant"; text: string };

type AssistantState = {
  open: boolean;
  setOpen: (open: boolean) => void;
  messages: Message[];
  ask: (question: string) => void; // opens the panel; a non-empty question is added to the conversation
  clear: () => void;
};

const AssistantContext = createContext<AssistantState | null>(null);

export function useAssistant() {
  const ctx = useContext(AssistantContext);
  if (!ctx) throw new Error("useAssistant must be used inside <AssistantProvider>");
  return ctx;
}

export function AssistantProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  const ask = useCallback((question: string) => {
    const text = question.trim();
    setOpen(true);
    if (!text) return;
    setMessages((m) => [...m, { role: "user", text }, { role: "assistant", text: OFFLINE_REPLY }]);
  }, []);

  const clear = useCallback(() => setMessages([]), []);

  return <AssistantContext.Provider value={{ open, setOpen, messages, ask, clear }}>{children}</AssistantContext.Provider>;
}

export function AssistantButton() {
  const { open, setOpen } = useAssistant();
  if (open) return null;
  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      title="Open AI Assistant"
      aria-label="Open AI Assistant"
      className="fixed bottom-16 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:scale-105 hover:shadow-xl sm:bottom-6"
    >
      <Brain className="h-6 w-6" />
    </button>
  );
}

export function AssistantPanel() {
  const { open, setOpen, messages, ask, clear } = useAssistant();
  const [specialist, setSpecialist] = useState(SPECIALISTS[0]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [width, setWidth] = useState(420);
  const menuRef = useDismiss(menuOpen, setMenuOpen);
  const fileRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  if (!open) return null;

  function send() {
    if (!draft.trim()) return;
    ask(draft);
    setDraft("");
  }

  // Drag the left edge to resize (desktop).
  function startResize(e: React.PointerEvent) {
    const startX = e.clientX;
    const startW = width;
    const move = (ev: PointerEvent) => setWidth(Math.min(720, Math.max(320, startW + (startX - ev.clientX))));
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  const Icon = specialist.icon;

  return (
    <aside
      aria-label="AI Assistant"
      style={{ width }}
      className="fixed right-0 top-0 z-50 flex h-screen max-w-[90vw] shrink-0 flex-col border-l border-border bg-background shadow-2xl lg:relative lg:z-auto lg:max-w-none lg:shadow-none"
    >
      <div
        onPointerDown={startResize}
        title="Drag to resize"
        className="absolute left-0 top-0 z-20 hidden h-full w-1.5 -translate-x-1/2 cursor-col-resize hover:bg-primary/40 lg:block"
      />
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={clear}
            title="New conversation"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground"
          >
            <SquarePen className="h-4 w-4" />
          </button>
          <div ref={menuRef} className="relative">
            <button
              type="button"
              aria-haspopup="listbox"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
              className="flex h-8 w-[190px] items-center justify-between gap-2 rounded-md px-2 text-sm font-semibold hover:bg-accent"
            >
              <span className="flex min-w-0 items-center gap-2 truncate">
                <Icon className="h-4 w-4 shrink-0" /> {specialist.name}
              </span>
              <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
            </button>
            {menuOpen && (
              <ul role="listbox" className="absolute left-0 top-full z-50 mt-1 w-56 rounded-md border border-border bg-popover p-1 shadow-md">
                {SPECIALISTS.map((s) => (
                  <li key={s.name}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={s.name === specialist.name}
                      onClick={() => {
                        setSpecialist(s);
                        setMenuOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent",
                        s.name === specialist.name && "bg-accent",
                      )}
                    >
                      <s.icon className="h-4 w-4 text-muted-foreground" /> {s.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close assistant"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center p-6 text-center">
            <Brain className="mb-3 h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm font-medium">{specialist.name}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Pick a specialist from the top, or just ask — create customers, leads, invoices, import statements, and more.
            </p>
          </div>
        ) : (
          <div className="space-y-3 p-4">
            {messages.map((m, i) => (
              <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                <p
                  className={cn(
                    "max-w-[85%] rounded-xl px-3 py-2 text-sm",
                    m.role === "user" ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm bg-muted text-foreground",
                  )}
                >
                  {m.text}
                </p>
              </div>
            ))}
            <div ref={endRef} />
          </div>
        )}
      </div>

      <div className="border-t border-border bg-background">
        <div className="flex items-end gap-2 p-3">
          <input ref={fileRef} type="file" className="hidden" accept=".csv,.txt,.json,.xlsx,.xls,.pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.gif" />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            title="Attach a CSV, Excel, PDF, Word or image"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground"
          >
            <Paperclip className="h-4 w-4" />
          </button>
          <textarea
            rows={1}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Ask about your books..."
            className="flex max-h-[120px] min-h-[40px] w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <button
            type="button"
            onClick={send}
            disabled={!draft.trim()}
            aria-label="Send"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground shadow hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
