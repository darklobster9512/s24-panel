import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Headphones,
  MessageSquare,
  PhoneCall,
  Sparkles,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, roleHome } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, role, loading } = useAuth();

  useEffect(() => {
    if (!loading && user && role) {
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from ?? roleHome(role), { replace: true });
    }
  }, [loading, user, role, navigate, location.state]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-surface">
      <div className="pointer-events-none absolute inset-0 bg-mesh opacity-70" />
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" />

      <div className="relative z-10 flex min-h-screen items-center justify-center p-4 md:p-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid w-full max-w-6xl overflow-hidden rounded-3xl bg-card shadow-mockup md:min-h-[720px] md:grid-cols-2"
        >
          <BrandingPanel />
          <FormPanel />
        </motion.div>
      </div>
    </div>
  );
}

function BrandingPanel() {
  return (
    <div className="relative hidden overflow-hidden bg-ink-deep p-10 md:flex md:flex-col md:justify-between">
      <div className="pointer-events-none absolute inset-0 bg-dots opacity-30" />
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full blur-3xl"
        style={{ backgroundColor: "rgba(123, 237, 159, 0.35)" }}
      />
      <div
        className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full blur-3xl"
        style={{ backgroundColor: "rgba(123, 237, 159, 0.20)" }}
      />

      <div className="relative">
        <Link to="/" className="inline-flex items-center gap-2 text-on-ink">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Headphones className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight">
            Sekretariat<span className="text-primary">24</span>
          </span>
        </Link>

        <h1 className="mt-12 text-4xl font-semibold leading-tight text-on-ink">
          Ihr digitales <br />
          <span className="text-primary">Callcenter-Panel.</span>
        </h1>
        <p className="mt-4 max-w-sm text-sm text-white/70">
          Sekretariat, Support und Kunden-Kommunikation — alles auf einer
          eleganten Plattform.
        </p>
      </div>

      <div className="relative mt-10 space-y-6">
        <WaveAnimation />
        <FeatureRow />
      </div>
    </div>
  );
}

function WaveAnimation() {
  const bars = Array.from({ length: 28 });
  return (
    <div className="flex h-16 items-end gap-1.5 rounded-2xl bg-white/5 px-4 py-3 backdrop-blur">
      <PhoneCall className="mr-2 h-4 w-4 shrink-0 text-primary" />
      {bars.map((_, i) => (
        <span
          key={i}
          className="animate-wave-bar w-1.5 rounded-full bg-primary/80"
          style={{
            height: `${20 + ((i * 13) % 70)}%`,
            animationDelay: `${(i % 10) * 0.08}s`,
          }}
        />
      ))}
      <span className="ml-auto font-mono text-xs text-white/60">LIVE</span>
    </div>
  );
}

function FeatureRow() {
  const items = [
    { icon: MessageSquare, label: "Live Chat" },
    { icon: PhoneCall, label: "Anrufe" },
    { icon: Sparkles, label: "KI-Assist" },
    { icon: ShieldCheck, label: "DSGVO" },
  ];
  return (
    <div className="grid grid-cols-4 gap-3">
      {items.map(({ icon: Icon, label }) => (
        <div
          key={label}
          className="flex flex-col items-center gap-2 rounded-xl bg-white/5 px-3 py-4 text-center backdrop-blur"
        >
          <Icon className="h-4 w-4 text-primary" />
          <span className="text-[11px] text-white/70">{label}</span>
        </div>
      ))}
    </div>
  );
}

function FormPanel() {
  return (
    <div className="flex flex-col justify-center p-6 md:p-10">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold tracking-tight">Willkommen</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Melden Sie sich an oder erstellen Sie ein neues Konto.
          </p>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Registrieren</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="mt-6">
            <LoginForm />
          </TabsContent>

          <TabsContent value="signup" className="mt-6">
            <SignupForm />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Willkommen zurück");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="login-email">E-Mail</Label>
        <Input
          id="login-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@firma.de"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="login-password">Passwort</Label>
        <Input
          id="login-password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          "Anmelden"
        )}
      </Button>
    </form>
  );
}

function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const redirectUrl = `${window.location.origin}/auth`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectUrl },
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(
      "Konto erstellt. Bitte prüfen Sie ggf. Ihr E-Mail-Postfach.",
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="signup-email">E-Mail</Label>
        <Input
          id="signup-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@firma.de"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-password">Passwort</Label>
        <Input
          id="signup-password"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          "Konto erstellen"
        )}
      </Button>
    </form>
  );
}
