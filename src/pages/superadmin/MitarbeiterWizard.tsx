import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useForm, UseFormReturn, FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Save,
  FileText,
  Sparkles,
  Eye,
  EyeOff,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/use-auth";

type EmployeeInsert = TablesInsert<"employees">;
type EmployeeUpdate = TablesUpdate<"employees">;
import { PageHeader, Panel } from "@/components/superadmin/SuperadminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const EMAIL_SUFFIX = "@sekreteriat24.de";

const draftSchema = z.object({
  first_name: z.string().trim().max(100).optional().or(z.literal("")),
  last_name: z.string().trim().max(100).optional().or(z.literal("")),
  personal_email: z.string().trim().max(200).optional().or(z.literal("")),
  personal_phone: z.string().trim().max(50).optional().or(z.literal("")),
  login_local_part: z.string().trim().max(64).optional().or(z.literal("")),
  password_plain: z.string().trim().max(128).optional().or(z.literal("")),
  contract_type: z.enum(["vollzeit", "teilzeit"]).optional().or(z.literal("")),
  start_date: z.string().optional().or(z.literal("")),
  salary: z.string().optional().or(z.literal("")),
  birth_date: z.string().optional().or(z.literal("")),
  birth_place: z.string().trim().max(120).optional().or(z.literal("")),
  nationality: z.string().trim().max(80).optional().or(z.literal("")),
  marital_status: z.string().trim().max(60).optional().or(z.literal("")),
  iban: z.string().trim().max(40).optional().or(z.literal("")),
  bic: z.string().trim().max(20).optional().or(z.literal("")),
  bank_name: z.string().trim().max(120).optional().or(z.literal("")),
  tax_id: z.string().trim().max(40).optional().or(z.literal("")),
  social_security_number: z.string().trim().max(40).optional().or(z.literal("")),
  health_insurance: z.string().trim().max(120).optional().or(z.literal("")),
});

const LOCAL_RE = /^[a-zA-Z0-9._-]+$/;

const fullSchema = z.object({
  first_name: z.string().trim().min(1, "Pflichtfeld").max(100),
  last_name: z.string().trim().min(1, "Pflichtfeld").max(100),
  personal_email: z.string().trim().email("Ungültige E-Mail").max(200),
  personal_phone: z.string().trim().min(1, "Pflichtfeld").max(50),
  login_local_part: z
    .string()
    .trim()
    .min(1, "Pflichtfeld")
    .max(64)
    .regex(LOCAL_RE, "Nur Buchstaben, Zahlen, . _ -"),
  password_plain: z.string().trim().min(6, "Mind. 6 Zeichen").max(128),
  contract_type: z.enum(["vollzeit", "teilzeit"], {
    errorMap: () => ({ message: "Bitte wählen" }),
  }),
  start_date: z.string().min(1, "Pflichtfeld"),
  salary: z.string().min(1, "Pflichtfeld"),
  birth_date: z.string().optional().or(z.literal("")),
  birth_place: z.string().trim().max(120).optional().or(z.literal("")),
  nationality: z.string().trim().max(80).optional().or(z.literal("")),
  marital_status: z.string().trim().max(60).optional().or(z.literal("")),
  iban: z.string().trim().max(40).optional().or(z.literal("")),
  bic: z.string().trim().max(20).optional().or(z.literal("")),
  bank_name: z.string().trim().max(120).optional().or(z.literal("")),
  tax_id: z.string().trim().max(40).optional().or(z.literal("")),
  social_security_number: z.string().trim().max(40).optional().or(z.literal("")),
  health_insurance: z.string().trim().max(120).optional().or(z.literal("")),
});

type FormValues = z.infer<typeof draftSchema>;
type Field = FieldPath<FormValues>;

type StepDef = { title: string; description: string; fields: Field[] };

