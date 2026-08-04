import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Download, Loader2, ShieldCheck, Info } from "lucide-react";
import { toast } from "sonner";

type OnboardingData = {
  onboarding_enabled: boolean;
  phone_system: "sipgate" | "placetel" | null;
  softphone_email: string | null;
  softphone_password: string | null;
};

const SOFTPHONE = {
  sipgate: {
    name: "sipgate App",
    logo: "/logos/sipgate.svg",
    url: "https://www.sipgate.de/app-download",
    text: "Für deine Telefonie nutzen wir sipgate. Lade dir dafür die sipgate App auf deinen Rechner herunter und installiere sie.",
  },
  placetel: {
    name: "Webex App",
    logo: "/logos/webex.png",
    url: "https://www.webex.com/downloads.html",
    text: "Für deine Telefonie nutzen wir Placetel. Lade dir dafür die Webex App auf deinen Rechner herunter und installiere sie.",
  },
} as const;

function CopyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/30 px-4 py-3">
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate font-mono text-sm">{value}</p>
      </div>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => {
          navigator.clipboard.writeText(value);
          toast.success(`${label} kopiert`);
        }}
      >
        <Copy className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default function Onboarding() {
  const { user } = useAuth();

  const { data, isPending } = useQuery({
    enabled: !!user,
    queryKey: ["onboarding", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("onboarding_enabled, phone_system, softphone_email, softphone_password")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return (data as OnboardingData | null) ?? null;
    },
  });

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data?.onboarding_enabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Onboarding</CardTitle>
          <CardDescription>
            Für dich ist aktuell kein Onboarding hinterlegt. Melde dich bei deinem Ansprechpartner.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const phone = data.phone_system ? SOFTPHONE[data.phone_system] : null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Onboarding</h1>
        <p className="text-sm text-muted-foreground">
          Alles, was du für deinen Start brauchst – Schritt für Schritt.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4 text-primary" />
            1. Sichere Verbindung – UltraViewer
          </CardTitle>
          <CardDescription>
            Damit wir uns mit dir verbinden und dir das Softphone in Ruhe erklären können, lade
            bitte zuerst UltraViewer herunter und installiere es.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-6">
          <img
            src="/logos/ultraviewer.png"
            alt="UltraViewer Logo"
            className="h-12 w-auto object-contain"
            loading="lazy"
          />
          <Button asChild>
            <a href="https://www.ultraviewer.net/en/download.html" target="_blank" rel="noreferrer">
              <Download className="mr-2 h-4 w-4" />
              UltraViewer herunterladen
            </a>
          </Button>
        </CardContent>
      </Card>

      {phone && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">2. {phone.name} installieren</CardTitle>
            <CardDescription>{phone.text}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-6">
            <img
              src={phone.logo}
              alt={`${phone.name} Logo`}
              className="h-12 w-auto object-contain"
              loading="lazy"
            />
            <Button asChild>
              <a href={phone.url} target="_blank" rel="noreferrer">
                <Download className="mr-2 h-4 w-4" />
                {phone.name} herunterladen
              </a>
            </Button>
          </CardContent>
        </Card>
      )}

      {(data.softphone_email || data.softphone_password) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">3. Deine Zugangsdaten</CardTitle>
            <CardDescription>
              Zugangsdaten für {phone?.name ?? "dein Softphone"}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.softphone_email && <CopyRow label="E-Mail" value={data.softphone_email} />}
            {data.softphone_password && (
              <CopyRow label="Passwort" value={data.softphone_password} />
            )}
            <div className="flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p>
                Bitte speichere dir diese Daten sicher ab (z. B. in einem Passwort-Manager) – du
                brauchst sie für die Anmeldung in der App.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
