import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import SignatureCanvas from "react-signature-canvas";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileSignature,
  Check,
  Loader2,
  PenLine,
  RotateCcw,
  User,
  Landmark,
  ShieldCheck,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader, Panel } from "@/components/mitarbeiter/MitarbeiterLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { renderContractHtml } from "@/lib/render-contract";

type PhaseState = "preview" | "wizard" | "sign" | "done";

type ContractData = {
  id: string;
  employee_id: string;
  template_id: string;
  status: "pending_employee" | "pending_admin" | "completed";
  employee_signature_data_url: string | null;
  signed_at: string | null;
  pdf_path: string | null;
  employee: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    login_email: string | null;
    personal_email: string | null;
    personal_phone: string | null;
    contract_type: string | null;
    start_date: string | null;
    salary: number | null;
    birth_date: string | null;
    birth_place: string | null;
    nationality: string | null;
    marital_status: string | null;
    iban: string | null;
    bic: string | null;
    bank_name: string | null;
    tax_id: string | null;
    social_security_number: string | null;
    health_insurance: string | null;
  };
  template: {
    id: string;
    title: string;
    content_html: string;
    monthly_salary: number | null;
  };
};

function formatIBAN(raw: string): string {
  const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 34);
  return clean.replace(/(.{4})/g, "$1 ").trim();
}

const wizardSchema = z.object({
  birth_date: z.string().min(1, "Pflichtfeld"),
  birth_place: z.string().trim().min(1, "Pflichtfeld"),
  nationality: z.string().trim().min(1, "Pflichtfeld"),
  marital_status: z.string().trim().min(1, "Pflichtfeld"),
  iban: z.string().trim().min(1, "Pflichtfeld"),
  bic: z.string().trim().min(1, "Pflichtfeld"),
  bank_name: z.string().trim().min(1, "Pflichtfeld"),
  tax_id: z.string().trim().min(1, "Pflichtfeld"),
  social_security_number: z.string().trim().min(1, "Pflichtfeld"),
  health_insurance: z.string().trim().min(1, "Pflichtfeld"),
});
type WizardValues = z.infer<typeof wizardSchema>;

