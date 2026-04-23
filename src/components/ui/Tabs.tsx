import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "../../lib/cn";

export const Tabs = TabsPrimitive.Root;

export function TabsList({
  className,
  ...props
}: TabsPrimitive.TabsListProps) {
  return (
    <TabsPrimitive.List
      className={cn(
        "inline-flex items-center gap-1 rounded-lg border border-border-subtle bg-accent-muted p-1",
        className ?? "",
      )}
      {...props}
    />
  );
}

export function TabsTrigger({
  className,
  ...props
}: TabsPrimitive.TabsTriggerProps) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "inline-flex items-center justify-center rounded-md px-2.5 py-1.5 text-xs font-medium text-content-muted outline-none transition-colors",
        "hover:bg-surface hover:text-content",
        "data-[state=active]:border data-[state=active]:border-border-subtle data-[state=active]:bg-surface data-[state=active]:text-content data-[state=active]:shadow-sm",
        "focus-visible:ring-2 focus-visible:ring-focus-ring",
        className ?? "",
      )}
      {...props}
    />
  );
}

export const TabsContent = TabsPrimitive.Content;
