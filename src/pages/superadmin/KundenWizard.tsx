import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useForm, UseFormReturn, FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, Loader2, Save } from "lucide-react";

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

const schema = z.object({
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

type FormValues = z.infer<typeof schema>;
type Field = FieldPath<FormValues>;

const STEPS: { title: string; fields: Field[] }[] = [
  {
    title: "Unternehmen",
    fields: ["company_name", "website", "industry", "vat_id", "company_description"],
  },
  { title: "Adresse", fields: ["street", "postal_code", "city"] },
  { title: "Kontakt Firma", fields: ["phone", "email"] },
  {
    title: "Ansprechpartner",
    fields: ["contact_person", "contact_phone", "contact_email"],
  },
  { title: "Konfiguration", fields: ["greeting_text", "forwarding_enabled"] },
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

export default function KundenWizard({ mode }: { mode: "create" | "edit" }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [step, setStep] = useState(0);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
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

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (!user) throw new Error("Nicht angemeldet");

      let logo_url: string | null | undefined = undefined;
      if (logoFile) {
        const ext = logoFile.name.split(".").pop() || "png";
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("client-logos")
          .upload(path, logoFile, { upsert: false, contentType: logoFile.type });
        if (upErr) throw upErr;
        logo_url = path;
      }

      const base = {
        ...values,
        contact_phone: values.contact_phone || null,
        contact_email: values.contact_email || null,
      };

      if (mode === "edit" && id) {
        const payload: Record<string, unknown> = { ...base };
        if (logo_url !== undefined) payload.logo_url = logo_url;
        const { error } = await supabase.from("clients").update(payload).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("clients").insert({
          ...base,
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

  const isLast = step === STEPS.length - 1;

  async function next() {
    const ok = await form.trigger(STEPS[step].fields);
    if (!ok) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function onSubmit(values: FormValues) {
    mutation.mutate(values);
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

      <Panel>
        <Stepper current={step} onJump={setStep} />

        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Lade Kunde…
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-6">
              <div className="min-h-[320px]">
                {step === 0 && <StepUnternehmen form={form} />}
                {step === 1 && <StepAdresse form={form} />}
                {step === 2 && <StepKontakt form={form} />}
                {step === 3 && <StepAnsprechpartner form={form} />}
                {step === 4 && (
                  <StepKonfig
                    form={form}
                    logoFile={logoFile}
                    setLogoFile={setLogoFile}
                    existingLogo={existing.data?.logo_url ?? null}
                  />
                )}
              </div>

              <div className="flex items-center justify-between border-t border-border/60 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep((s) => Math.max(0, s - 1))}
                  disabled={step === 0 || mutation.isPending}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Zurück
                </Button>

                {isLast ? (
                  <Button type="submit" disabled={mutation.isPending}>
                    {mutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    {mode === "edit" ? "Speichern" : "Kunde anlegen"}
                  </Button>
                ) : (
                  <Button type="button" onClick={next}>
                    Weiter <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </form>
          </Form>
        )}
      </Panel>
    </>
  );
}

function Stepper({
  current,
  onJump,
}: {
  current: number;
  onJump: (i: number) => void;
}) {
  return (
    <ol className="flex flex-wrap items-center gap-2">
      {STEPS.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={s.title} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => i <= current && onJump(i)}
              disabled={i > current}
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
              {s.title}
            </button>
            {i < STEPS.length - 1 && (
              <span className="h-px w-4 bg-border sm:w-6" />
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
}: {
  form: FR;
  name: Field;
  label: string;
  type?: string;
  placeholder?: string;
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
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
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField form={form} name="company_name" label="Unternehmen" />
        <TextField form={form} name="website" label="Website" placeholder="https://…" />
        <TextField form={form} name="industry" label="Branche" />
        <TextField form={form} name="vat_id" label="USt-ID" />
      </div>
      <FormField
        control={form.control}
        name="company_description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Firmeninhalt</FormLabel>
            <FormControl>
              <Textarea rows={4} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

function StepAdresse({ form }: { form: FR }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <TextField form={form} name="street" label="Straße & Hausnummer" />
      <div className="grid grid-cols-[120px_1fr] gap-3">
        <TextField form={form} name="postal_code" label="PLZ" />
        <TextField form={form} name="city" label="Stadt" />
      </div>
    </div>
  );
}

function StepKontakt({ form }: { form: FR }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <TextField form={form} name="phone" label="Telefonnummer" />
      <TextField form={form} name="email" label="E-Mail" type="email" />
    </div>
  );
}

function StepAnsprechpartner({ form }: { form: FR }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <TextField form={form} name="contact_person" label="Name" />
      <TextField form={form} name="contact_phone" label="Telefon (optional)" />
      <TextField
        form={form}
        name="contact_email"
        label="E-Mail (optional)"
        type="email"
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
    <div className="space-y-4">
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
        name="greeting_text"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Begrüßungstext</FormLabel>
            <FormControl>
              <Textarea
                rows={3}
                placeholder="Guten Tag, Sie sind verbunden mit …"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="forwarding_enabled"
        render={({ field }) => (
          <FormItem className="flex items-center gap-3 space-y-0">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <FormLabel className="!mt-0 cursor-pointer">
              Weiterleitung erwünscht
            </FormLabel>
          </FormItem>
        )}
      />
    </div>
  );
}
