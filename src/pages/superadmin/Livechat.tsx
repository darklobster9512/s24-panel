import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChatThread } from "@/components/chat/ChatThread";
import {
  AGENT_STATUS_META,
  formatChatDay,
  formatChatTime,
  useAgentSettings,
  useChatMessages,
  useChatTyping,
  type AgentSettings,
} from "@/hooks/use-chat";

const db = supabase as any;

interface EmployeeRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  login_email: string | null;
  conversation_id: string | null;
  employee_active_at: string | null;
  last_message_at: string | null;
  last_message: string | null;
  unread: number;
}

function fullName(e: { first_name: string | null; last_name: string | null; login_email: string | null }) {
  const n = [e.first_name, e.last_name].filter(Boolean).join(" ").trim();
  return n || e.login_email || "Unbenannt";
}

export default function SuperadminLivechat() {
  const { role } = useAuth();
  const isSuperadmin = role === "superadmin";
  const [search, setSearch] = useState("");
  const [activeEmployeeId, setActiveEmployeeId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const { settings, updateSettings } = useAgentSettings();
  const [nameDraft, setNameDraft] = useState("");
  const [statusTextDraft, setStatusTextDraft] = useState("");

  useEffect(() => {
    if (settings) {
      setNameDraft(settings.display_name ?? "");
      setStatusTextDraft(settings.status_text ?? "");
    }
  }, [settings?.id]);

  const { data: rows = [], isLoading, refetch } = useQuery({
    queryKey: ["livechat-conversations", reloadKey],
    queryFn: async (): Promise<EmployeeRow[]> => {
      const { data: employees } = await db
        .from("employees")
        .select("id, first_name, last_name, login_email, is_draft")
        .order("first_name", { ascending: true });

      const list = (employees ?? []).filter((e: any) => !e.is_draft);

      const { data: convs } = await db
        .from("chat_conversations")
        .select("id, employee_id, employee_active_at, last_message_at");

      const convByEmployee = new Map<string, any>(
        (convs ?? []).map((c: any) => [c.employee_id, c]),
      );

      const convIds = (convs ?? []).map((c: any) => c.id);
      const msgByConv = new Map<string, { last: any; unread: number }>();
      if (convIds.length) {
        const { data: msgs } = await db
          .from("chat_messages")
          .select("conversation_id, content, created_at, read, sender_role, deleted_at")
          .in("conversation_id", convIds)
          .order("created_at", { ascending: true });
        for (const m of msgs ?? []) {
          const entry = msgByConv.get(m.conversation_id) ?? { last: null, unread: 0 };
          entry.last = m;
          if (m.sender_role === "mitarbeiter" && !m.read && !m.deleted_at) entry.unread += 1;
          msgByConv.set(m.conversation_id, entry);
        }
      }

      return list.map((e: any) => {
        const conv = convByEmployee.get(e.id);
        const meta = conv ? msgByConv.get(conv.id) : undefined;
        return {
          id: e.id,
          first_name: e.first_name,
          last_name: e.last_name,
          login_email: e.login_email,
          conversation_id: conv?.id ?? null,
          employee_active_at: conv?.employee_active_at ?? null,
          last_message_at: conv?.last_message_at ?? null,
          last_message: meta?.last
            ? meta.last.deleted_at
              ? "Nachricht gelöscht"
              : meta.last.content
            : null,
          unread: meta?.unread ?? 0,
        };
      });
    },
  });

  // refresh list on any chat activity
  useEffect(() => {
    const channel = supabase
      .channel("livechat-overview")
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_messages" }, () =>
        refetch(),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_conversations" }, () =>
        refetch(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const sorted = [...rows].sort((a, b) => {
      if (a.unread !== b.unread) return b.unread - a.unread;
      const at = a.last_message_at ?? "";
      const bt = b.last_message_at ?? "";
      if (at !== bt) return bt.localeCompare(at);
      return fullName(a).localeCompare(fullName(b));
    });
    if (!q) return sorted;
    return sorted.filter((r) => fullName(r).toLowerCase().includes(q));
  }, [rows, search]);

  const active = filtered.find((r) => r.id === activeEmployeeId) ?? rows.find((r) => r.id === activeEmployeeId) ?? null;

  // ensure a conversation exists when opening a chat
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!active) {
        setActiveConversationId(null);
        return;
      }
      if (active.conversation_id) {
        setActiveConversationId(active.conversation_id);
        return;
      }
      const { data, error } = await db
        .from("chat_conversations")
        .insert({ employee_id: active.id })
        .select("id")
        .maybeSingle();
      if (error) {
        toast.error("Chat konnte nicht gestartet werden");
        return;
      }
      if (mounted) {
        setActiveConversationId(data?.id ?? null);
        setReloadKey((k) => k + 1);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [active?.id, active?.conversation_id]);

  const { messages, loading, sendMessage, editMessage, deleteMessage, markRead } = useChatMessages(
    activeConversationId,
    "manager",
  );
  const { otherTyping, sendTyping } = useChatTyping(activeConversationId, "manager");

  const unreadInActive = messages.filter((m) => m.sender_role === "mitarbeiter" && !m.read).length;
  useEffect(() => {
    if (activeConversationId && unreadInActive > 0) void markRead();
  }, [activeConversationId, unreadInActive, markRead]);

  const handleStatusChange = useCallback(
    async (status: AgentSettings["status"]) => {
      const { error } = await updateSettings({ status });
      if (error) toast.error("Status konnte nicht gespeichert werden");
      else toast.success("Status aktualisiert");
    },
    [updateSettings],
  );

  const saveProfile = async () => {
    const { error } = await updateSettings({
      display_name: nameDraft.trim() || "Daniel Schreiber",
      status_text: statusTextDraft.trim() || null,
    });
    if (error) toast.error("Speichern fehlgeschlagen");
    else toast.success("Gespeichert");
  };

  const isOnline = (iso: string | null) =>
    !!iso && Date.now() - new Date(iso).getTime() < 2 * 60 * 1000;

  const statusMeta = AGENT_STATUS_META[settings?.status ?? "offline"];

  return (
    <div className="flex h-[calc(100vh-9rem)] flex-col">
      <div className="mb-5">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Livechat</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isSuperadmin
            ? "Alle Chats zwischen Manager und Mitarbeitern – Nachrichten werden im Namen des Managers gesendet."
            : "Direkter Chat mit allen Mitarbeitern."}
        </p>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
        {/* Sidebar */}
        <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-card-elegant">
          <div className="border-b border-border/60 p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Mitarbeiter suchen…"
                className="pl-9"
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center py-10 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Keine Mitarbeiter gefunden.
              </p>
            ) : (
              filtered.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setActiveEmployeeId(r.id)}
                  className={cn(
                    "flex w-full items-start gap-3 border-b border-border/40 px-3 py-3 text-left transition hover:bg-accent/50",
                    activeEmployeeId === r.id && "bg-accent",
                  )}
                >
                  <span className="relative mt-1 flex h-2.5 w-2.5 shrink-0">
                    <span
                      className={cn(
                        "h-2.5 w-2.5 rounded-full",
                        isOnline(r.employee_active_at) ? "bg-primary" : "bg-muted-foreground/40",
                      )}
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium">{fullName(r)}</span>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {r.last_message_at
                          ? formatChatDay(r.last_message_at) === "Heute"
                            ? formatChatTime(r.last_message_at)
                            : formatChatDay(r.last_message_at)
                          : ""}
                      </span>
                    </span>
                    <span className="mt-0.5 flex items-center justify-between gap-2">
                      <span className="truncate text-xs text-muted-foreground">
                        {r.last_message ?? "Noch keine Nachrichten"}
                      </span>
                      {r.unread > 0 && (
                        <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                          {r.unread}
                        </span>
                      )}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>

          {/* Status panel */}
          <div className="space-y-2 border-t border-border/60 bg-background/60 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Mein Live-Status
            </p>
            <Input
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              placeholder="Anzeigename"
              className="h-9"
            />
            <Select
              value={settings?.status ?? "online"}
              onValueChange={(v) => handleStatusChange(v as AgentSettings["status"])}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(["online", "away", "offline"] as const).map((s) => (
                  <SelectItem key={s} value={s}>
                    <span className="flex items-center gap-2">
                      <span className={cn("h-2 w-2 rounded-full", AGENT_STATUS_META[s].dot)} />
                      {AGENT_STATUS_META[s].label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={statusTextDraft}
              onChange={(e) => setStatusTextDraft(e.target.value)}
              placeholder="Statustext (optional)"
              className="h-9"
            />
            <Button size="sm" className="w-full" onClick={saveProfile}>
              Speichern
            </Button>
          </div>
        </div>

        {/* Thread */}
        <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-card-elegant">
          {!active ? (
            <div className="grid flex-1 place-items-center px-6 text-center text-sm text-muted-foreground">
              Wähle links einen Mitarbeiter aus, um den Chat zu öffnen.
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between border-b border-border/60 bg-background/70 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{fullName(active)}</p>
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full",
                        isOnline(active.employee_active_at) ? "bg-primary" : "bg-muted-foreground/40",
                      )}
                    />
                    {isOnline(active.employee_active_at) ? "online" : "offline"}
                  </p>
                </div>
                <p className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
                  Sendet als {settings?.display_name ?? "Daniel Schreiber"}
                  <span className={cn("h-2 w-2 rounded-full", statusMeta.dot)} />
                </p>
              </div>

              <ChatThread
                messages={messages}
                loading={loading}
                viewerRole="manager"
                showInternalHints
                otherTyping={otherTyping}
                otherName={fullName(active)}
                disabled={!activeConversationId}
                onSend={async (t) => {
                  const { error } = await sendMessage(t, { sentAsSuperadmin: isSuperadmin });
                  if (error) toast.error("Nachricht konnte nicht gesendet werden");
                }}
                onEdit={async (id, t) => {
                  const { error } = await editMessage(id, t);
                  if (error) toast.error("Bearbeiten fehlgeschlagen");
                }}
                onDelete={async (id) => {
                  const { error } = await deleteMessage(id);
                  if (error) toast.error("Löschen fehlgeschlagen");
                }}
                onTyping={sendTyping}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