export default function Arbeitsvertrag() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [phase, setPhase] = useState<PhaseState>("preview");
  const [subStep, setSubStep] = useState<0 | 1 | 2>(0);
  const sigRef = useRef<SignatureCanvas>(null);
  const [pdfSignedUrl, setPdfSignedUrl] = useState<string | null>(null);

  const q = useQuery({
    enabled: !!user,
    queryKey: ["my-contract-full", user?.id],
    queryFn: async () => {
      const { data: emp } = await supabase
        .from("employees")
        .select("id")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (!emp) return null;
      const { data, error } = await (supabase as any)
        .from("employee_contracts")
        .select(
          "id, employee_id, template_id, status, employee_signature_data_url, signed_at, pdf_path, employee:employees(*), template:contract_templates(id, title, content_html, monthly_salary)",
        )
        .eq("employee_id", (emp as { id: string }).id)
        .maybeSingle();
      if (error) throw error;
      return data as ContractData | null;
    },
  });

  useEffect(() => {
    (async () => {
      if (q.data?.pdf_path) {
        const { data } = await supabase.storage
          .from("contract-assets")
          .createSignedUrl(q.data.pdf_path, 3600);
        setPdfSignedUrl(data?.signedUrl ?? null);
      }
    })();
  }, [q.data?.pdf_path]);

  const form = useForm<WizardValues>({
    resolver: zodResolver(wizardSchema),
    defaultValues: {
      birth_date: "",
      birth_place: "",
      nationality: "",
      marital_status: "",
      iban: "",
      bic: "",
      bank_name: "",
      tax_id: "",
      social_security_number: "",
      health_insurance: "",
    },
  });

  useEffect(() => {
    const e = q.data?.employee;
    if (!e) return;
    form.reset({
      birth_date: e.birth_date ?? "",
      birth_place: e.birth_place ?? "",
      nationality: e.nationality ?? "",
      marital_status: e.marital_status ?? "",
      iban: formatIBAN(e.iban ?? ""),
      bic: e.bic ?? "",
      bank_name: e.bank_name ?? "",
      tax_id: e.tax_id ?? "",
      social_security_number: e.social_security_number ?? "",
      health_insurance: e.health_insurance ?? "",
    });
  }, [q.data?.employee, form]);

  const renderedHtml = useMemo(() => {
    const c = q.data;
    if (!c || !c.template) return "";
    const values = form.watch();
    const e = c.employee;
    return renderContractHtml(c.template.content_html, {
      vorname: e.first_name,
      nachname: e.last_name,
      email: e.personal_email ?? e.login_email,
      telefon: e.personal_phone,
      geburtsdatum: values.birth_date || e.birth_date,
      geburtsort: values.birth_place || e.birth_place,
      familienstand: values.marital_status || e.marital_status,
      beschaeftigungsart: e.contract_type,
      startdatum: e.start_date,
      iban: values.iban || e.iban,
      bic: values.bic || e.bic,
      bank: values.bank_name || e.bank_name,
      steuer_id: values.tax_id || e.tax_id,
      sv_nummer: values.social_security_number || e.social_security_number,
      krankenkasse: values.health_insurance || e.health_insurance,
      monatsgehalt: e.salary ?? c.template.monthly_salary,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q.data, form.watch()]);

  const saveDataMutation = useMutation({
    mutationFn: async (values: WizardValues) => {
      if (!q.data) throw new Error("Kein Vertrag");
      const { error } = await supabase
        .from("employees")
        .update({
          birth_date: values.birth_date || null,
          birth_place: values.birth_place || null,
          nationality: values.nationality || null,
          marital_status: values.marital_status || null,
          iban: values.iban || null,
          bic: values.bic || null,
          bank_name: values.bank_name || null,
          tax_id: values.tax_id || null,
          social_security_number: values.social_security_number || null,
          health_insurance: values.health_insurance || null,
        })
        .eq("id", q.data.employee_id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-contract-full", user?.id] });
      setPhase("sign");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const signMutation = useMutation({
    mutationFn: async () => {
      if (!q.data) throw new Error("Kein Vertrag");
      if (!sigRef.current || sigRef.current.isEmpty()) {
        throw new Error("Bitte unterschreibe zuerst.");
      }
      const dataUrl = sigRef.current.getCanvas().toDataURL("image/png");
      const { error } = await (supabase as any)
        .from("employee_contracts")
        .update({
          employee_signature_data_url: dataUrl,
          signed_at: new Date().toISOString(),
          status: "pending_admin",
        })
        .eq("id", q.data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Danke — dein Vertrag wurde eingereicht.");
      qc.invalidateQueries({ queryKey: ["my-contract-full", user?.id] });
      qc.invalidateQueries({ queryKey: ["my-contract", user?.id] });
      setPhase("done");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (q.isLoading) {
    return (
      <Panel>
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Lade…
        </div>
      </Panel>
    );
  }

  if (!q.data || !q.data.template) {
    return (
      <>
        <PageHeader title="Arbeitsvertrag" subtitle="" />
        <Panel>
          <p className="py-8 text-center text-sm text-muted-foreground">
            {!q.data
              ? "Dir ist aktuell kein Arbeitsvertrag zugewiesen."
              : "Die zugewiesene Vertragsvorlage wurde nicht gefunden. Bitte kontaktiere das Management."}
          </p>
        </Panel>
      </>
    );
  }


  const c = q.data;

  // Status: pending_admin or completed → show wait / download state
  if (c.status === "pending_admin") {
    return (
      <>
        <PageHeader
          title="Arbeitsvertrag"
          subtitle={c.template.title}
          actions={<Badge>Warten auf Bestätigung</Badge>}
        />
        <Panel>
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <CheckCircle2 className="h-10 w-10 text-primary" />
            <h3 className="text-lg font-semibold">Vielen Dank!</h3>
            <p className="max-w-md text-sm text-muted-foreground">
              Du hast deinen Arbeitsvertrag unterschrieben und eingereicht. Sobald das
              Management den Vertrag bestätigt hat, kannst du ihn hier als PDF herunterladen.
            </p>
          </div>
        </Panel>
      </>
    );
  }

  if (c.status === "completed") {
    return (
      <>
        <PageHeader
          title="Arbeitsvertrag"
          subtitle={c.template.title}
          actions={<Badge>Abgeschlossen</Badge>}
        />
        <Panel>
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <FileSignature className="h-10 w-10 text-primary" />
            <h3 className="text-lg font-semibold">Vertrag abgeschlossen</h3>
            <p className="max-w-md text-sm text-muted-foreground">
              Dein Arbeitsvertrag wurde bestätigt und ist unten als PDF verfügbar.
            </p>
            {pdfSignedUrl ? (
              <Button asChild className="gap-2">
                <a href={pdfSignedUrl} target="_blank" rel="noreferrer">
                  <FileSignature className="h-4 w-4" /> PDF öffnen
                </a>
              </Button>
            ) : (
              <p className="text-xs text-muted-foreground">PDF wird geladen…</p>
            )}
          </div>
        </Panel>
      </>
    );
  }

  // pending_employee — 3 phases
  return (
    <>
      <PageHeader
        title="Arbeitsvertrag ausfüllen"
        subtitle={c.template.title}
        actions={
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Zurück
          </Button>
        }
      />

      <div className="mb-4 flex gap-2">
        <PhaseBadge label="1. Vorschau" active={phase === "preview"} />
        <PhaseBadge label="2. Daten" active={phase === "wizard"} />
        <PhaseBadge label="3. Signatur" active={phase === "sign"} />
      </div>

      {phase === "preview" && (
        <Panel className="!p-0">
          <div className="max-h-[70vh] overflow-y-auto p-6">
            <div
              className="prose prose-sm mx-auto max-w-3xl rounded-lg bg-white p-8 text-black"
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{ __html: renderedHtml }}
            />
          </div>
          <div className="flex justify-end border-t border-border/60 p-4">
            <Button onClick={() => setPhase("wizard")} className="gap-2">
              Vertrag bestätigen & Daten ausfüllen <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </Panel>
      )}

      {phase === "wizard" && (
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <Panel>
            <SubStepper current={subStep} onSelect={setSubStep} />
          </Panel>
          <Panel>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((v) => saveDataMutation.mutate(v))}
                className="space-y-5"
              >
                <div>
                  <h3 className="text-base font-semibold">
                    {SUB_STEPS[subStep].title}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {SUB_STEPS[subStep].description}
                  </p>
                </div>

                {subStep === 0 && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <TF form={form} name="birth_date" label="Geburtsdatum" type="date" placeholder="TT.MM.JJJJ" />
                    <TF form={form} name="birth_place" label="Geburtsort" placeholder="z.B. Berlin" />
                    <TF form={form} name="nationality" label="Nationalität" placeholder="z.B. Deutsch" />
                    <TF form={form} name="marital_status" label="Familienstand" placeholder="z.B. ledig, verheiratet" />
                  </div>
                )}

                {subStep === 1 && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <TF form={form} name="iban" label="IBAN" placeholder="DE00 0000 0000 0000 0000 00" className="md:col-span-2" />
                    <TF form={form} name="bic" label="BIC" placeholder="z.B. DEUTDEFFXXX" />
                    <TF form={form} name="bank_name" label="Bank" placeholder="z.B. Deutsche Bank" />
                    <TF form={form} name="tax_id" label="Steuer-ID" placeholder="11-stellige Steuer-ID" className="md:col-span-2" />
                  </div>
                )}

                {subStep === 2 && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <TF form={form} name="social_security_number" label="SV-Nummer" placeholder="z.B. 12 345678 A 901" />
                    <TF form={form} name="health_insurance" label="Krankenkasse" placeholder="z.B. TK, AOK, Barmer" />
                  </div>
                )}

                <div className="flex justify-between border-t border-border/60 pt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      if (subStep === 0) setPhase("preview");
                      else setSubStep((s) => (s - 1) as 0 | 1 | 2);
                    }}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Zurück
                  </Button>
                  {subStep < 2 ? (
                    <Button
                      type="button"
                      className="gap-2"
                      onClick={async () => {
                        const ok = await form.trigger(SUB_STEPS[subStep].fields);
                        if (ok) setSubStep((s) => (s + 1) as 0 | 1 | 2);
                      }}
                    >
                      Weiter <ArrowRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button type="submit" disabled={saveDataMutation.isPending} className="gap-2">
                      {saveDataMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ArrowRight className="h-4 w-4" />
                      )}
                      Speichern & signieren
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </Panel>
        </div>
      )}

      {phase === "sign" && (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <Panel className="!p-0">
            <div className="max-h-[70vh] overflow-y-auto p-6">
              <div
                className="prose prose-sm mx-auto max-w-3xl rounded-lg bg-white p-8 text-black"
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{ __html: renderedHtml }}
              />
            </div>
          </Panel>
          <Panel>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <PenLine className="h-4 w-4" /> Digital signieren
            </h3>
            <p className="mb-3 text-xs text-muted-foreground">
              Unterschreibe mit Maus oder Finger im Feld unten.
            </p>
            <div className="overflow-hidden rounded-lg border border-border/60 bg-white">
              <SignatureCanvas
                ref={sigRef}
                penColor="#111"
                canvasProps={{ className: "w-full h-40" }}
              />
            </div>
            <div className="mt-3 flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => sigRef.current?.clear()}
                className="gap-2"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Zurücksetzen
              </Button>
            </div>
            <div className="mt-6 flex flex-col gap-2">
              <Button
                onClick={() => signMutation.mutate()}
                disabled={signMutation.isPending}
                className="gap-2"
              >
                {signMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Unterschreiben & einreichen
              </Button>
              <Button type="button" variant="ghost" onClick={() => setPhase("wizard")}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Daten bearbeiten
              </Button>
            </div>
          </Panel>
        </div>
      )}
    </>
  );
}

function PhaseBadge({ label, active }: { label: string; active: boolean }) {
  return (
    <span
      className={
        active
          ? "rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-ink-deep"
          : "rounded-full border border-border/60 px-3 py-1 text-xs font-medium text-muted-foreground"
      }
    >
      {label}
    </span>
  );
}

function TF({
  form,
  name,
  label,
  type = "text",
  className,
  placeholder,
}: {
  form: ReturnType<typeof useForm<WizardValues>>;
  name: keyof WizardValues;
  label: string;
  type?: string;
  className?: string;
  placeholder?: string;
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input type={type} placeholder={placeholder} {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

const SUB_STEPS: {
  title: string;
  description: string;
  icon: typeof User;
  fields: (keyof WizardValues)[];
}[] = [
  {
    title: "Persönliches",
    description: "Geburt, Herkunft & Familienstand",
    icon: User,
    fields: ["birth_date", "birth_place", "nationality", "marital_status"],
  },
  {
    title: "Bankdaten",
    description: "Konto & Steuer-ID",
    icon: Landmark,
    fields: ["iban", "bic", "bank_name", "tax_id"],
  },
  {
    title: "Sozialversicherung",
    description: "SV-Nummer & Krankenkasse",
    icon: ShieldCheck,
    fields: ["social_security_number", "health_insurance"],
  },
];

function SubStepper({
  current,
  onSelect,
}: {
  current: number;
  onSelect: (i: 0 | 1 | 2) => void;
}) {
  return (
    <ol className="space-y-2">
      {SUB_STEPS.map((s, i) => {
        const active = i === current;
        const done = i < current;
        const Icon = s.icon;
        return (
          <li key={s.title}>
            <button
              type="button"
              onClick={() => onSelect(i as 0 | 1 | 2)}
              className={
                "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors " +
                (active
                  ? "border-primary bg-primary/10"
                  : "border-border/60 hover:border-border hover:bg-muted/40")
              }
            >
              <span
                className={
                  "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold " +
                  (active
                    ? "border-primary bg-primary text-primary-foreground"
                    : done
                      ? "border-primary bg-primary/20 text-primary"
                      : "border-border/60 bg-muted text-muted-foreground")
                }
              >
                {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </span>
              <span className="flex flex-col">
                <span
                  className={
                    "text-sm font-medium " +
                    (active ? "text-foreground" : "text-foreground/80")
                  }
                >
                  {i + 1}. {s.title}
                </span>
                <span className="text-xs text-muted-foreground">{s.description}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

