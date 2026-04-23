import { create } from "zustand";
import type { ViewSettings } from "@/components/ViewSelect";

type UserOptionsState = {
  articleListView: ViewSettings;
  setArticleListView: (nextValue: ViewSettings) => void;
  updateArticleListView: (updates: Partial<ViewSettings>) => void;
};

const defaultArticleListView: ViewSettings = {
  showThumbnails: true,
  density: "medium",
};

export const useUserOptions = create<UserOptionsState>((set) => ({
  articleListView: defaultArticleListView,
  setArticleListView: (nextValue) => set({ articleListView: nextValue }),
  updateArticleListView: (updates) =>
    set((state) => ({
      articleListView: {
        ...state.articleListView,
        ...updates,
      },
    })),
}));
