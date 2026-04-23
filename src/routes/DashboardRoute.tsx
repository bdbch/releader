import { useState } from "react";
import { ArticleList } from "@/components/ArticleList";
import { ReadView, type ReadViewItem } from "@/components/ReadView";
import { RouteFilterBar } from "@/components/RouteFilterBar";
import { ViewSelect } from "@/components/ViewSelect";
import { RouteLayout } from "@/routes/RouteLayout";
import { useUserOptions } from "@/stores/userOptionsStore";

export function DashboardRoute() {
  const view = useUserOptions((state) => state.articleListView);
  const setView = useUserOptions((state) => state.setArticleListView);
  const [activeReadItemId, setActiveReadItemId] = useState<string | null>(null);

  return (
    <>
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
          onItemDoubleClick={(item) => setActiveReadItemId(item.id)}
        />
      </RouteLayout>

      <ReadView
        items={dashboardReadViewItems}
        activeItemId={activeReadItemId}
        onSelectItem={setActiveReadItemId}
        onClose={() => setActiveReadItemId(null)}
      />
    </>
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

const dashboardReadViewItems: ReadViewItem[] = [
  {
    id: "dashboard-1",
    title: "Firefox tests a quieter vertical tab experience for power users",
    feedTitle: "Ars",
    publishedAt: null,
    publishedLabel: "9m ago",
    url: "https://example.com/firefox-vertical-tabs",
    thumbnailUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1600&q=80",
    summaryText:
      "Mozilla is refining sidebar density and selection behavior, making tab management feel more at home on desktop-sized screens.",
    contentHtml: `
      <p>Mozilla is tuning vertical tabs around calmer density, stronger active states, and less ornamental chrome.</p>
      <p>The direction is relevant for any desktop reader: lists need to scan quickly, selection needs to stay obvious, and the shell should get out of the way once the user is working.</p>
      <blockquote>Power features only feel good when the default state is quiet.</blockquote>
      <p>That same principle applies to article rows, split layouts, and keyboard-driven reading flows.</p>
    `,
    isRead: false,
  },
  {
    id: "dashboard-2",
    title: "The Verge reviews a week of offline-first note taking",
    feedTitle: "The Verge",
    publishedAt: null,
    publishedLabel: "22m ago",
    url: "https://example.com/offline-first-note-taking",
    thumbnailUrl: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1600&q=80",
    summaryText:
      "A practical comparison of sync models, local persistence, and how much product complexity users actually notice in daily work.",
    contentHtml: `
      <p>After a week of switching between local-first note apps, the main difference was not sync speed but confidence.</p>
      <p>Products that clearly separate local state, pending work, and remote updates feel more trustworthy than products that try to hide everything behind a vague loading state.</p>
      <p>For an RSS reader, that argues for pragmatic persistence and predictable refresh actions rather than premature sync complexity.</p>
    `,
    isRead: false,
    isStarred: true,
  },
  {
    id: "dashboard-3",
    title: "Tauri 2.0 desktop patterns worth borrowing for native-feeling apps",
    feedTitle: "Tauri",
    publishedAt: null,
    publishedLabel: "1h ago",
    url: "https://example.com/tauri-desktop-patterns",
    thumbnailUrl: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1600&q=80",
    summaryText:
      "A short write-up covering titlebars, drag regions, keyboard flows, and the small details that make app shells feel grounded.",
    contentHtml: `
      <p>Native-feeling apps are usually built from a handful of disciplined decisions: compact headers, sensible focus treatment, and panels that resize cleanly.</p>
      <p>Tauri makes the shell side feasible, but the product still needs a reading surface that respects long-form content.</p>
      <p>That means generous line-height, narrow readable measure, calm metadata, and obvious escape hatches back to the list.</p>
    `,
    isRead: false,
  },
  {
    id: "dashboard-4",
    title: "How designers tune reading rhythm in dense editorial products",
    feedTitle: "Figma",
    publishedAt: null,
    publishedLabel: "2h ago",
    url: "https://example.com/reading-rhythm-editorial-products",
    summaryText:
      "Examples of spacing, hierarchy, and muted UI chrome that keep long article lists scannable without feeling sparse.",
    contentHtml: `
      <p>Strong reading rhythm comes from consistency more than decoration.</p>
      <p>When heading spacing, paragraph spacing, and media blocks follow a clear cadence, the article feels easier to trust and easier to stay in.</p>
      <p>A desktop read view benefits from this even more than a website because it sits inside a more tool-like environment.</p>
    `,
    isRead: true,
  },
  {
    id: "dashboard-5",
    title: "SQLite indexing strategies for local-first content apps",
    feedTitle: "PlanetScale",
    publishedAt: null,
    publishedLabel: "4h ago",
    url: "https://example.com/sqlite-indexing-local-first-content-apps",
    summaryText:
      "A grounded explanation of pragmatic indexes for feed items, unread states, and date ranges without overengineering the schema.",
    contentHtml: `
      <p>Good local data design starts with the queries the product actually runs.</p>
      <ul>
        <li>recent items by feed</li>
        <li>unread items across feeds</li>
        <li>saved items and date filters</li>
      </ul>
      <p>That usually points to a small number of composite indexes, not a complicated storage architecture.</p>
    `,
    isRead: true,
  },
];