const STEPS: StepDef[] = [
  {
    title: "Person",
    description: "Persönliche Stammdaten des Mitarbeiters.",
    fields: ["first_name", "last_name", "personal_email", "personal_phone"],
  },
  {
    title: "Account & Vertrag",
    description: "Login-Daten für das Panel sowie Vertragsdetails.",
    fields: [
      "login_local_part",
      "password_plain",
      "contract_type",
      "start_date",
      "salary",
    ],
  },
  {
    title: "Persönliches (optional)",
    description: "Geburtsdaten, Bankverbindung und Sozialdaten.",
    fields: [
      "birth_date",
      "birth_place",
      "nationality",
      "marital_status",
      "iban",
      "bic",
      "bank_name",
      "tax_id",
      "social_security_number",
      "health_insurance",
    ],
  },
];

const DEFAULTS: FormValues = {
  first_name: "",
  last_name: "",
  personal_email: "",
  personal_phone: "",
  login_local_part: "",
  password_plain: "",
  contract_type: "" as FormValues["contract_type"],
  start_date: "",
  salary: "",
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
};

const NULLABLE_STRINGS: Field[] = [
  "first_name",
  "last_name",
  "personal_email",
  "personal_phone",
  "login_local_part",
  "password_plain",
  "birth_place",
  "nationality",
  "marital_status",
  "iban",
  "bic",
  "bank_name",
  "tax_id",
  "social_security_number",
  "health_insurance",
];

const NULLABLE_DATES: Field[] = ["start_date", "birth_date"];

function generatePassword(len = 8) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const arr = new Uint32Array(len);
  crypto.getRandomValues(arr);
  let out = "";
  for (let i = 0; i < len; i++) out += chars[arr[i] % chars.length];
  return out;
}

function normalize(values: FormValues, isDraft: boolean) {
  const out: Record<string, unknown> = { ...values };
  for (const key of NULLABLE_STRINGS) {
    const v = out[key];
    if (typeof v === "string" && v.trim() === "") out[key] = null;
  }
  for (const key of NULLABLE_DATES) {
    const v = out[key];
    if (typeof v === "string" && v.trim() === "") out[key] = null;
  }
  // salary → number or null
  const rawSalary = (values.salary ?? "").toString().replace(",", ".").trim();
  out.salary = rawSalary === "" ? null : Number(rawSalary);
  // contract_type "" → null
  if (out.contract_type === "") out.contract_type = null;
  // login_email
  const local = (values.login_local_part ?? "").toString().trim();
  out.login_email = local === "" ? null : `${local}${EMAIL_SUFFIX}`;
  if (isDraft) {
    // ensure password kept but nullable
    if (out.password_plain === "") out.password_plain = null;
  }
  return out;
}

