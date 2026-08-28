import { useEffect, useMemo, useState } from "react";
import { PageHeader, Panel } from "@/components/superadmin/SuperadminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Plus, X, Search, Building2, UserRound, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

type Employee = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  login_email: string | null;
  contract_type: string | null;
};

type Client = {
  id: string;
  company_name: string | null;
  industry: string | null;
  logo_url: string | null;
};

type Assignment = {
  id: string;
  employee_id: string;
  client_id: string;
};

function initials(a?: string | null, b?: string | null) {
  return `${(a?.[0] ?? "").toUpperCase()}${(b?.[0] ?? "").toUpperCase()}` || "?";
}

export default function Zuweisungen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [logoUrls, setLogoUrls] = useState<Map<string, string>>(new Map());
  const [dialogClient, setDialogClient] = useState<Client | null>(null);
  const [search, setSearch] = useState("");

  async function load() {
    setLoading(true);
    const [empRes, cliRes, assRes] = await Promise.all([
      supabase
        .from("employees")
        .select("id, first_name, last_name, login_email, contract_type")
        .eq("is_draft", false)
        .order("last_name", { ascending: true }),
      supabase
        .from("clients")
        .select("id, company_name, industry, logo_url")
        .eq("is_draft", false)
        .order("company_name", { ascending: true }),
      supabase.from("assignments").select("id, employee_id, client_id"),
    ]);

    if (empRes.error) toast.error("Mitarbeiter konnten nicht geladen werden");
    if (cliRes.error) toast.error("Kunden konnten nicht geladen werden");
    if (assRes.error) toast.error("Zuweisungen konnten nicht geladen werden");

    setEmployees(empRes.data ?? []);
    setClients(cliRes.data ?? []);
    setAssignments(assRes.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const paths = clients
      .map((c) => c.logo_url)
      .filter((p): p is string => !!p && !p.startsWith("http"));
    if (paths.length === 0) {
      setLogoUrls(new Map());
      return;
    }
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.storage
        .from("client-logos")
        .createSignedUrls(paths, 3600);
      if (cancelled || error || !data) return;
      const map = new Map<string, string>();
      for (const c of clients) {
        if (!c.logo_url) continue;
        if (c.logo_url.startsWith("http")) {
          map.set(c.id, c.logo_url);
          continue;
        }
        const entry = data.find((d) => d.path === c.logo_url);
        if (entry?.signedUrl) map.set(c.id, entry.signedUrl);
      }
      setLogoUrls(map);
    })();
    return () => {
      cancelled = true;
    };
  }, [clients]);

  const employeesById = useMemo(
    () => new Map(employees.map((e) => [e.id, e])),
    [employees],
  );

  const byClient = useMemo(() => {
    const m = new Map<string, Assignment[]>();
    for (const a of assignments) {
      if (!m.has(a.client_id)) m.set(a.client_id, []);
      m.get(a.client_id)!.push(a);
    }
    return m;
  }, [assignments]);

  async function assignEmployee(client: Client, employee: Employee) {
    if (!user) return;
    const tempId = `temp-${crypto.randomUUID()}`;
    const optimistic: Assignment = {
      id: tempId,
      employee_id: employee.id,
      client_id: client.id,
    };
    setAssignments((a) => [...a, optimistic]);
    setDialogClient(null);

    const { data, error } = await supabase
      .from("assignments")
      .insert({
        employee_id: employee.id,
        client_id: client.id,
        created_by: user.id,
      })
      .select("id, employee_id, client_id")
      .single();

    if (error || !data) {
      setAssignments((a) => a.filter((x) => x.id !== tempId));
      toast.error("Zuweisung fehlgeschlagen");
      return;
    }
    setAssignments((a) => a.map((x) => (x.id === tempId ? data : x)));
    toast.success(`${employee.first_name} ${employee.last_name} zugewiesen`);
  }

  async function removeAssignment(a: Assignment) {
    const prev = assignments;
    setAssignments((s) => s.filter((x) => x.id !== a.id));
    const { error } = await supabase.from("assignments").delete().eq("id", a.id);
    if (error) {
      setAssignments(prev);
      toast.error("Entfernen fehlgeschlagen");
      return;
    }
    toast.success("Zuweisung entfernt");
  }

  if (loading) {
    return (
      <>
        <PageHeader
          title="Zuweisungen"
          subtitle="Weise Brandings die Mitarbeiter zu, die dafür Calls und Notizen anlegen dürfen."
        />
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      </>
    );
  }

  if (clients.length === 0) {
    return (
      <>
        <PageHeader
          title="Zuweisungen"
          subtitle="Weise Brandings die Mitarbeiter zu, die dafür Calls und Notizen anlegen dürfen."
        />
        <Panel>
          <div className="flex flex-col items-start gap-3 py-6">
            <p className="text-sm text-muted-foreground">
              Es gibt noch keine Brandings.
            </p>
            <Button asChild>
              <Link to="/superadmin/kunden/anlegen">Kunden anlegen</Link>
            </Button>
          </div>
        </Panel>
      </>
    );
  }

  const availableForDialog = dialogClient
    ? employees.filter(
        (e) =>
          !(byClient.get(dialogClient.id) ?? []).some(
            (a) => a.employee_id === e.id,
          ) &&
          (search.trim() === "" ||
            `${e.first_name ?? ""} ${e.last_name ?? ""}`
              .toLowerCase()
              .includes(search.trim().toLowerCase()) ||
            (e.login_email ?? "")
              .toLowerCase()
              .includes(search.trim().toLowerCase())),
      )
    : [];

  return (
    <>
      <PageHeader
        title="Zuweisungen"
        subtitle="Weise Brandings die Mitarbeiter zu, die dafür Calls und Notizen anlegen dürfen."
      />

      <div className="flex flex-col gap-6">
        {clients.map((client) => {
          const clientAssignments = byClient.get(client.id) ?? [];
          return (
            <Panel key={client.id}>
              <div className="mb-5 flex items-center gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-lg bg-muted">
                  {logoUrls.get(client.id) ? (
                    <img
                      src={logoUrls.get(client.id)}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-semibold">
                    {client.company_name ?? "—"}
                  </h3>
                  <p className="truncate text-xs text-muted-foreground">
                    {client.industry ?? ""}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {clientAssignments.length} Mitarbeiter
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                {clientAssignments.map((a) => {
                  const e = employeesById.get(a.employee_id);
                  if (!e) return null;
                  return (
                    <div
                      key={a.id}
                      className="group relative flex items-center gap-3 rounded-xl border border-border/60 bg-background p-3 transition-colors hover:border-primary/60"
                    >
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/20 text-sm font-semibold text-ink">
                        {initials(e.first_name, e.last_name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="truncate text-sm font-medium">
                            {e.first_name} {e.last_name}
                          </p>
                          {e.contract_type && (
                            <Badge variant="secondary" className="capitalize">
                              {e.contract_type}
                            </Badge>
                          )}
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                          {e.login_email}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAssignment(a)}
                        aria-label="Zuweisung entfernen"
                        className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-md bg-background/80 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}

                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setDialogClient(client);
                  }}
                  className="flex min-h-[68px] items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border/70 bg-transparent p-3 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:bg-primary/5 hover:text-ink"
                >
                  <Plus className="h-4 w-4" /> Zuweisen
                </button>
              </div>
            </Panel>
          );
        })}
      </div>

      <Dialog
        open={!!dialogClient}
        onOpenChange={(o) => !o && setDialogClient(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Mitarbeiter für {dialogClient?.company_name} zuweisen
            </DialogTitle>
            <DialogDescription>
              Wähle einen Mitarbeiter aus, der für dieses Branding Calls und
              Notizen anlegen darf.
            </DialogDescription>
          </DialogHeader>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              placeholder="Mitarbeiter suchen…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="max-h-80 overflow-y-auto rounded-lg border border-border/60">
            {availableForDialog.length === 0 ? (
              <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
                <UserRound className="h-4 w-4" />
                Keine weiteren Mitarbeiter verfügbar.
              </div>
            ) : (
              <ul className="divide-y divide-border/60">
                {availableForDialog.map((e) => (
                  <li key={e.id}>
                    <button
                      type="button"
                      onClick={() =>
                        dialogClient && assignEmployee(dialogClient, e)
                      }
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted"
                    >
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/20 text-xs font-semibold text-ink">
                        {initials(e.first_name, e.last_name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {e.first_name} {e.last_name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {e.login_email}
                        </p>
                      </div>
                      <Plus className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
