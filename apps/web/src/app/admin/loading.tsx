import { FourBallOrbit } from "@/components/four-ball-orbit";

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center px-3 py-8">
      <div className="flex flex-col items-center gap-6 text-muted-foreground">
        <FourBallOrbit />
        <p className="text-sm">Loading…</p>
      </div>
    </div>
  );
}
