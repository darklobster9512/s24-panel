import { useEffect, useRef, useState } from "react";
import { Check, CheckCheck, Loader2, Pencil, Send, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  formatChatDay,
  formatChatTime,
  type ChatMessage,
  type ChatSenderRole,
} from "@/hooks/use-chat";

interface ChatThreadProps {
  messages: ChatMessage[];
  loading?: boolean;
  viewerRole: ChatSenderRole;
  /** Internal hint "gesendet von Superadmin" – only for manager/superadmin view */
  showInternalHints?: boolean;
  otherTyping?: boolean;
  otherName?: string;
  emptyHint?: string;
  disabled?: boolean;
  compact?: boolean;
  onSend: (text: string) => Promise<void> | void;
  onEdit: (id: string, text: string) => Promise<void> | void;
  onDelete: (id: string) => Promise<void> | void;
  onTyping?: () => void;
}

export function ChatThread({
  messages,
  loading,
  viewerRole,
  showInternalHints,
  otherTyping,
  otherName,
  emptyHint = "Noch keine Nachrichten.",
  disabled,
  compact,
  onSend,
  onEdit,
  onDelete,
  onTyping,
}: ChatThreadProps) {
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, otherTyping]);

  const submit = async () => {
    const text = draft.trim();
    if (!text || sending || disabled) return;
    setSending(true);
    await onSend(text);
    setDraft("");
    setSending(false);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    await onEdit(editingId, editingText);
    setEditingId(null);
    setEditingText("");
  };

  let lastDay = "";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className={cn("min-h-0 flex-1 space-y-3 overflow-y-auto", compact ? "p-3" : "p-5")}>
        {loading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">{emptyHint}</p>
        ) : (
          messages.map((m) => {
            const mine = m.sender_role === viewerRole;
            const day = formatChatDay(m.created_at);
            const showDay = day !== lastDay;
            lastDay = day;
            const isDeleted = !!m.deleted_at;
            const editing = editingId === m.id;

            return (
              <div key={m.id}>
                {showDay && (
                  <div className="my-4 flex items-center gap-3">
                    <span className="h-px flex-1 bg-border/70" />
                    <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      {day}
                    </span>
                    <span className="h-px flex-1 bg-border/70" />
                  </div>
                )}
                <div className={cn("group flex", mine ? "justify-end" : "justify-start")}>
                  <div className={cn("max-w-[78%]", mine && "flex flex-col items-end")}>
                    <div
                      className={cn(
                        "rounded-2xl px-3.5 py-2 text-sm shadow-sm",
                        mine
                          ? "bg-primary text-primary-foreground"
                          : "border border-border/60 bg-card text-foreground",
                        isDeleted && "italic opacity-70",
                      )}
                    >
                      {editing ? (
                        <div className="flex w-64 flex-col gap-2">
                          <Textarea
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            rows={2}
                            className="resize-none bg-background text-foreground"
                          />
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                              <X className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="sm" onClick={saveEdit}>
                              Speichern
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <span className="whitespace-pre-wrap break-words">
                          {isDeleted ? "Nachricht gelöscht" : m.content}
                        </span>
                      )}
                    </div>

                    <div
                      className={cn(
                        "mt-1 flex items-center gap-1.5 px-1 text-[11px] text-muted-foreground",
                        mine ? "justify-end" : "justify-start",
                      )}
                    >
                      <span>{formatChatTime(m.created_at)}</span>
                      {m.edited_at && !isDeleted && <span>· bearbeitet</span>}
                      {showInternalHints && m.sent_as_superadmin && (
                        <span className="rounded bg-muted px-1 py-0.5 text-[10px]">
                          gesendet von Superadmin
                        </span>
                      )}
                      {mine &&
                        !isDeleted &&
                        (m.read ? (
                          <span
                            className="flex items-center gap-0.5 text-primary"
                            title={m.read_at ? `Gelesen ${formatChatTime(m.read_at)}` : "Gelesen"}
                          >
                            <CheckCheck className="h-3.5 w-3.5" />
                          </span>
                        ) : (
                          <Check className="h-3.5 w-3.5" />
                        ))}
                      {mine && !isDeleted && !editing && (
                        <span className="flex items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
                          <button
                            type="button"
                            className="rounded p-0.5 hover:text-foreground"
                            title="Bearbeiten"
                            onClick={() => {
                              setEditingId(m.id);
                              setEditingText(m.content);
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            className="rounded p-0.5 hover:text-destructive"
                            title="Löschen"
                            onClick={() => onDelete(m.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {otherTyping && (
          <div className="flex items-center gap-2 px-1 text-xs text-muted-foreground">
            <span className="flex gap-1">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:120ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:240ms]" />
            </span>
            {otherName ? `${otherName} tippt…` : "tippt…"}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className={cn("border-t border-border/60 bg-background/60", compact ? "p-2.5" : "p-4")}>
        <div className="flex items-end gap-2">
          <Textarea
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              onTyping?.();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void submit();
              }
            }}
            placeholder="Nachricht schreiben…"
            rows={compact ? 1 : 2}
            disabled={disabled}
            className="min-h-[40px] resize-none"
          />
          <Button size="icon" onClick={submit} disabled={disabled || sending || !draft.trim()}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
