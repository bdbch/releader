import { create } from "zustand";

export enum ROUTE {
  DASHBOARD = "DASHBOARD",
  UNREAD = "UNREAD",
}

export type RouteParams = Record<string, string | number | boolean | null>;

type RouteState = {
  currentRoute: ROUTE;
  routeParams: RouteParams;
  setCurrentRoute: (route: ROUTE, params?: RouteParams) => void;
};

export const useRoutes = create<RouteState>((set) => ({
  currentRoute: ROUTE.DASHBOARD,
  routeParams: {},
  setCurrentRoute: (route: ROUTE, params?: RouteParams) =>
    set({ currentRoute: route, routeParams: params ?? {} }),
}));
