import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function ShortRedirect() {
  const { code } = useParams<{ code: string }>();
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!code) {
        setNotFound(true);
        return;
      }
      const { data, error } = await (supabase as any)
        .from("short_links")
        .select("target_url")
        .eq("code", code)
        .maybeSingle();
      if (!active) return;
      if (error || !data?.target_url) {
        setNotFound(true);
        return;
      }
      window.location.replace(data.target_url as string);
    })();
    return () => {
      active = false;
    };
  }, [code]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-center">
      {notFound ? (
        <div className="space-y-2">
          <h1 className="text-xl font-semibold">Link nicht gefunden</h1>
          <p className="text-sm text-muted-foreground">
            Dieser Link ist ungültig oder abgelaufen.
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Weiterleitung …</span>
        </div>
      )}
    </main>
  );
}
