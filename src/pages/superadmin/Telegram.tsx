import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, Plus, Send, Trash2, MessageSquare } from "lucide-react";

type Recipient = {
  id: string;
  chat_id: string;
  label: string | null;
  is_active: boolean;
  notify_applications: boolean;
  notify_interviews: boolean;
  notify_contracts: boolean;
  notify_notes: boolean;
  notify_chat: boolean;
  notify_onboarding: boolean;


  created_at: string;
};

export default function Telegram() {
  const qc = useQueryClient();
  const [chatId, setChatId] = useState("");
  const [label, setLabel] = useState("");
  const [testingId, setTestingId] = useState<string | null>(null);

  const { data: recipients = [], isLoading } = useQuery({
    queryKey: ["telegram-recipients"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("telegram_recipients")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Recipient[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const clean = chatId.trim();
      if (!/^-?\d+$/.test(clean)) throw new Error("Chat-ID muss eine Zahl sein");
      const { error } = await (supabase as any)
        .from("telegram_recipients")
        .insert({ chat_id: clean, label: label.trim() || null });
      if (error) throw error;
    },
    onSuccess: () => {
      setChatId("");
      setLabel("");
      qc.invalidateQueries({ queryKey: ["telegram-recipients"] });
      toast.success("Empfänger hinzugefügt");
    },
    onError: (e: Error) =>
      toast.error(e.message.includes("duplicate") ? "Chat-ID existiert bereits" : e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Recipient> }) => {
      const { error } = await (supabase as any)
        .from("telegram_recipients")
        .update(patch)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["telegram-recipients"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("telegram_recipients")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["telegram-recipients"] });
      toast.success("Empfänger entfernt");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function sendTest(r: Recipient) {
    setTestingId(r.id);
    const { data, error } = await supabase.functions.invoke("telegram-notify", {
      body: { type: "test", chat_id: r.chat_id },
    });
    setTestingId(null);
    if (error) {
      toast.error("Testnachricht fehlgeschlagen");
      console.error(error);
      return;
    }
    if ((data as any)?.failed > 0) {
      toast.error("Telegram hat die Nachricht abgelehnt – Chat-ID prüfen");
      return;
    }
    toast.success("Testnachricht gesendet");
  }
  const [setupLoading, setSetupLoading] = useState(false);

  async function setupWebhook() {
    setSetupLoading(true);
    const { data, error } = await supabase.functions.invoke("telegram-setup", { body: {} });
    setSetupLoading(false);
    if (error || (data as any)?.setWebhook?.ok === false) {
      toast.error("Webhook konnte nicht eingerichtet werden");
      console.error(error ?? data);
      return;
    }
    toast.success("Bot verbunden – Befehle sind aktiv");
  }


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Telegram</h1>
        <p className="text-sm text-muted-foreground">
          Benachrichtigungen bei neuen Bewerbungen und gebuchten Bewerbungsgesprächen.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="h-4 w-4" /> So funktioniert es
          </CardTitle>
          <CardDescription>
            Schreibe dem Bot in Telegram <code className="rounded bg-muted px-1">/start</code> – er
            antwortet mit deiner Chat-ID. Trage diese hier ein, um Benachrichtigungen zu erhalten.
            Mit <code className="rounded bg-muted px-1">/kalender</code> listet der Bot die
            kommenden Bewerbungsgespräche auf.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={setupWebhook} disabled={setupLoading}>
            {setupLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <MessageSquare className="mr-2 h-4 w-4" />
            )}
            Bot verbinden / Befehle aktivieren
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Empfänger hinzufügen</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-3 sm:flex-row sm:items-end"
            onSubmit={(e) => {
              e.preventDefault();
              addMutation.mutate();
            }}
          >
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="chatId">Chat-ID</Label>
              <Input
                id="chatId"
                placeholder="z. B. 123456789"
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="label">Bezeichnung (optional)</Label>
              <Input
                id="label"
                placeholder="z. B. Geschäftsführung"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={addMutation.isPending || !chatId.trim()}>
              {addMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Hinzufügen
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Empfänger</CardTitle>
          <CardDescription>
            {recipients.length} {recipients.length === 1 ? "Eintrag" : "Einträge"}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-0">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : recipients.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-muted-foreground">
              Noch keine Empfänger hinterlegt.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Chat-ID</TableHead>
                    <TableHead>Bezeichnung</TableHead>
                    <TableHead className="text-center">Aktiv</TableHead>
                    <TableHead className="text-center">Bewerbungen</TableHead>
                    <TableHead className="text-center">Gespräche</TableHead>
                    <TableHead className="text-center">Verträge</TableHead>
                    <TableHead className="text-center">Notizen</TableHead>
                    <TableHead className="text-center">Onboarding</TableHead>

                    <TableHead className="text-right">Aktionen</TableHead>

                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recipients.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs">{r.chat_id}</TableCell>
                      <TableCell>
                        {r.label ? (
                          r.label
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <Switch
                            checked={r.is_active}
                            onCheckedChange={(v) =>
                              updateMutation.mutate({ id: r.id, patch: { is_active: v } })
                            }
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <Switch
                            checked={r.notify_applications}
                            onCheckedChange={(v) =>
                              updateMutation.mutate({
                                id: r.id,
                                patch: { notify_applications: v },
                              })
                            }
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <Switch
                            checked={r.notify_interviews}
                            onCheckedChange={(v) =>
                              updateMutation.mutate({ id: r.id, patch: { notify_interviews: v } })
                            }
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <Switch
                            checked={r.notify_contracts}
                            onCheckedChange={(v) =>
                              updateMutation.mutate({ id: r.id, patch: { notify_contracts: v } })
                            }
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <Switch
                            checked={r.notify_notes}
                            onCheckedChange={(v) =>
                              updateMutation.mutate({ id: r.id, patch: { notify_notes: v } })
                            }
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <Switch
                            checked={r.notify_chat}
                            onCheckedChange={(v) =>
                              updateMutation.mutate({ id: r.id, patch: { notify_chat: v } })
                            }
                          />
                        </div>
                      </TableCell>


                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => sendTest(r)}
                            disabled={testingId === r.id}
                          >
                            {testingId === r.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Send className="h-3.5 w-3.5" />
                            )}
                            <span className="ml-2 hidden sm:inline">Test</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteMutation.mutate(r.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">/start – Chat-ID anzeigen</Badge>
        <Badge variant="secondary">/kalender – kommende Bewerbungsgespräche</Badge>
      </div>
    </div>
  );
}
