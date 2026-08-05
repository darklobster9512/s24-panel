import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ChatSenderRole = "manager" | "mitarbeiter";

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_role: ChatSenderRole;
  sender_user_id: string | null;
  sent_as_superadmin: boolean;
  content: string;
  edited_at: string | null;
  deleted_at: string | null;
  read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface AgentSettings {
  id: string;
  display_name: string;
  status: "online" | "away" | "offline";
  online_from: string;
  offline_after: string;
  auto_offline: boolean;
}

export const AGENT_STATUS_META: Record<
  AgentSettings["status"],
  { label: string; dot: string; text: string }
> = {
  online: { label: "Online", dot: "bg-primary", text: "text-primary" },
  away: { label: "Abwesend", dot: "bg-amber-400", text: "text-amber-600" },
  offline: { label: "Offline", dot: "bg-muted-foreground/50", text: "text-muted-foreground" },
};

const db = supabase as any;

const toMinutes = (t?: string | null) => {
  if (!t) return null;
  const [h, m] = t.split(":");
  const hh = Number(h);
  const mm = Number(m ?? 0);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
  return hh * 60 + mm;
};

/** Formats "18:00:00" -> "18:00" for <input type="time"> */
export const toTimeInput = (t?: string | null) => (t ? t.slice(0, 5) : "");

/** Is `now` inside the configured office window? Handles windows crossing midnight. */
export function isWithinOfficeHours(
  settings: Pick<AgentSettings, "online_from" | "offline_after"> | null | undefined,
  now: Date = new Date(),
) {
  const from = toMinutes(settings?.online_from);
  const until = toMinutes(settings?.offline_after);
  if (from === null || until === null || from === until) return true;
  const cur = now.getHours() * 60 + now.getMinutes();
  return from < until ? cur >= from && cur < until : cur >= from || cur < until;
}

/** Manual status, forced to "offline" outside the office hours window. */
export function effectiveAgentStatus(
  settings: AgentSettings | null | undefined,
  now: Date = new Date(),
): AgentSettings["status"] {
  const status = settings?.status ?? "offline";
  if (settings?.auto_offline && !isWithinOfficeHours(settings, now)) return "offline";
  return status;
}

/** Re-renders every minute so the status flips at the configured time without reload. */
export function useMinuteTick() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

/** Live agent (manager) profile — name + status shown in the employee widget. */
export function useAgentSettings() {
  const [settings, setSettings] = useState<AgentSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    db.from("chat_agent_settings")
      .select("id, display_name, status, online_from, offline_after, auto_offline")
      .limit(1)
      .maybeSingle()
      .then(({ data }: any) => {
        if (!mounted) return;
        setSettings(data ?? null);
        setLoading(false);
      });

    const channel = supabase
      .channel("chat-agent-settings")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chat_agent_settings" },
        (payload) => {
          const next = payload.new as AgentSettings | undefined;
          if (next?.id) setSettings(next);
        },
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const updateSettings = useCallback(
    async (patch: Partial<Pick<AgentSettings, "display_name" | "status" | "online_from" | "offline_after" | "auto_offline">>) => {
      if (!settings) return { error: new Error("Keine Einstellungen geladen") };
      const { error } = await db
        .from("chat_agent_settings")
        .update(patch)
        .eq("id", settings.id);
      if (!error) setSettings({ ...settings, ...patch });
      return { error };
    },
    [settings],
  );

  return { settings, loading, updateSettings };
}

