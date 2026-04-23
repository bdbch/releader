import { ArticleList } from "@/components/ArticleList";
import { RouteFilterBar } from "@/components/RouteFilterBar";
import { ViewSelect } from "@/components/ViewSelect";
import { RouteLayout } from "@/routes/RouteLayout";
import { useUserOptions } from "@/stores/userOptionsStore";

export function UnreadRoute() {
  const view = useUserOptions((state) => state.articleListView);
  const setView = useUserOptions((state) => state.setArticleListView);

  return (
    <RouteLayout
      title="Unread"
      meta="12 unread"
      actions={<ViewSelect value={view} onValueChange={setView} />}
      filters={
        <RouteFilterBar
          groups={[
            {
              label: "Sort",
              options: [
                { label: "Newest first", active: true },
                { label: "Oldest first" },
              ],
            },
            {
              label: "When",
              options: [
                { label: "Today", active: true },
                { label: "This week" },
                { label: "Any time" },
              ],
            },
            {
              label: "Saved",
              options: [
                { label: "All unread", active: true },
                { label: "Saved only" },
              ],
            },
          ]}
        />
      }
    >
      <ArticleList
        items={unreadItems}
        density={view.density}
        showThumbnails={view.showThumbnails}
      />
    </RouteLayout>
  );
}

const unreadItems = [
  {
    id: "unread-1",
    title: "Feedbin experiments with calmer keyboard-first inbox navigation",
    feed: "Feedbin",
    summary:
      "The update focuses on predictable focus states, lower visual noise, and keeping frequent actions within easy reach.",
    publishedAt: "5m ago",
    thumbnailUrl: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=160&q=80",
    unread: true,
  },
  {
    id: "unread-2",
    title: "A practical guide to building sidebar trees that scale to nested folders",
    feed: "Smashing",
    summary:
      "An overview of rendering order, keyboard handling, and drag interactions when folders and feeds share the same hierarchy.",
    publishedAt: "47m ago",
    thumbnailUrl: "https://images.unsplash.com/photo-1516116216624-53e697fedbea?auto=format&fit=crop&w=160&q=80",
    unread: true,
    starred: true,
  },
  {
    id: "unread-3",
    title: "Why dense list views still win for serious reading workflows",
    feed: "Nieman Lab",
    summary:
      "A strong argument for compact rows, persistent filters, and avoiding large card layouts in information-heavy products.",
    publishedAt: "2h ago",
    unread: true,
  },
  {
    id: "unread-4",
    title: "Desktop app polish comes from consistency, not decoration",
    feed: "Craft",
    summary:
      "Small alignment, spacing, and hover decisions do more to create trust than oversized empty states or promotional headers.",
    publishedAt: "3h ago",
    unread: true,
  },
];
