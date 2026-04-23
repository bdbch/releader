import { RouteLayout } from "@/routes/RouteLayout";
import { useRoutes } from "@/stores/routeStore";
import { useSidebarStore } from "@/stores/sidebarStore";

export function FolderRoute() {
  const folderId = useRoutes((state) => String(state.routeParams.folderId ?? ""));
  const folder = useSidebarStore((state) =>
    state.folders.find((item) => item.id === folderId),
  );

  return (
    <RouteLayout title={folder?.name ?? "Folder"} meta="Folder view">
      <section className="border-b px-6 py-5 text-[13px] text-muted-foreground">
        Folder articles will appear here.
      </section>
    </RouteLayout>
  );
}
