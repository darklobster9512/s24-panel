import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useForm, UseFormReturn, FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, Loader2, Save, FileText } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader, Panel } from "@/components/superadmin/SuperadminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";

const draftSchema = z.object({
  company_name: z.string().trim().max(200).optional().or(z.literal("")),
  website: z.string().trim().max(300).optional().or(z.literal("")),
  company_description: z.string().trim().max(2000).optional().or(z.literal("")),
  industry: z.string().trim().max(120).optional().or(z.literal("")),
  contact_person: z.string().trim().max(200).optional().or(z.literal("")),
  street: z.string().trim().max(200).optional().or(z.literal("")),
  postal_code: z.string().trim().max(20).optional().or(z.literal("")),
  city: z.string().trim().max(120).optional().or(z.literal("")),
  vat_id: z.string().trim().max(50).optional().or(z.literal("")),
  phone: z.string().trim().max(50).optional().or(z.literal("")),
  email: z
    .string()
    .trim()
    .max(200)
    .email("Ungültige E-Mail")
    .optional()
    .or(z.literal("")),
  contact_phone: z.string().trim().max(50).optional().or(z.literal("")),
  contact_email: z
    .string()
    .trim()
    .max(200)
    .email("Ungültige E-Mail")
    .optional()
    .or(z.literal("")),
  greeting_text: z.string().trim().max(1000).optional().or(z.literal("")),
  forwarding_enabled: z.boolean(),
});

const fullSchema = z.object({
  company_name: z.string().trim().min(1, "Pflichtfeld").max(200),
  website: z.string().trim().min(1, "Pflichtfeld").max(300),
  company_description: z.string().trim().min(1, "Pflichtfeld").max(2000),
  industry: z.string().trim().min(1, "Pflichtfeld").max(120),
  contact_person: z.string().trim().min(1, "Pflichtfeld").max(200),
  street: z.string().trim().min(1, "Pflichtfeld").max(200),
  postal_code: z.string().trim().min(1, "Pflichtfeld").max(20),
  city: z.string().trim().min(1, "Pflichtfeld").max(120),
  vat_id: z.string().trim().min(1, "Pflichtfeld").max(50),
  phone: z.string().trim().min(1, "Pflichtfeld").max(50),
  email: z.string().trim().email("Ungültige E-Mail").max(200),
  contact_phone: z.string().trim().max(50).optional().or(z.literal("")),
  contact_email: z
    .string()
    .trim()
    .max(200)
    .email("Ungültige E-Mail")
    .optional()
    .or(z.literal("")),
  greeting_text: z.string().trim().min(1, "Pflichtfeld").max(1000),
  forwarding_enabled: z.boolean(),
});

type FormValues = z.infer<typeof draftSchema>;
type Field = FieldPath<FormValues>;

type StepDef = {
  title: string;
  description: string;
  fields: Field[];
};

const STEPS: StepDef[] = [
  {
    title: "Unternehmen",
    description: "Basisdaten der Firma und Beschreibung des Geschäfts.",
    fields: ["company_name", "website", "industry", "vat_id", "company_description"],
  },
  {
    title: "Adresse & Kontakt",
    description: "Firmensitz und geschäftliche Kontaktdaten.",
    fields: ["street", "postal_code", "city", "phone", "email"],
  },
  {
    title: "Ansprechpartner",
    description: "Feste Kontaktperson für Rückfragen und Weiterleitungen.",
    fields: ["contact_person", "contact_phone", "contact_email"],
  },
  {
    title: "Rufnummern",
    description:
      "sipgate-Rufnummern, unter denen der Kunde erreichbar ist. Sie werden zur automatischen Kunden-Erkennung bei eingehenden Anrufen genutzt.",
    fields: [],
  },
  {
    title: "Konfiguration",
    description: "Logo, Begrüßung und Weiterleitungs-Einstellungen.",
    fields: ["greeting_text", "forwarding_enabled"],
  },
];

const DEFAULTS: FormValues = {
  company_name: "",
  website: "",
  company_description: "",
  industry: "",
  contact_person: "",
  street: "",
  postal_code: "",
  city: "",
  vat_id: "",
  phone: "",
  email: "",
  contact_phone: "",
  contact_email: "",
  greeting_text: "",
  forwarding_enabled: false,
};

