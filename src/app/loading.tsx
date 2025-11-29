import { Logo } from "@/components/icons";

export default function Loading() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Logo className="h-12 w-12 animate-pulse text-primary" />
        <p className="text-muted-foreground">Loading BREATHESAFE...</p>
      </div>
    </div>
  );
}
