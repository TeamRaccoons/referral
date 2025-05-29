"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { siteConfig } from "@/app/config";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  title: string;
};

const navItems = [
  {
    href: "/dashboard",
    title: "Swap + Trigger",
  },
  {
    href: "/dashboard-ultra",
    title: "Ultra",
  },
];

export function MainNav({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname();

  return (
    <nav className={cn("flex items-center gap-1", className)} {...props}>
      {/* Desktop Navigation */}
      <div className="hidden items-center gap-1 md:flex">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex h-9 items-center rounded-md px-4 text-sm font-medium transition-colors",
              pathname === item.href
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {item.title}
          </Link>
        ))}
      </div>

      {/* Mobile Navigation */}
      <Sheet>
        <SheetTrigger asChild className="md:hidden">
          <button
            className="text-muted-foreground hover:bg-muted hover:text-foreground flex h-9 items-center rounded-md px-4 text-sm font-medium"
            title="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[300px] sm:w-[400px]">
          <div className="flex flex-col gap-4">
            {/* Mobile Logo and Site Name */}
            <Link
              className="mb-4 flex items-center gap-2.5 transition-all duration-200 hover:opacity-80"
              href="/"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full">
                <Image src="/jup.png" alt="logo" width={24} height={24} />
              </div>
              <span className="text-lg font-bold tracking-tight">
                {siteConfig.name}
              </span>
            </Link>

            {/* Mobile Navigation Items */}
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex h-9 items-center rounded-md px-4 text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {item.title}
              </Link>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
}
