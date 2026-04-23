import { LayoutDashboardIcon, MailIcon } from "lucide-react";
import { SidebarButton } from "./SidebarButton";
import { ROUTE, useRoutes } from "../stores/routeStore";

export function Sidebar() {
  const currentRoute = useRoutes((state) => state.currentRoute);
  const setCurrentRoute = useRoutes((state) => state.setCurrentRoute);

  return (
    <div>
      <div className="flex flex-col gap-0.5">
        <SidebarButton
          label="Dashboard"
          iconLeft={<LayoutDashboardIcon className="size-4" />}
          onClick={() => setCurrentRoute(ROUTE.DASHBOARD)}
          isActive={currentRoute === ROUTE.DASHBOARD}
        />
        <SidebarButton
          label="Unread"
          iconLeft={<MailIcon className="size-4" />}
          onClick={() => setCurrentRoute(ROUTE.UNREAD)}
          isActive={currentRoute === ROUTE.UNREAD}
        />
      </div>
    </div>
  );
}
