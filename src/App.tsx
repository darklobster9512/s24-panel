import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { RequireRole } from "@/components/RequireRole";
import { Loader2 } from "lucide-react";

const Auth = lazy(() => import("./pages/Auth"));

const SuperadminLayout = lazy(() => import("./components/superadmin/SuperadminLayout"));
import SuperadminOverview from "./pages/superadmin/Overview";
import SuperadminKunden from "./pages/superadmin/Kunden";
import SuperadminKundenWizard from "./pages/superadmin/KundenWizard";
import SuperadminMitarbeiter from "./pages/superadmin/Mitarbeiter";
import SuperadminMitarbeiterWizard from "./pages/superadmin/MitarbeiterWizard";
import SuperadminMitarbeiterDetail from "./pages/superadmin/MitarbeiterDetail";
import SuperadminZuweisungen from "./pages/superadmin/Zuweisungen";
import SuperadminAnrufe from "./pages/superadmin/Anrufe";
import SuperadminNotizen from "./pages/superadmin/Notizen";
import SuperadminBewerbungen from "./pages/superadmin/Bewerbungen";

import SuperadminVertraege from "./pages/superadmin/Vertraege";
import SuperadminVertragsvorlageEditor from "./pages/superadmin/VertragsvorlageEditor";
import SuperadminAuszahlungen from "./pages/superadmin/Auszahlungen";
import SuperadminAbrechnung from "./pages/superadmin/Abrechnung";
import SuperadminEinstellungen from "./pages/superadmin/Einstellungen";
import SuperadminArbeitsvertraege from "./pages/superadmin/Arbeitsvertraege";
import SuperadminArbeitsvertragDetail from "./pages/superadmin/ArbeitsvertragDetail";

const Kunde = lazy(() => import("./pages/Kunde"));

const MitarbeiterLayout = lazy(() => import("./components/mitarbeiter/MitarbeiterLayout"));
import MitarbeiterCockpit from "./pages/mitarbeiter/Cockpit";
import MitarbeiterKunden from "./pages/mitarbeiter/Kunden";
import MitarbeiterKundeDetail from "./pages/mitarbeiter/KundeDetail";
import MitarbeiterLive from "./pages/mitarbeiter/LiveAnrufe";
import MitarbeiterErfassen from "./pages/mitarbeiter/Erfassen";
import MitarbeiterNotizen from "./pages/mitarbeiter/Notizen";

import MitarbeiterStatistik from "./pages/mitarbeiter/Statistik";
import MitarbeiterProfil from "./pages/mitarbeiter/Profil";
import MitarbeiterArbeitsvertrag from "./pages/mitarbeiter/Arbeitsvertrag";
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
                <Route path="/" element={<Navigate to="/auth" replace />} />
                <Route path="/auth" element={<Auth />} />

                <Route element={<RequireRole allow={["superadmin"]} />}>
                  <Route path="/superadmin" element={<SuperadminLayout />}>
                    <Route index element={<SuperadminOverview />} />
                    <Route path="kunden" element={<SuperadminKunden />} />
                    <Route path="kunden/anlegen" element={<SuperadminKundenWizard mode="create" />} />
                    <Route path="kunden/bearbeiten/:id" element={<SuperadminKundenWizard mode="edit" />} />
                    <Route path="mitarbeiter" element={<SuperadminMitarbeiter />} />
                    <Route path="mitarbeiter/anlegen" element={<SuperadminMitarbeiterWizard mode="create" />} />
                    <Route path="mitarbeiter/bearbeiten/:id" element={<SuperadminMitarbeiterWizard mode="edit" />} />
                    <Route path="mitarbeiter/:id" element={<SuperadminMitarbeiterDetail />} />
                    <Route path="zuweisungen" element={<SuperadminZuweisungen />} />
                    <Route path="anrufe" element={<SuperadminAnrufe />} />
                    <Route path="notizen" element={<SuperadminNotizen />} />
                    <Route path="bewerbungen" element={<SuperadminBewerbungen />} />

                    
                    <Route path="vertraege" element={<SuperadminVertraege />} />
                    <Route path="vertraege/:templateId" element={<SuperadminVertragsvorlageEditor />} />
                    <Route path="arbeitsvertraege" element={<SuperadminArbeitsvertraege />} />
                    <Route path="arbeitsvertraege/:id" element={<SuperadminArbeitsvertragDetail />} />
                    <Route path="auszahlungen" element={<SuperadminAuszahlungen />} />
                    <Route path="abrechnung" element={<SuperadminAbrechnung />} />
                    <Route path="einstellungen" element={<SuperadminEinstellungen />} />
                  </Route>
                </Route>

                <Route element={<RequireRole allow={["kunde"]} />}>
                  <Route path="/kunde" element={<Kunde />} />
                </Route>

                <Route element={<RequireRole allow={["mitarbeiter"]} />}>
                  <Route path="/mitarbeiter" element={<MitarbeiterLayout />}>
                    <Route index element={<MitarbeiterCockpit />} />
                    <Route path="kunden" element={<MitarbeiterKunden />} />
                    <Route path="kunden/:id" element={<MitarbeiterKundeDetail />} />
                    <Route path="live" element={<MitarbeiterLive />} />
                    <Route path="erfassen" element={<MitarbeiterErfassen />} />
                    <Route path="notizen" element={<MitarbeiterNotizen />} />
                    
                    <Route path="statistik" element={<MitarbeiterStatistik />} />
                    <Route path="profil" element={<MitarbeiterProfil />} />
                    <Route path="arbeitsvertrag" element={<MitarbeiterArbeitsvertrag />} />
                  </Route>
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
