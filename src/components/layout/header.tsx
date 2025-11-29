
import { Separator } from "@/components/ui/separator";

export default function Header() {
  return (
    <>
      <header className="flex h-16 items-center gap-4 px-4 md:px-6 shrink-0">
        {/* Removed Logo */}
        <h1 className="text-xl font-bold tracking-tight text-primary font-headline">
          BREATHESAFE
        </h1>
      </header>
      <Separator />
    </>
  );
}
