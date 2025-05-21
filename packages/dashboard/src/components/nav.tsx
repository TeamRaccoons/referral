"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { navItems } from "@/app/config";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  title: string;
};

export function MainNav({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname();

  return (
    <nav className={cn("flex items-center gap-1", className)} {...props}>
      <Link
        href="/dashboard"
        className={cn(
          "flex h-9 items-center rounded-md px-4 text-sm font-medium transition-colors",
          pathname === "/dashboard"
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        Swap + Trigger
      </Link>
      <Link
        href="/dashboard-ultra"
        className={cn(
          "flex h-9 items-center rounded-md px-4 text-sm font-medium transition-colors",
          pathname === "/dashboard-ultra"
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        Ultra
      </Link>
    </nav>
  );
}
