import { DashboardRoute } from "../routes/DashboardRoute";
import { UnreadRoute } from "../routes/UnreadRoute";
import { ROUTE, useRoutes } from "../stores/routeStore";

export function AppRoutes() {
  const currentRoute = useRoutes((state) => state.currentRoute);

  switch (currentRoute) {
    case ROUTE.UNREAD:
      return <UnreadRoute />;
    case ROUTE.DASHBOARD:
    default:
      return <DashboardRoute />;
  }
}
