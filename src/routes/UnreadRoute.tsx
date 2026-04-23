import { useState } from "react";
import { ArticleList } from "@/components/ArticleList";
import { ReadView, type ReadViewItem } from "@/components/ReadView";
import { RouteFilterBar } from "@/components/RouteFilterBar";
import { ViewSelect } from "@/components/ViewSelect";
import { RouteLayout } from "@/routes/RouteLayout";
import { useUserOptions } from "@/stores/userOptionsStore";

export function UnreadRoute() {
  const view = useUserOptions((state) => state.articleListView);
  const setView = useUserOptions((state) => state.setArticleListView);
  const [activeReadItemId, setActiveReadItemId] = useState<string | null>(null);

  return (
    <>
      <RouteLayout
        title="Unread"
        actions={<ViewSelect value={view} onValueChange={setView} />}
        filters={
          <RouteFilterBar
            groups={[
              {
                label: "Sort",
                value: "newest",
                options: [
                  { label: "Newest first", value: "newest" },
                  { label: "Oldest first", value: "oldest" },
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
                label: "Saved",
                value: "all-unread",
                options: [
                  { label: "All unread", value: "all-unread" },
                  { label: "Saved only", value: "saved-only" },
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
          onItemDoubleClick={(item) => setActiveReadItemId(item.id)}
        />
      </RouteLayout>

      <ReadView
        items={unreadReadViewItems}
        activeItemId={activeReadItemId}
        onSelectItem={setActiveReadItemId}
        onClose={() => setActiveReadItemId(null)}
      />
    </>
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

const unreadReadViewItems: ReadViewItem[] = [
  {
    id: "unread-1",
    title: "Feedbin experiments with calmer keyboard-first inbox navigation",
    feedTitle: "Feedbin",
    publishedAt: null,
    publishedLabel: "5m ago",
    url: "https://example.com/feedbin-keyboard-first-inbox",
    thumbnailUrl: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1600&q=80",
    summaryText:
      "The update focuses on predictable focus states, lower visual noise, and keeping frequent actions within easy reach.",
    contentHtml: `
      <p>Feed readers live or die on navigation feel. The new direction trims decorative controls and makes state changes easier to track from the keyboard.</p>
      <p>That kind of discipline matters for a desktop product where users bounce between list scanning and long-form reading all day.</p>
    `,
    isRead: false,
  },
  {
    id: "unread-2",
    title: "A practical guide to building sidebar trees that scale to nested folders",
    feedTitle: "Smashing",
    publishedAt: null,
    publishedLabel: "47m ago",
    url: "https://example.com/sidebar-trees-nested-folders",
    thumbnailUrl: "https://images.unsplash.com/photo-1516116216624-53e697fedbea?auto=format&fit=crop&w=1600&q=80",
    summaryText:
      "An overview of rendering order, keyboard handling, and drag interactions when folders and feeds share the same hierarchy.",
    contentHtml: `
      <p>Mixed trees become fragile when render order, drag targets, and persistence all derive from separate assumptions.</p>
      <p>A safer model keeps transformation logic centralized and lets the UI focus on presentation.</p>
      <p>That is especially important once nested folders and keyboard interaction are in play.</p>
    `,
    isRead: false,
    isStarred: true,
  },
  {
    id: "unread-3",
    title: "Why dense list views still win for serious reading workflows",
    feedTitle: "Nieman Lab",
    publishedAt: null,
    publishedLabel: "2h ago",
    url: "https://example.com/dense-list-views-reading-workflows",
    summaryText:
      "A strong argument for compact rows, persistent filters, and avoiding large card layouts in information-heavy products.",
    contentHtml: `
      <p>Dense views are not about cramming more content onto the screen. They are about preserving context while the user makes quick decisions.</p>
      <p>As long as typography and selection states stay crisp, compact rows usually outperform roomy card grids for editorial work.</p>
    `,
    isRead: false,
  },
  {
    id: "unread-4",
    title: "Desktop app polish comes from consistency, not decoration",
    feedTitle: "Craft",
    publishedAt: null,
    publishedLabel: "3h ago",
    url: "https://example.com/desktop-polish-consistency",
    summaryText:
      "Small alignment, spacing, and hover decisions do more to create trust than oversized empty states or promotional headers.",
    contentHtml: `
      <p>Users usually read polish as coherence.</p>
      <p>If controls align, panels behave consistently, and actions appear where expected, the app feels mature without needing flashy visual tricks.</p>
      <p>That makes the read view a good place to be restrained: a back button, clear metadata, and clean content rendering go a long way.</p>
    `,
    isRead: false,
  },
];
