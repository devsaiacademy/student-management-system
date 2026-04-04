import { cn } from "@student-management-system/ui/lib/utils";
import Image from "next/image";

type SiteLogoProps = {
  /**
   * hero: centered on small screens, left-aligned from md (matches home hero).
   * center: always centered (e.g. login).
   */
  variant?: "hero" | "center";
  className?: string;
  priority?: boolean;
};

export function SiteLogo({
  variant = "hero",
  className,
  priority = false,
}: SiteLogoProps) {
  return (
    <header
      className={cn(
        "flex h-11 w-full shrink-0 items-center sm:h-14 md:h-[71px]",
        variant === "center"
          ? "justify-center"
          : "justify-center md:justify-start",
        className
      )}
    >
      <Image
        alt="Otomatics Logo"
        className="h-auto max-h-full w-auto max-w-[200px] object-contain sm:max-w-[260px] md:max-w-[372px]"
        height={71}
        priority={priority}
        src="/logo.svg"
        width={372}
      />
    </header>
  );
}
