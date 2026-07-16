import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function Index() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="h-[60vw] max-h-[800px] w-[60vw] max-w-[800px] rounded-full bg-primary/25 blur-[120px]" />
      </div>
      <div className="relative z-10 flex flex-col items-center gap-8 px-6 text-center">
        <h1 className="text-6xl font-bold tracking-tight text-foreground sm:text-7xl md:text-8xl lg:text-9xl">
          Sekreteriat24
        </h1>
        <Button asChild size="lg" className="gap-2">
          <Link to="/auth">
            Zum Login <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
