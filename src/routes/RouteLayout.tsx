import type { ReactNode } from "react";

type RouteLayoutProps = {
  title: string;
  meta: string;
  filters?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
};

export function RouteLayout({
  title,
  meta,
  filters,
  actions,
  children,
}: RouteLayoutProps) {
  return (
    <section className="flex h-full min-h-0 w-full flex-col bg-background">
      <header
        className="border-b bg-background px-6 py-4"
        data-tauri-drag-region
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-baseline gap-3" data-tauri-drag-region>
            <h1
              className="text-[1.9rem] font-semibold tracking-[-0.03em] text-foreground"
              data-tauri-drag-region
            >
              {title}
            </h1>
            <span
              className="text-[13px] font-medium text-muted-foreground"
              data-tauri-drag-region
            >
              {meta}
            </span>
          </div>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>
        {filters ? <div className="mt-4">{filters}</div> : null}
      </header>
      <div className="min-h-0 flex-1">{children}</div>
    </section>
  );
}
