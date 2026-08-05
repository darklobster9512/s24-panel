import { useEffect, useMemo, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChatThread } from "./ChatThread";
import {
  AGENT_STATUS_META,
  effectiveAgentStatus,
  useAgentSettings,
  useMinuteTick,
  useChatMessages,
  useChatTyping,
  useMyConversation,
} from "@/hooks/use-chat";

export function MitarbeiterChatWidget() {
  const [open, setOpen] = useState(false);
  const { conversationId } = useMyConversation();
  const { settings } = useAgentSettings();
  const { messages, loading, sendMessage, editMessage, deleteMessage, markRead } =
    useChatMessages(conversationId, "mitarbeiter");
  const { otherTyping, sendTyping } = useChatTyping(conversationId, "mitarbeiter");

  const unread = useMemo(
    () => messages.filter((m) => m.sender_role === "manager" && !m.read && !m.deleted_at).length,
    [messages],
  );

  useEffect(() => {
    if (open && unread > 0) void markRead();
  }, [open, unread, markRead]);

  const now = useMinuteTick();
  const statusMeta = AGENT_STATUS_META[effectiveAgentStatus(settings, now)];
  const agentName = settings?.display_name ?? "Daniel Schreiber";

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-6 z-50 flex h-[520px] w-[360px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-2xl">
          <div className="flex items-center justify-between border-b border-border/60 bg-background/80 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{agentName}</p>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className={cn("h-2 w-2 rounded-full", statusMeta.dot)} />
                {statusMeta.label}
              </p>
            </div>
            <Button size="icon" variant="ghost" onClick={() => setOpen(false)} aria-label="Chat schließen">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <ChatThread
            messages={messages}
            loading={loading}
            viewerRole="mitarbeiter"
            otherTyping={otherTyping}
            otherName={agentName}
            compact
            emptyHint={`Schreib ${agentName} eine Nachricht.`}
            disabled={!conversationId}
            onSend={async (t) => {
              await sendMessage(t);
            }}
            onEdit={async (id, t) => {
              await editMessage(id, t);
            }}
            onDelete={async (id) => {
              await deleteMessage(id);
            }}
            onTyping={sendTyping}
          />
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Livechat öffnen"
        className="fixed bottom-6 right-6 z-50 grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_10px_30px_-8px_hsl(var(--primary)/0.7)] transition hover:scale-105"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        {!open && unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-destructive px-1 text-[11px] font-semibold text-destructive-foreground">
            {unread}
          </span>
        )}
      </button>
    </>
  );
}
