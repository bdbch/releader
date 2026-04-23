import { ArticleList } from "@/components/ArticleList";
import { RouteFilterBar } from "@/components/RouteFilterBar";
import { ViewSelect } from "@/components/ViewSelect";
import { RouteLayout } from "@/routes/RouteLayout";
import { useUserOptions } from "@/stores/userOptionsStore";

export function DashboardRoute() {
  const view = useUserOptions((state) => state.articleListView);
  const setView = useUserOptions((state) => state.setArticleListView);

  return (
    <RouteLayout
      title="Dashboard"
      actions={<ViewSelect value={view} onValueChange={setView} />}
      filters={
        <RouteFilterBar
          groups={[
            {
              label: "State",
              value: "all",
              options: [
                { label: "All", value: "all" },
                { label: "Unread", value: "unread" },
                { label: "Saved", value: "saved" },
              ],
            },
            {
              label: "When",
              value: "today",
              options: [
                { label: "Today", value: "today" },
                { label: "This week", value: "this-week" },
                { label: "Any time", value: "any-time" },
              ],
            },
            {
              label: "Source",
              value: "all-feeds",
              kind: "combobox",
              options: [
                { label: "All feeds", value: "all-feeds" },
                { label: "Ars Technica", value: "ars-technica" },
                { label: "Figma", value: "figma" },
                { label: "Tauri Blog", value: "tauri-blog" },
                { label: "The Verge", value: "the-verge" },
              ],
            },
          ]}
        />
      }
    >
      <ArticleList
        items={dashboardItems}
        density={view.density}
        showThumbnails={view.showThumbnails}
      />
    </RouteLayout>
  );
}

const dashboardItems = [
  {
    id: "dashboard-1",
    title: "Firefox tests a quieter vertical tab experience for power users",
    feed: "Ars",
    summary:
      "Mozilla is refining sidebar density and selection behavior, making tab management feel more at home on desktop-sized screens.",
    publishedAt: "9m ago",
    thumbnailUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=160&q=80",
    unread: true,
  },
  {
    id: "dashboard-2",
    title: "The Verge reviews a week of offline-first note taking",
    feed: "The Verge",
    summary:
      "A practical comparison of sync models, local persistence, and how much product complexity users actually notice in daily work.",
    publishedAt: "22m ago",
    thumbnailUrl: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=160&q=80",
    unread: true,
    starred: true,
  },
  {
    id: "dashboard-3",
    title: "Tauri 2.0 desktop patterns worth borrowing for native-feeling apps",
    feed: "Tauri",
    summary:
      "A short write-up covering titlebars, drag regions, keyboard flows, and the small details that make app shells feel grounded.",
    publishedAt: "1h ago",
    thumbnailUrl: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=160&q=80",
    unread: true,
  },
  {
    id: "dashboard-4",
    title: "How designers tune reading rhythm in dense editorial products",
    feed: "Figma",
    summary:
      "Examples of spacing, hierarchy, and muted UI chrome that keep long article lists scannable without feeling sparse.",
    publishedAt: "2h ago",
  },
  {
    id: "dashboard-5",
    title: "SQLite indexing strategies for local-first content apps",
    feed: "PlanetScale",
    summary:
      "A grounded explanation of pragmatic indexes for feed items, unread states, and date ranges without overengineering the schema.",
    publishedAt: "4h ago",
  },
];
