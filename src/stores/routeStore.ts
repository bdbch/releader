import { create } from "zustand";

export enum ROUTE {
  DASHBOARD = "DASHBOARD",
  UNREAD = "UNREAD",
}

export const useRoutes = create<{
  currentRoute: ROUTE;
  routeParams: Record<string, any>;
  setCurrentRoute: (route: ROUTE) => void;
}>((set) => ({
  currentRoute: ROUTE.DASHBOARD,
  routeParams: {},
  setCurrentRoute: (route: ROUTE, params?: Record<string, any>) =>
    set({ currentRoute: route, routeParams: params ?? {} }),
}));