/** Messages of a single conversation, live-updated. */
export function useChatMessages(conversationId: string | null, viewerRole: ChatSenderRole) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setLoading(false);
      return;
    }
    let mounted = true;
    setLoading(true);
    db.from("chat_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .then(({ data }: any) => {
        if (!mounted) return;
        setMessages((data as ChatMessage[]) ?? []);
        setLoading(false);
      });

    const channel = supabase
      .channel(`chat-messages-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const old = payload.old as { id: string };
            setMessages((prev) => prev.filter((m) => m.id !== old.id));
            return;
          }
          const row = payload.new as ChatMessage;
          setMessages((prev) => {
            const exists = prev.some((m) => m.id === row.id);
            if (exists) return prev.map((m) => (m.id === row.id ? row : m));
            return [...prev, row].sort((a, b) => a.created_at.localeCompare(b.created_at));
          });
        },
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  const sendMessage = useCallback(
    async (content: string, opts?: { sentAsSuperadmin?: boolean }) => {
      const text = content.trim();
      if (!conversationId || !text) return { error: null };
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await db.from("chat_messages").insert({
        conversation_id: conversationId,
        sender_role: viewerRole,
        sender_user_id: userData.user?.id ?? null,
        sent_as_superadmin: opts?.sentAsSuperadmin ?? false,
        content: text,
      });
      return { error };
    },
    [conversationId, viewerRole],
  );

  const editMessage = useCallback(async (id: string, content: string) => {
    const text = content.trim();
    if (!text) return { error: null };
    const { error } = await db
      .from("chat_messages")
      .update({ content: text, edited_at: new Date().toISOString() })
      .eq("id", id);
    return { error };
  }, []);

  const deleteMessage = useCallback(async (id: string) => {
    const { error } = await db
      .from("chat_messages")
      .update({ content: "", deleted_at: new Date().toISOString() })
      .eq("id", id);
    return { error };
  }, []);

  /** Mark all messages from the other side as read. */
  const markRead = useCallback(async () => {
    if (!conversationId) return;
    const otherRole: ChatSenderRole = viewerRole === "manager" ? "mitarbeiter" : "manager";
    const unread = messages.filter((m) => m.sender_role === otherRole && !m.read);
    if (!unread.length) return;
    await db
      .from("chat_messages")
      .update({ read: true, read_at: new Date().toISOString() })
      .in(
        "id",
        unread.map((m) => m.id),
      );
  }, [conversationId, messages, viewerRole]);

  return { messages, loading, sendMessage, editMessage, deleteMessage, markRead };
}

/** Ephemeral "is typing" indicator over a broadcast channel. */
export function useChatTyping(conversationId: string | null, role: ChatSenderRole) {
  const [otherTyping, setOtherTyping] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase.channel(`chat-typing-${conversationId}`, {
      config: { broadcast: { self: false } },
    });
    channel
      .on("broadcast", { event: "typing" }, (payload) => {
        if ((payload.payload as any)?.role === role) return;
        setOtherTyping(true);
        if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
        timeoutRef.current = window.setTimeout(() => setOtherTyping(false), 3000);
      })
      .subscribe();
    channelRef.current = channel;

    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      setOtherTyping(false);
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [conversationId, role]);

  const sendTyping = useCallback(() => {
    channelRef.current?.send({ type: "broadcast", event: "typing", payload: { role } });
  }, [role]);

  return { otherTyping, sendTyping };
}

/** Employee side: resolve (or create) my own conversation + presence heartbeat. */
export function useMyConversation(enabled = true) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!enabled) return;
    let mounted = true;

    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) {
        if (mounted) setLoading(false);
        return;
      }
      const { data: emp } = await db
        .from("employees")
        .select("id")
        .eq("user_id", uid)
        .maybeSingle();
      if (!emp?.id) {
        if (mounted) setLoading(false);
        return;
      }
      const { data: existing } = await db
        .from("chat_conversations")
        .select("id")
        .eq("employee_id", emp.id)
        .maybeSingle();

      let id = existing?.id as string | undefined;
      if (!id) {
        const { data: created } = await db
          .from("chat_conversations")
          .insert({ employee_id: emp.id, employee_active_at: new Date().toISOString() })
          .select("id")
          .maybeSingle();
        id = created?.id;
      }
      if (!mounted) return;
      setConversationId(id ?? null);
      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [enabled]);

  // presence heartbeat
  useEffect(() => {
    if (!conversationId) return;
    const beat = () => {
      db.from("chat_conversations")
        .update({ employee_active_at: new Date().toISOString() })
        .eq("id", conversationId)
        .then(() => {});
    };
    beat();
    const interval = window.setInterval(beat, 60_000);
    return () => window.clearInterval(interval);
  }, [conversationId]);

  return { conversationId, loading };
}

export function formatChatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
}

export function formatChatDay(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (same(d, today)) return "Heute";
  if (same(d, yesterday)) return "Gestern";
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}
