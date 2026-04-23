import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/cn";

type SidebarDropZoneProps = {
  id: string;
  depth: number;
};

export function SidebarDropZone({ id, depth }: SidebarDropZoneProps) {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex items-center overflow-hidden transition-[height,opacity]",
        isOver ? "h-2 opacity-100" : "h-px opacity-0",
      )}
      style={{ paddingLeft: 10 + depth * 13 }}
    >
      <div
        className={cn(
          "h-px w-full bg-transparent transition-colors",
          isOver ? "bg-content" : "",
        )}
      />
    </div>
  );
}
