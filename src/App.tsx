import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { RequireRole } from "@/components/RequireRole";
import { Loader2 } from "lucide-react";

const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Superadmin = lazy(() => import("./pages/Superadmin"));
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
                  <Route path="/superadmin" element={<Superadmin />} />
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
