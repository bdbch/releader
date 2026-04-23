import { useEffect, useMemo, useRef } from "react";
import { ArrowLeftIcon, ExternalLinkIcon, Settings2Icon, StarIcon } from "lucide-react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { Button } from "@/components/ui/Button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";
import { cn } from "@/lib/cn";
import { extractFirstImageUrl, sanitizeHtml } from "@/lib/safeHtml";
import {
  useUserOptions,
  type ReaderContentWidth,
  type ReaderFontFamily,
  type ReaderFontSize,
} from "@/stores/userOptionsStore";

export type ReadViewItem = {
  id: string;
  title: string;
  feedTitle: string;
  publishedAt: string | null;
  publishedLabel: string;
  author?: string | null;
  url?: string | null;
  summaryText?: string | null;
  summaryHtml?: string | null;
  contentHtml?: string | null;
  thumbnailUrl?: string | null;
  isRead?: boolean;
  isStarred?: boolean;
};

type ReadViewProps = {
  items: ReadViewItem[];
  activeItemId: string | null;
  onSelectItem: (itemId: string) => void;
  onClose: () => void;
};

export function ReadView({
  items,
  activeItemId,
  onSelectItem,
  onClose,
}: ReadViewProps) {
  const activeItem = items.find((item) => item.id === activeItemId) ?? null;
  const contentRef = useRef<HTMLDivElement | null>(null);
  const sidebarItemRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const readerSettings = useUserOptions((state) => state.readerSettings);
  const updateReaderSettings = useUserOptions((state) => state.updateReaderSettings);

  const sanitizedMarkup = useMemo(() => {
    if (!activeItem) {
      return "";
    }

    const markup =
      activeItem.contentHtml ??
      activeItem.summaryHtml ??
      buildFallbackMarkup(activeItem.summaryText, activeItem.title);

    return sanitizeHtml(markup);
  }, [activeItem]);

  const coverImageUrl = useMemo(() => {
    if (!activeItem) {
      return null;
    }

    return (
      activeItem.thumbnailUrl ??
      extractFirstImageUrl(activeItem.contentHtml) ??
      extractFirstImageUrl(activeItem.summaryHtml)
    );
  }, [activeItem]);

  useEffect(() => {
    if (!activeItem) {
      return;
    }

    const currentContentRef = contentRef.current;
    if (currentContentRef) {
      currentContentRef.scrollTop = 0;
    }
  }, [activeItem?.id]);

  useEffect(() => {
    if (!activeItemId) {
      return;
    }

    const activeSidebarItem = sidebarItemRefs.current[activeItemId];
    activeSidebarItem?.scrollIntoView({
      block: "nearest",
      inline: "nearest",
    });
  }, [activeItemId]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!activeItem) {
    return null;
  }

  return (
    <section className="fixed inset-0 z-50 bg-background/98 text-foreground">
      <div className="app-panel-blur grid h-full grid-cols-[280px_minmax(0,1fr)] bg-background/92 min-[1400px]:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="flex min-h-0 flex-col border-r bg-surface-subtle/88">
          <div className="flex items-center border-b px-4 py-3">
            <Button
              variant="ghost"
              size="sm"
              iconLeft={<ArrowLeftIcon className="size-4" />}
              onClick={onClose}
            >
              Back
            </Button>
          </div>

          <div className="min-h-0 flex-1 overflow-auto p-2">
            <div className="flex flex-col gap-1">
              {items.map((item) => {
                const isActive = item.id === activeItem.id;

                return (
                  <button
                    key={item.id}
                    ref={(node) => {
                      sidebarItemRefs.current[item.id] = node;
                    }}
                    type="button"
                    className={cn(
                      "flex w-full flex-col gap-1 rounded-[14px] border px-3 py-3 text-left transition-colors",
                      isActive
                        ? "border-border-strong bg-surface text-content"
                        : item.isRead
                          ? "border-transparent bg-transparent text-content-muted/75 hover:bg-interactive-hover hover:text-content"
                          : "border-transparent bg-transparent text-content-muted hover:bg-interactive-hover hover:text-content",
                    )}
                    onClick={() => onSelectItem(item.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "size-1.5 shrink-0 rounded-full",
                              item.isRead ? "bg-border-strong/65" : "bg-danger",
                            )}
                            aria-hidden="true"
                          />
                          <div className="truncate text-[11px] font-medium uppercase tracking-[0.12em] text-content-subtle">
                            {item.feedTitle}
                          </div>
                        </div>
                        <div
                          className={cn(
                            "mt-1 line-clamp-2 text-[13px] leading-5",
                            item.isRead && !isActive
                              ? "font-medium text-content-muted"
                              : "font-medium text-content",
                          )}
                        >
                          {item.title}
                        </div>
                      </div>
                      {item.isStarred ? (
                        <StarIcon className="mt-0.5 size-3.5 shrink-0 fill-current text-content-subtle" />
                      ) : null}
                    </div>
                    <div className="line-clamp-2 text-[12px] leading-5 text-content-muted">
                      {item.summaryText ?? item.author ?? "No preview"}
                    </div>
                    <div className="flex items-center justify-between gap-3 text-[11px] text-content-subtle">
                      <span>{item.publishedLabel}</span>
                      <span>{item.isRead ? "Read" : "Unread"}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        <div className="flex min-h-0 flex-col bg-background">
          <div ref={contentRef} className="min-h-0 flex-1 overflow-auto">
            <header className="sticky top-0 z-10 border-b border-border-subtle/85 bg-surface-overlay/88 px-5 py-5 backdrop-blur-3xl supports-[backdrop-filter]:bg-surface-overlay/80 min-[900px]:px-8 min-[1200px]:py-6">
              <div
                className={cn(
                  "mx-auto flex w-full flex-col gap-4 min-[760px]:gap-5",
                  contentWidthClassName[readerSettings.contentWidth],
                )}
              >
                <div className="min-w-0">
                  <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-content-subtle">
                    {activeItem.feedTitle}
                  </div>
                  <h1 className="mt-3 text-[clamp(1.35rem,4.6vw+0.3rem,2.65rem)] font-semibold leading-[1.06] tracking-[-0.045em] text-foreground text-balance min-[760px]:text-[clamp(1.6rem,2vw+0.95rem,2.8rem)]">
                    {activeItem.title}
                  </h1>
                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] text-content-muted min-[900px]:text-[13px]">
                    {activeItem.author ? <span>{activeItem.author}</span> : null}
                    <span>{activeItem.publishedLabel}</span>
                    {activeItem.isStarred ? <span>Saved</span> : null}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <ReaderSettingsPopover
                    fontFamily={readerSettings.fontFamily}
                    fontSize={readerSettings.fontSize}
                    contentWidth={readerSettings.contentWidth}
                    onFontFamilyChange={(fontFamily) =>
                      updateReaderSettings({ fontFamily })
                    }
                    onFontSizeChange={(fontSize) =>
                      updateReaderSettings({ fontSize })
                    }
                    onContentWidthChange={(contentWidth) =>
                      updateReaderSettings({ contentWidth })
                    }
                  />

                  {activeItem.url ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      iconRight={<ExternalLinkIcon className="size-3.5" />}
                      className="w-fit"
                      onClick={() => void openUrl(activeItem.url!)}
                    >
                      Open original
                    </Button>
                  ) : null}
                </div>
              </div>
            </header>

            <article
              className={cn(
                "reader-article mx-auto flex w-full flex-col gap-7 px-5 py-6 min-[900px]:gap-9 min-[900px]:px-8 min-[900px]:py-8",
                contentWidthClassName[readerSettings.contentWidth],
                readerFontFamilyClassName[readerSettings.fontFamily],
                readerFontSizeClassName[readerSettings.fontSize],
              )}
            >
              {coverImageUrl ? (
                <div className="overflow-hidden rounded-[22px] border border-border-subtle bg-surface-muted">
                  <img
                    src={coverImageUrl}
                    alt=""
                    className="max-h-[26rem] w-full object-cover"
                  />
                </div>
              ) : null}

              <div
                className="read-view-content"
                onClick={(event) => {
                  const target = event.target;

                  if (!(target instanceof HTMLElement)) {
                    return;
                  }

                  const anchor = target.closest("a");

                  if (!(anchor instanceof HTMLAnchorElement) || !anchor.href) {
                    return;
                  }

                  event.preventDefault();
                  void openUrl(anchor.href);
                }}
                dangerouslySetInnerHTML={{ __html: sanitizedMarkup }}
              />

              {activeItem.url ? (
                <div className="flex justify-center border-t border-border-subtle pt-6 min-[900px]:pt-8">
                  <Button
                    variant="secondary"
                    size="md"
                    iconRight={<ExternalLinkIcon className="size-3.5" />}
                    onClick={() => void openUrl(activeItem.url!)}
                  >
                    Read original
                  </Button>
                </div>
              ) : null}
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}

function ReaderSettingsPopover({
  fontFamily,
  fontSize,
  contentWidth,
  onFontFamilyChange,
  onFontSizeChange,
  onContentWidthChange,
}: {
  fontFamily: ReaderFontFamily;
  fontSize: ReaderFontSize;
  contentWidth: ReaderContentWidth;
  onFontFamilyChange: (value: ReaderFontFamily) => void;
  onFontSizeChange: (value: ReaderFontSize) => void;
  onContentWidthChange: (value: ReaderContentWidth) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="secondary"
          size="sm"
          iconLeft={<Settings2Icon className="size-3.5" />}
        >
          Settings
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[20rem] rounded-[16px] border-border-strong/70 bg-surface-overlay/96 p-2.5 shadow-xl backdrop-blur-xl"
      >
        <div className="flex flex-col gap-3">
          <ReaderOptionGroup
            label="Font family"
            options={[
              { label: "Sans", value: "sans" },
              { label: "Serif", value: "serif" },
              { label: "Mono", value: "mono" },
            ]}
            value={fontFamily}
            onChange={onFontFamilyChange}
          />

          <ReaderOptionGroup
            label="Font size"
            options={[
              { label: "XS", value: "xs" },
              { label: "S", value: "sm" },
              { label: "M", value: "md" },
              { label: "L", value: "lg" },
              { label: "XL", value: "xl" },
            ]}
            value={fontSize}
            onChange={onFontSizeChange}
          />

          <ReaderOptionGroup
            label="Content width"
            options={[
              { label: "Full", value: "full" },
              { label: "Medium", value: "medium" },
              { label: "Narrow", value: "narrow" },
            ]}
            value={contentWidth}
            onChange={onContentWidthChange}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

function ReaderOptionGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Array<{ label: string; value: T }>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-[12px] bg-surface-subtle/45 p-2">
      <div className="px-1 text-[10px] font-medium uppercase tracking-[0.14em] text-content-subtle">
        {label}
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(0,1fr))] gap-1">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={cn(
              "rounded-[10px] border px-2 py-1.5 text-[12px] font-medium transition-colors",
              value === option.value
                ? "border-border-strong bg-surface text-content"
                : "border-border-subtle bg-surface-subtle text-content-muted hover:bg-interactive-hover hover:text-content",
            )}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function buildFallbackMarkup(summaryText: string | null | undefined, title: string) {
  const safeSummary = summaryText?.trim();

  if (!safeSummary) {
    return `<p>${escapeHtml(`No article content is available for ${title}.`)}</p>`;
  }

  return safeSummary
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
    .join("");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const contentWidthClassName: Record<ReaderContentWidth, string> = {
  full: "max-w-[72rem]",
  medium: "max-w-[56rem]",
  narrow: "max-w-[46rem]",
};

const readerFontFamilyClassName: Record<ReaderFontFamily, string> = {
  sans: "reader-font-sans",
  serif: "reader-font-serif",
  mono: "reader-font-mono",
};

const readerFontSizeClassName: Record<ReaderFontSize, string> = {
  xs: "reader-size-xs",
  sm: "reader-size-sm",
  md: "reader-size-md",
  lg: "reader-size-lg",
  xl: "reader-size-xl",
};
