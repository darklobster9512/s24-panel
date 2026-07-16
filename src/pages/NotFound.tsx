import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Seite nicht gefunden</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Die Seite existiert nicht oder wurde verschoben.
        </p>
        <div className="mt-6">
          <Button asChild>
            <Link to="/">Zurück zur Startseite</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
