import { DashboardRoute } from "@/routes/DashboardRoute";
import { FeedRoute } from "@/routes/FeedRoute";
import { FolderRoute } from "@/routes/FolderRoute";
import { UnreadRoute } from "@/routes/UnreadRoute";
import { ROUTE, useRoutes } from "@/stores/routeStore";

export function AppRoutes() {
  const currentRoute = useRoutes((state) => state.currentRoute);

  switch (currentRoute) {
    case ROUTE.FOLDER:
      return <FolderRoute />;
    case ROUTE.FEED:
      return <FeedRoute />;
    case ROUTE.UNREAD:
      return <UnreadRoute />;
    case ROUTE.DASHBOARD:
    default:
      return <DashboardRoute />;
  }
}
