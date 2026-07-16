import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-[60vw] max-h-[800px] w-[60vw] max-w-[800px] rounded-full bg-brand/20 blur-[120px]" />
      </div>
      <h1 className="relative z-10 text-6xl font-bold tracking-tight text-foreground sm:text-7xl md:text-8xl lg:text-9xl">
        Sekreteriat24
      </h1>
    </section>
  );
}
