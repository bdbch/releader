import { create } from "zustand";
import type { ViewSettings } from "@/components/ViewSelect";

export type ReaderFontFamily = "sans" | "serif" | "mono";
export type ReaderFontSize = "xs" | "sm" | "md" | "lg" | "xl";
export type ReaderContentWidth = "full" | "medium" | "narrow";

export type ReaderSettings = {
  fontFamily: ReaderFontFamily;
  fontSize: ReaderFontSize;
  contentWidth: ReaderContentWidth;
};

type UserOptionsState = {
  articleListView: ViewSettings;
  readerSettings: ReaderSettings;
  setArticleListView: (nextValue: ViewSettings) => void;
  updateArticleListView: (updates: Partial<ViewSettings>) => void;
  setReaderSettings: (nextValue: ReaderSettings) => void;
  updateReaderSettings: (updates: Partial<ReaderSettings>) => void;
};

const defaultArticleListView: ViewSettings = {
  showThumbnails: true,
  density: "medium",
};

const defaultReaderSettings: ReaderSettings = {
  fontFamily: "sans",
  fontSize: "md",
  contentWidth: "medium",
};

export const useUserOptions = create<UserOptionsState>((set) => ({
  articleListView: defaultArticleListView,
  readerSettings: defaultReaderSettings,
  setArticleListView: (nextValue) => set({ articleListView: nextValue }),
  updateArticleListView: (updates) =>
    set((state) => ({
      articleListView: {
        ...state.articleListView,
        ...updates,
      },
    })),
  setReaderSettings: (nextValue) => set({ readerSettings: nextValue }),
  updateReaderSettings: (updates) =>
    set((state) => ({
      readerSettings: {
        ...state.readerSettings,
        ...updates,
      },
    })),
}));
