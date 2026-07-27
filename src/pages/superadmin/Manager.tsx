import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, Plus, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";
import { logActivity } from "@/lib/activityLog";

type Manager = {
  id: string;
  user_id: string;
  email: string;
  display_name: string | null;
  created_at: string;
};

function generatePassword(length = 14) {
  const chars = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%";
  const arr = new Uint32Array(length);
  crypto.getRandomValues(arr);
  return Array.from(arr, (n) => chars[n % chars.length]).join("");
}

export default function Manager() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState(generatePassword());
  const [deleteTarget, setDeleteTarget] = useState<Manager | null>(null);

  const { data: managers = [], isLoading } = useQuery({
    queryKey: ["managers"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("managers")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Manager[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const mail = email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) throw new Error("Bitte eine gültige E-Mail eingeben");
      if (password.length < 8) throw new Error("Passwort muss mindestens 8 Zeichen haben");

      const { data, error } = await supabase.functions.invoke("create-manager-account", {
        body: { email: mail, password, display_name: displayName.trim() || null },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error(JSON.stringify((data as any).error));
      return mail;
    },
    onSuccess: async (mail) => {
      toast.success("Manager-Account erstellt");
      await logActivity({
        action: "Manager angelegt",
        entityType: "manager",
        details: { email: mail },
      });
      setOpen(false);
      setEmail("");
      setDisplayName("");
      setPassword(generatePassword());
      qc.invalidateQueries({ queryKey: ["managers"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Fehler beim Anlegen"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (m: Manager) => {
      const { data, error } = await supabase.functions.invoke("delete-manager-account", {
        body: { manager_id: m.id },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error(JSON.stringify((data as any).error));
      return m;
    },
    onSuccess: async (m) => {
      toast.success("Manager gelöscht");
      await logActivity({
        action: "Manager gelöscht",
        entityType: "manager",
        details: { email: m.email },
      });
      setDeleteTarget(null);
      qc.invalidateQueries({ queryKey: ["managers"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Fehler beim Löschen"),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Manager</h1>
          <p className="text-sm text-muted-foreground">
            Manager-Accounts haben ausschließlich Zugriff auf die Bewerbungsgespräche.
          </p>
        </div>
        <Button
          onClick={() => {
            setPassword(generatePassword());
            setOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Manager anlegen
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Manager-Accounts
          </CardTitle>
          <CardDescription>
            {managers.length} {managers.length === 1 ? "Account" : "Accounts"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : managers.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Noch keine Manager angelegt.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>E-Mail</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Angelegt am</TableHead>
                  <TableHead className="w-16" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {managers.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.email}</TableCell>
                    <TableCell className="text-muted-foreground">{m.display_name ?? "–"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(m.created_at).toLocaleDateString("de-DE")}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(m)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manager anlegen</DialogTitle>
            <DialogDescription>
              Der Account kann sich anschließend unter /auth anmelden und sieht nur die
              Bewerbungsgespräche.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mgr-email">E-Mail</Label>
              <Input
                id="mgr-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="manager@sekretariat-24.de"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mgr-name">Name (optional)</Label>
              <Input
                id="mgr-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Max Mustermann"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mgr-pass">Passwort</Label>
              <div className="flex gap-2">
                <Input
                  id="mgr-pass"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="font-mono"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setPassword(generatePassword())}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Bitte notieren – das Passwort wird nicht gespeichert.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Erstellen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Manager löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Der Account {deleteTarget?.email} wird dauerhaft entfernt und kann sich nicht mehr
              anmelden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
