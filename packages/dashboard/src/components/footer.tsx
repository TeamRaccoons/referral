import dynamic from "next/dynamic";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import * as Icons from "@/components/ui/icons";
import { siteConfig } from "@/app/config";
import { cn } from "@/lib/utils";

const ThemeToggle = dynamic(() => import("./theme-toggle"), {
  ssr: false,
  loading: () => (
    <Button
      variant="ghost"
      size="sm"
      className="gap-1 px-2 text-lg font-semibold md:text-base"
    >
      <div className="bg-muted-foreground/70 h-6 w-6 animate-pulse rounded-full" />
      <span className="bg-muted-foreground/70 w-14 animate-pulse rounded capitalize">
        &nbsp;
      </span>
    </Button>
  ),
});

export function SiteFooter(props: { className?: string }) {
  return (
    <footer className={cn("container border-t", props.className)}>
      <div className="my-4 grid grid-cols-2 md:flex md:items-center">
        <div className="col-start-2 row-start-1 flex h-12 justify-end">
          <ThemeToggle />
        </div>
      </div>
    </footer>
  );
}
