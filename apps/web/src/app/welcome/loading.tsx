import { TwinOrbit } from "@/components/twin-orbit";

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center px-3 py-8">
      <div className="flex flex-col items-center gap-6 text-muted-foreground">
        <TwinOrbit className="size-2 text-primary" />
        <p className="text-sm">Verifying your account…</p>
      </div>
    </div>
  );
}