const NULLABLE_STRINGS: Field[] = [
  "company_name",
  "website",
  "company_description",
  "industry",
  "contact_person",
  "street",
  "postal_code",
  "city",
  "vat_id",
  "phone",
  "email",
  "contact_phone",
  "contact_email",
  "greeting_text",
];

function normalize(values: FormValues) {
  const out: Record<string, unknown> = { ...values };
  for (const key of NULLABLE_STRINGS) {
    const v = out[key];
    if (typeof v === "string" && v.trim() === "") out[key] = null;
  }
  return out;
}

export default function KundenWizard({ mode }: { mode: "create" | "edit" }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [step, setStep] = useState(0);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(draftSchema),
    defaultValues: DEFAULTS,
  });

  const existing = useQuery({
    enabled: mode === "edit" && !!id,
    queryKey: ["client", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (mode === "edit" && existing.data) {
      form.reset({
        company_name: existing.data.company_name ?? "",
        website: existing.data.website ?? "",
        company_description: existing.data.company_description ?? "",
        industry: existing.data.industry ?? "",
        contact_person: existing.data.contact_person ?? "",
        street: existing.data.street ?? "",
        postal_code: existing.data.postal_code ?? "",
        city: existing.data.city ?? "",
        vat_id: existing.data.vat_id ?? "",
        phone: existing.data.phone ?? "",
        email: existing.data.email ?? "",
        contact_phone: existing.data.contact_phone ?? "",
        contact_email: existing.data.contact_email ?? "",
        greeting_text: existing.data.greeting_text ?? "",
        forwarding_enabled: existing.data.forwarding_enabled ?? false,
      });
    }
  }, [mode, existing.data, form]);

  async function uploadLogoIfNeeded() {
    if (!logoFile) return undefined;
    const ext = logoFile.name.split(".").pop() || "png";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("client-logos")
      .upload(path, logoFile, { upsert: false, contentType: logoFile.type });
    if (upErr) throw upErr;
    return path;
  }

  const submitMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (!user) throw new Error("Nicht angemeldet");
      const parsed = fullSchema.safeParse(values);
      if (!parsed.success) {
        let firstErrStep = -1;
        for (const issue of parsed.error.issues) {
          const path = issue.path[0] as Field;
          form.setError(path, { message: issue.message });
          if (firstErrStep === -1) {
            const stepIdx = STEPS.findIndex((s) => s.fields.includes(path));
            if (stepIdx >= 0) firstErrStep = stepIdx;
          }
        }
        if (firstErrStep >= 0) setStep(firstErrStep);
        throw new Error("Bitte alle Pflichtfelder ausfüllen.");
      }

      const logo_url = await uploadLogoIfNeeded();
      const base = normalize(values);

      if (mode === "edit" && id) {
        const payload = {
          ...base,
          is_draft: false,
          ...(logo_url !== undefined ? { logo_url } : {}),
        };
        const { error } = await supabase.from("clients").update(payload).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("clients").insert({
          ...base,
          is_draft: false,
          logo_url: logo_url ?? null,
          created_by: user.id,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(mode === "edit" ? "Kunde aktualisiert" : "Kunde angelegt");
      qc.invalidateQueries({ queryKey: ["clients"] });
      if (id) qc.invalidateQueries({ queryKey: ["client", id] });
      navigate("/superadmin/kunden");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const draftMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Nicht angemeldet");
      const values = form.getValues();
      const logo_url = await uploadLogoIfNeeded();
      const base = normalize(values);

      if (mode === "edit" && id) {
        const payload = {
          ...base,
          is_draft: true,
          ...(logo_url !== undefined ? { logo_url } : {}),
        };
        const { error } = await supabase.from("clients").update(payload).eq("id", id);
        if (error) throw error;
        return { id };
      } else {
        const { data, error } = await supabase
          .from("clients")
          .insert({
            ...base,
            is_draft: true,
            logo_url: logo_url ?? null,
            created_by: user.id,
          })
          .select("id")
          .single();
        if (error) throw error;
        return { id: data.id as string };
      }
    },
    onSuccess: (res) => {
      toast.success("Als Entwurf gespeichert");
      qc.invalidateQueries({ queryKey: ["clients"] });
      qc.invalidateQueries({ queryKey: ["client", res.id] });
      setLogoFile(null);
      if (mode === "create") {
        navigate(`/superadmin/kunden/bearbeiten/${res.id}`, { replace: true });
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const isLast = step === STEPS.length - 1;
  const busy = submitMutation.isPending || draftMutation.isPending;
  const current = STEPS[step];

  function onSubmit(values: FormValues) {
    submitMutation.mutate(values);
  }

  const loading = mode === "edit" && existing.isLoading;

  return (
    <>
      <PageHeader
        title={mode === "edit" ? "Kunde bearbeiten" : "Kunde anlegen"}
        subtitle={
          mode === "edit"
            ? "Firmendaten aktualisieren."
            : "In wenigen Schritten einen neuen Kunden anlegen."
        }
        actions={
          <Button asChild variant="outline" size="sm">
            <Link to="/superadmin/kunden">
              <ArrowLeft className="mr-2 h-4 w-4" /> Zurück
            </Link>
          </Button>
        }
      />

      <Panel className="overflow-hidden !p-0">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Lade Kunde…
          </div>
        ) : (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="grid lg:grid-cols-[280px_1fr]"
            >
              {/* Sidebar Stepper (desktop) */}
              <aside className="hidden border-r border-border/60 bg-muted/20 p-6 lg:block">
                <div className="sticky top-6">
                  <p className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Fortschritt
                  </p>
                  <VerticalStepper current={step} onJump={setStep} />
                </div>
              </aside>

              {/* Mobile Stepper */}
              <div className="border-b border-border/60 bg-muted/20 p-4 lg:hidden">
                <HorizontalStepper current={step} onJump={setStep} />
              </div>

              {/* Content */}
              <div className="flex min-h-[520px] flex-col">
                <div className="flex-1 space-y-6 p-6 lg:p-10">
                  <header className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wider text-primary">
                      Schritt {step + 1} von {STEPS.length}
                    </p>
                    <h2 className="text-2xl font-semibold tracking-tight">
                      {current.title}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {current.description}
                    </p>
                  </header>

                  <div className="pt-2">
                    {step === 0 && <StepUnternehmen form={form} />}
                    {step === 1 && <StepAdresseKontakt form={form} />}
                    {step === 2 && <StepAnsprechpartner form={form} />}
                    {step === 3 && (
                      <StepKonfig
                        form={form}
                        logoFile={logoFile}
                        setLogoFile={setLogoFile}
                        existingLogo={existing.data?.logo_url ?? null}
                      />
                    )}
                  </div>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-border/60 bg-background/60 p-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between lg:px-10">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setStep((s) => Math.max(0, s - 1))}
                    disabled={step === 0 || busy}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Zurück
                  </Button>

                  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => draftMutation.mutate()}
                      disabled={busy}
                    >
                      {draftMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <FileText className="mr-2 h-4 w-4" />
                      )}
                      Als Entwurf speichern
                    </Button>

                    {isLast ? (
                      <Button type="submit" disabled={busy}>
                        {submitMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="mr-2 h-4 w-4" />
                        )}
                        {mode === "edit" ? "Speichern" : "Kunde anlegen"}
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        onClick={() =>
                          setStep((s) => Math.min(s + 1, STEPS.length - 1))
                        }
                        disabled={busy}
                      >
                        Weiter <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </form>
          </Form>
        )}
      </Panel>
    </>
  );
}

function VerticalStepper({
  current,
  onJump,
}: {
  current: number;
  onJump: (i: number) => void;
}) {
  return (
    <ol className="space-y-1">
      {STEPS.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={s.title}>
            <button
              type="button"
              onClick={() => onJump(i)}
              className={cn(
                "group flex w-full items-start gap-3 rounded-lg border border-transparent px-3 py-2.5 text-left transition",
                active && "border-primary/40 bg-primary/10",
                !active && "hover:bg-muted/60",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold transition",
                  active && "bg-primary text-primary-foreground",
                  done && "bg-primary/20 text-primary",
                  !active && !done && "bg-muted text-muted-foreground",
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={cn(
                    "block text-sm font-medium",
                    active ? "text-foreground" : "text-foreground/80",
                  )}
                >
                  {s.title}
                </span>
                <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                  {s.description}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function HorizontalStepper({
  current,
  onJump,
}: {
  current: number;
  onJump: (i: number) => void;
}) {
  return (
    <ol className="flex items-center gap-1 overflow-x-auto">
      {STEPS.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={s.title} className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onJump(i)}
              className={cn(
                "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition",
                active && "border-primary bg-primary/10 text-primary",
                done && "border-primary/40 bg-primary/5 text-foreground",
                !active && !done && "border-border text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full text-[11px]",
                  active && "bg-primary text-primary-foreground",
                  done && "bg-primary/20 text-primary",
                  !active && !done && "bg-muted",
                )}
              >
                {done ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              {active && <span className="whitespace-nowrap">{s.title}</span>}
            </button>
            {i < STEPS.length - 1 && (
              <span className="h-px w-3 shrink-0 bg-border" />
            )}
          </li>
        );
      })}
    </ol>
  );
}

type FR = UseFormReturn<FormValues>;

function TextField({
  form,
  name,
  label,
  type = "text",
  placeholder,
  className,
}: {
  form: FR;
  name: Field;
  label: string;
  type?: string;
  placeholder?: string;
  className?: string;
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              type={type}
              placeholder={placeholder}
              {...field}
              value={(field.value as string) ?? ""}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function StepUnternehmen({ form }: { form: FR }) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <TextField form={form} name="company_name" label="Unternehmen" placeholder="Muster GmbH" />
      <TextField form={form} name="website" label="Website" placeholder="https://muster.de" />
      <TextField form={form} name="industry" label="Branche" placeholder="Handwerk, IT, Kanzlei, …" />
      <TextField form={form} name="vat_id" label="USt-ID" placeholder="DE123456789" />
      <FormField
        control={form.control}
        name="company_description"
        render={({ field }) => (
          <FormItem className="md:col-span-2">
            <FormLabel>Firmeninhalt</FormLabel>
            <FormControl>
              <Textarea
                rows={5}
                placeholder="Kurze Beschreibung, was das Unternehmen macht…"
                {...field}
                value={(field.value as string) ?? ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

function StepAdresseKontakt({ form }: { form: FR }) {
  return (
    <div className="grid gap-5 md:grid-cols-6">
      <TextField
        form={form}
        name="street"
        label="Straße & Hausnummer"
        placeholder="Musterstraße 12"
        className="md:col-span-6"
      />
      <TextField
        form={form}
        name="postal_code"
        label="PLZ"
        placeholder="10115"
        className="md:col-span-2"
      />
      <TextField
        form={form}
        name="city"
        label="Stadt"
        placeholder="Berlin"
        className="md:col-span-4"
      />
      <TextField
        form={form}
        name="phone"
        label="Telefonnummer"
        placeholder="+49 30 1234567"
        className="md:col-span-3"
      />
      <TextField
        form={form}
        name="email"
        label="E-Mail"
        type="email"
        placeholder="info@muster.de"
        className="md:col-span-3"
      />
    </div>
  );
}

function StepAnsprechpartner({ form }: { form: FR }) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <TextField
        form={form}
        name="contact_person"
        label="Name"
        placeholder="Max Mustermann"
        className="md:col-span-2"
      />
      <TextField
        form={form}
        name="contact_phone"
        label="Telefon (optional)"
        placeholder="+49 170 1234567"
      />
      <TextField
        form={form}
        name="contact_email"
        label="E-Mail (optional)"
        type="email"
        placeholder="max@muster.de"
      />
    </div>
  );
}

function StepKonfig({
  form,
  logoFile,
  setLogoFile,
  existingLogo,
}: {
  form: FR;
  logoFile: File | null;
  setLogoFile: (f: File | null) => void;
  existingLogo: string | null;
}) {
  const logoLabel = useMemo(() => {
    if (logoFile) return logoFile.name;
    if (existingLogo) return `Aktuell: ${existingLogo}`;
    return null;
  }, [logoFile, existingLogo]);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-5">
        <div className="space-y-2">
          <Label>Logo (optional)</Label>
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
          />
          {logoLabel && (
            <p className="text-xs text-muted-foreground">{logoLabel}</p>
          )}
        </div>

        <FormField
          control={form.control}
          name="forwarding_enabled"
          render={({ field }) => (
            <FormItem className="flex items-start gap-3 space-y-0 rounded-lg border border-border/60 bg-muted/30 p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="mt-0.5"
                />
              </FormControl>
              <div className="space-y-1">
                <FormLabel className="!mt-0 cursor-pointer">
                  Weiterleitung erwünscht
                </FormLabel>
                <p className="text-xs text-muted-foreground">
                  Anrufe werden an den Ansprechpartner durchgestellt.
                </p>
              </div>
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="greeting_text"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Begrüßungstext</FormLabel>
            <FormControl>
              <Textarea
                rows={8}
                placeholder="Guten Tag, Sie sind verbunden mit …"
                {...field}
                value={(field.value as string) ?? ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
