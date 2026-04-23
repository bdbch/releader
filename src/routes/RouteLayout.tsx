import type { ReactNode } from "react";

type RouteLayoutProps = {
  title: string;
  titleIcon?: ReactNode;
  filters?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
};

export function RouteLayout({
  title,
  titleIcon,
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
            {titleIcon ? (
              <div
                className="flex size-8 items-center justify-center rounded-[10px] border border-border-subtle bg-surface-subtle"
                data-tauri-drag-region
              >
                {titleIcon}
              </div>
            ) : null}
            <h1
              className="text-[1.45rem] font-semibold tracking-[-0.03em] text-foreground"
              data-tauri-drag-region
            >
              {title}
            </h1>
          </div>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>
        {filters ? <div className="mt-4">{filters}</div> : null}
      </header>
      <div className="min-h-0 flex-1">{children}</div>
    </section>
  );
}
