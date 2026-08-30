import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/branding";

const sizes = {
  sm: { height: 32, width: 120 },
  md: { height: 48, width: 180 },
  lg: { height: 72, width: 260 },
  xl: { height: 96, width: 340 },
} as const;

type RedLeadsLogoProps = {
  size?: keyof typeof sizes;
  onDark?: boolean;
  href?: string;
  className?: string;
  priority?: boolean;
};

export function RedLeadsLogo({
  size = "sm",
  onDark = true,
  href = "/",
  className,
  priority = false,
}: RedLeadsLogoProps) {
  const dim = sizes[size];

  const image = (
    <Image
      src={BRAND.logoPath}
      alt={`${BRAND.name} logo`}
      width={dim.width}
      height={dim.height}
      priority={priority}
      className="h-auto w-auto object-contain"
      style={{ maxHeight: dim.height, maxWidth: dim.width }}
    />
  );

  const content = onDark ? (
    <span className="inline-flex rounded-md bg-white px-2 py-1">{image}</span>
  ) : (
    image
  );

  if (!href) {
    return <span className={cn("inline-flex shrink-0 items-center", className)}>{content}</span>;
  }

  return (
    <Link href={href} className={cn("inline-flex shrink-0 items-center", className)} aria-label={`${BRAND.name} home`}>
      {content}
    </Link>
  );
}
