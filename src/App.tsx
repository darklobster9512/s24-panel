import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { RequireRole } from "@/components/RequireRole";
import { Loader2 } from "lucide-react";

const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));

const SuperadminLayout = lazy(() => import("./components/superadmin/SuperadminLayout"));
const SuperadminOverview = lazy(() => import("./pages/superadmin/Overview"));
const SuperadminKunden = lazy(() => import("./pages/superadmin/Kunden"));
const SuperadminKundenWizard = lazy(() => import("./pages/superadmin/KundenWizard"));
const SuperadminMitarbeiter = lazy(() => import("./pages/superadmin/Mitarbeiter"));
const SuperadminZuweisungen = lazy(() => import("./pages/superadmin/Zuweisungen"));
const SuperadminAnrufe = lazy(() => import("./pages/superadmin/Anrufe"));
const SuperadminNotizen = lazy(() => import("./pages/superadmin/Notizen"));
const SuperadminTickets = lazy(() => import("./pages/superadmin/Tickets"));
const SuperadminVertraege = lazy(() => import("./pages/superadmin/Vertraege"));
const SuperadminAuszahlungen = lazy(() => import("./pages/superadmin/Auszahlungen"));
const SuperadminAbrechnung = lazy(() => import("./pages/superadmin/Abrechnung"));
const SuperadminEinstellungen = lazy(() => import("./pages/superadmin/Einstellungen"));

const Kunde = lazy(() => import("./pages/Kunde"));
const Mitarbeiter = lazy(() => import("./pages/Mitarbeiter"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, staleTime: 30_000 },
  },
});

function PageFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <AuthProvider>
            <Suspense fallback={<PageFallback />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />

                <Route element={<RequireRole allow={["superadmin"]} />}>
                  <Route path="/superadmin" element={<SuperadminLayout />}>
                    <Route index element={<SuperadminOverview />} />
                    <Route path="kunden" element={<SuperadminKunden />} />
                    <Route path="kunden/anlegen" element={<SuperadminKundenWizard mode="create" />} />
                    <Route path="kunden/bearbeiten/:id" element={<SuperadminKundenWizard mode="edit" />} />
                    <Route path="mitarbeiter" element={<SuperadminMitarbeiter />} />
                    <Route path="zuweisungen" element={<SuperadminZuweisungen />} />
                    <Route path="anrufe" element={<SuperadminAnrufe />} />
                    <Route path="notizen" element={<SuperadminNotizen />} />
                    <Route path="tickets" element={<SuperadminTickets />} />
                    <Route path="vertraege" element={<SuperadminVertraege />} />
                    <Route path="auszahlungen" element={<SuperadminAuszahlungen />} />
                    <Route path="abrechnung" element={<SuperadminAbrechnung />} />
                    <Route path="einstellungen" element={<SuperadminEinstellungen />} />
                  </Route>
                </Route>

                <Route element={<RequireRole allow={["kunde"]} />}>
                  <Route path="/kunde" element={<Kunde />} />
                </Route>

                <Route element={<RequireRole allow={["mitarbeiter"]} />}>
                  <Route path="/mitarbeiter" element={<Mitarbeiter />} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            <Toaster richColors position="top-right" />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
