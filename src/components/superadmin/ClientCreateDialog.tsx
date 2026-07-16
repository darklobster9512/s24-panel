import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

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

interface Props {
  children: React.ReactNode;
}

export function ClientCreateDialog({ children }: Props) {
  const [open, setOpen] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const { user } = useAuth();
  const qc = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
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
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (!user) throw new Error("Nicht angemeldet");

      let logo_url: string | null = null;
      if (logoFile) {
        const ext = logoFile.name.split(".").pop() || "png";
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("client-logos")
          .upload(path, logoFile, { upsert: false, contentType: logoFile.type });
        if (upErr) throw upErr;
        logo_url = path;
      }

      const payload = {
        ...values,
        contact_phone: values.contact_phone || null,
        contact_email: values.contact_email || null,
        logo_url,
        created_by: user.id,
      };

      const { error } = await supabase.from("clients").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Kunde angelegt");
      qc.invalidateQueries({ queryKey: ["clients"] });
      form.reset();
      setLogoFile(null);
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Kunde anlegen</DialogTitle>
          <DialogDescription>
            Alle Firmendaten für den neuen Kunden.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
            className="space-y-6"
          >
            <Section title="Unternehmen">
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
                  <FormItem className="mt-4">
                    <FormLabel>Firmeninhalt</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </Section>

            <Section title="Kontakt Firma">
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField form={form} name="phone" label="Telefonnummer" />
                <TextField form={form} name="email" label="E-Mail" type="email" />
              </div>
            </Section>

            <Section title="Adresse">
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField form={form} name="street" label="Straße & Hausnummer" />
                <div className="grid grid-cols-[100px_1fr] gap-3">
                  <TextField form={form} name="postal_code" label="PLZ" />
                  <TextField form={form} name="city" label="Stadt" />
                </div>
              </div>
            </Section>

            <Section title="Ansprechpartner">
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField form={form} name="contact_person" label="Name" />
                <TextField
                  form={form}
                  name="contact_phone"
                  label="Telefon (optional)"
                />
                <TextField
                  form={form}
                  name="contact_email"
                  label="E-Mail (optional)"
                  type="email"
                />
              </div>
            </Section>

            <Section title="Konfiguration">
              <div className="space-y-4">
                <FormItem>
                  <FormLabel>Logo (optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setLogoFile(e.target.files?.[0] ?? null)
                      }
                    />
                  </FormControl>
                </FormItem>

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
            </Section>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={mutation.isPending}
              >
                Abbrechen
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Anlegen
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
        {title}
      </h3>
      {children}
    </div>
  );
}

function TextField({
  form,
  name,
  label,
  type = "text",
  placeholder,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: any;
  name: string;
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
            <Input type={type} placeholder={placeholder} {...field} value={field.value ?? ""} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
