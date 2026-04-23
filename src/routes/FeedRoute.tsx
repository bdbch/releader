import { RouteLayout } from "@/routes/RouteLayout";
import { useRoutes } from "@/stores/routeStore";
import { useSidebarStore } from "@/stores/sidebarStore";

export function FeedRoute() {
  const feedId = useRoutes((state) => String(state.routeParams.feedId ?? ""));
  const feed = useSidebarStore((state) =>
    state.feeds.find((item) => item.id === feedId),
  );

  return (
    <RouteLayout title={feed?.title ?? "Feed"}>
      <section className="border-b px-6 py-5 text-[13px] text-muted-foreground">
        Feed articles will appear here.
      </section>
    </RouteLayout>
  );
}