export default function MitarbeiterWizard({
  mode,
}: {
  mode: "create" | "edit";
}) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [step, setStep] = useState(0);
  const [showPw, setShowPw] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(draftSchema),
    defaultValues: DEFAULTS,
  });

  const existing = useQuery({
    enabled: mode === "edit" && !!id,
    queryKey: ["employee", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const accountExists = !!existing.data?.user_id;

  useEffect(() => {
    if (mode === "edit" && existing.data) {
      const d = existing.data;
      form.reset({
        first_name: d.first_name ?? "",
        last_name: d.last_name ?? "",
        personal_email: d.personal_email ?? "",
        personal_phone: d.personal_phone ?? "",
        login_local_part: d.login_local_part ?? "",
        password_plain: d.password_plain ?? "",
        contract_type: (d.contract_type as "vollzeit" | "teilzeit") ?? "",
        start_date: d.start_date ?? "",
        salary: d.salary != null ? String(d.salary) : "",
        birth_date: d.birth_date ?? "",
        birth_place: d.birth_place ?? "",
        nationality: d.nationality ?? "",
        marital_status: d.marital_status ?? "",
        iban: d.iban ?? "",
        bic: d.bic ?? "",
        bank_name: d.bank_name ?? "",
        tax_id: d.tax_id ?? "",
        social_security_number: d.social_security_number ?? "",
        health_insurance: d.health_insurance ?? "",
      });
    }
  }, [mode, existing.data, form]);

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

      const base = normalize(values, false);
      const login_email = base.login_email as string;
      const password = values.password_plain!;

      let employeeId = id;

      if (mode === "edit" && id) {
        // If account already exists, we don't re-create it. Just update fields (excl. login/password immutability).
        const updatePayload = { ...base } as Record<string, unknown>;
        if (accountExists) {
          delete updatePayload.login_local_part;
          delete updatePayload.login_email;
          delete updatePayload.password_plain;
        }
        const { error } = await supabase
          .from("employees")
          .update(updatePayload as EmployeeUpdate)
          .eq("id", id);
        if (error) throw error;
      } else {
        // Insert as draft first (so RLS-permitted insert has created_by)
        const { data, error } = await supabase
          .from("employees")
          .insert({ ...base, is_draft: true, created_by: user.id })
          .select("id")
          .single();
        if (error) throw error;
        employeeId = data.id as string;
      }

      // If no auth account yet, create one now via edge function
      if (!accountExists) {
        const { data: fn, error: fnErr } = await supabase.functions.invoke(
          "create-employee-account",
          {
            body: {
              employee_id: employeeId,
              login_email,
              password,
            },
          },
        );
        if (fnErr) throw new Error(fnErr.message);
        if ((fn as { error?: string })?.error) {
          throw new Error((fn as { error: string }).error);
        }
      }

      return { login_email };
    },
    onSuccess: (res) => {
      toast.success(
        mode === "edit"
          ? "Mitarbeiter aktualisiert"
          : `Mitarbeiter angelegt (${res.login_email})`,
      );
      qc.invalidateQueries({ queryKey: ["employees"] });
      if (id) qc.invalidateQueries({ queryKey: ["employee", id] });
      navigate("/superadmin/mitarbeiter");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const draftMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Nicht angemeldet");
      const values = form.getValues();
      const base = normalize(values, true);

      if (mode === "edit" && id) {
        const updatePayload: Record<string, unknown> = { ...base };
        if (accountExists) {
          delete updatePayload.login_local_part;
          delete updatePayload.login_email;
          delete updatePayload.password_plain;
        }
        const { error } = await supabase
          .from("employees")
          .update(updatePayload)
          .eq("id", id);
        if (error) throw error;
        return { id };
      } else {
        const { data, error } = await supabase
          .from("employees")
          .insert({ ...base, is_draft: true, created_by: user.id })
          .select("id")
          .single();
        if (error) throw error;
        return { id: data.id as string };
      }
    },
    onSuccess: (res) => {
      toast.success("Als Entwurf gespeichert");
      qc.invalidateQueries({ queryKey: ["employees"] });
      qc.invalidateQueries({ queryKey: ["employee", res.id] });
      if (mode === "create") {
        navigate(`/superadmin/mitarbeiter/bearbeiten/${res.id}`, {
          replace: true,
        });
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const isLast = step === STEPS.length - 1;
  const busy = submitMutation.isPending || draftMutation.isPending;
  const current = STEPS[step];
  const loading = mode === "edit" && existing.isLoading;

  function onSubmit(values: FormValues) {
    submitMutation.mutate(values);
  }

  return (
    <>
      <PageHeader
        title={mode === "edit" ? "Mitarbeiter bearbeiten" : "Mitarbeiter anlegen"}
        subtitle={
          mode === "edit"
            ? "Stammdaten aktualisieren."
            : "In wenigen Schritten einen neuen Mitarbeiter anlegen."
        }
        actions={
          <Button asChild variant="outline" size="sm">
            <Link to="/superadmin/mitarbeiter">
              <ArrowLeft className="mr-2 h-4 w-4" /> Zurück
            </Link>
          </Button>
        }
      />

      <Panel className="overflow-hidden !p-0">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Lade Mitarbeiter…
          </div>
        ) : (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="grid lg:grid-cols-[280px_1fr]"
            >
              <aside className="hidden border-r border-border/60 bg-muted/20 p-6 lg:block">
                <div className="sticky top-6">
                  <p className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Fortschritt
                  </p>
                  <VerticalStepper current={step} onJump={setStep} />
                </div>
              </aside>

              <div className="border-b border-border/60 bg-muted/20 p-4 lg:hidden">
                <HorizontalStepper current={step} onJump={setStep} />
              </div>

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
                    {step === 0 && <StepPerson form={form} />}
                    {step === 1 && (
                      <StepAccount
                        form={form}
                        showPw={showPw}
                        setShowPw={setShowPw}
                        accountLocked={accountExists}
                      />
                    )}
                    {step === 2 && <StepOptional form={form} />}
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
                        {mode === "edit"
                          ? "Speichern"
                          : "Mitarbeiter anlegen"}
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

function StepPerson({ form }: { form: FR }) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <TextField form={form} name="first_name" label="Vorname" placeholder="Max" />
      <TextField form={form} name="last_name" label="Nachname" placeholder="Mustermann" />
      <TextField
        form={form}
        name="personal_email"
        label="Persönliche E-Mail"
        type="email"
        placeholder="max@gmail.com"
      />
      <TextField
        form={form}
        name="personal_phone"
        label="Persönliche Telefonnummer"
        placeholder="+49 170 1234567"
      />
    </div>
  );
}

function StepAccount({
  form,
  showPw,
  setShowPw,
  accountLocked,
}: {
  form: FR;
  showPw: boolean;
  setShowPw: (v: boolean) => void;
  accountLocked: boolean;
}) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <FormField
        control={form.control}
        name="login_local_part"
        render={({ field }) => (
          <FormItem className="md:col-span-2">
            <FormLabel>Login-E-Mail</FormLabel>
            <FormControl>
              <div className="flex overflow-hidden rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring">
                <Input
                  {...field}
                  value={(field.value as string) ?? ""}
                  disabled={accountLocked}
                  placeholder="max.mustermann"
                  className="border-0 focus-visible:ring-0"
                />
                <span className="flex items-center whitespace-nowrap border-l border-input bg-muted px-3 text-sm text-muted-foreground">
                  @sekreteriat24.de
                </span>
              </div>
            </FormControl>
            {accountLocked && (
              <p className="text-xs text-muted-foreground">
                Account existiert bereits — Login-E-Mail kann nicht geändert werden.
              </p>
            )}
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="password_plain"
        render={({ field }) => (
          <FormItem className="md:col-span-2">
            <FormLabel>Passwort</FormLabel>
            <FormControl>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showPw ? "text" : "password"}
                    {...field}
                    value={(field.value as string) ?? ""}
                    disabled={accountLocked}
                    placeholder="8 Zeichen"
                    className="pr-10 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPw ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  disabled={accountLocked}
                  onClick={() => {
                    form.setValue("password_plain", generatePassword(8), {
                      shouldDirty: true,
                    });
                    setShowPw(true);
                  }}
                >
                  <Sparkles className="mr-2 h-4 w-4" /> Generieren
                </Button>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="contract_type"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Vertragsart</FormLabel>
            <Select
              value={(field.value as string) || undefined}
              onValueChange={field.onChange}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Bitte wählen" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="vollzeit">Vollzeit</SelectItem>
                <SelectItem value="teilzeit">Teilzeit</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <TextField form={form} name="start_date" label="Startdatum" type="date" />

      <TextField
        form={form}
        name="salary"
        label="Gehalt (€ / Monat)"
        placeholder="z. B. 2800"
        className="md:col-span-2"
      />
    </div>
  );
}

function StepOptional({ form }: { form: FR }) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <TextField form={form} name="birth_date" label="Geburtsdatum" type="date" />
      <TextField form={form} name="birth_place" label="Geburtsort" placeholder="Berlin" />
      <TextField form={form} name="nationality" label="Nationalität" placeholder="Deutsch" />
      <TextField
        form={form}
        name="marital_status"
        label="Familienstand"
        placeholder="ledig / verheiratet / …"
      />
      <TextField form={form} name="iban" label="IBAN" placeholder="DE00 0000 0000 0000 0000 00" />
      <TextField form={form} name="bic" label="BIC" placeholder="XXXXDEXXXXX" />
      <TextField
        form={form}
        name="bank_name"
        label="Bank"
        placeholder="Sparkasse Berlin"
        className="md:col-span-2"
      />
      <TextField form={form} name="tax_id" label="Steuer-ID" placeholder="00 000 000 000" />
      <TextField
        form={form}
        name="social_security_number"
        label="SV-Nummer"
        placeholder="00 000000 X 000"
      />
      <TextField
        form={form}
        name="health_insurance"
        label="Krankenkasse"
        placeholder="TK, AOK, …"
        className="md:col-span-2"
      />
    </div>
  );
}
