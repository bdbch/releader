import { useEffect, useMemo, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import type { DragEndEvent, DragMoveEvent, DragStartEvent } from "@dnd-kit/core";
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { LayoutDashboardIcon, MailIcon } from "lucide-react";
import { PlusIcon } from "lucide-react";
import { moveSidebarNode } from "@/lib/sidebarMove";
import { buildSidebarTree } from "@/lib/sidebarTree";
import { ROUTE, useRoutes } from "@/stores/routeStore";
import { useSidebarStore } from "@/stores/sidebarStore";
import type { SidebarNode } from "@/types/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { Switch } from "@/components/ui/Switch";
import { useThemeStore } from "@/stores/themeStore";
import { SidebarDropZone } from "./SidebarDropZone";
import { SidebarDragPreview } from "./SidebarDragPreview";
import { SidebarFeedItem } from "./SidebarFeedItem";
import { SidebarFolderItem } from "./SidebarFolderItem";
import { SidebarButton } from "./SidebarButton";

export function Sidebar() {
  const currentRoute = useRoutes((state) => state.currentRoute);
  const routeParams = useRoutes((state) => state.routeParams);
  const setCurrentRoute = useRoutes((state) => state.setCurrentRoute);
  const folders = useSidebarStore((state) => state.folders);
  const feeds = useSidebarStore((state) => state.feeds);
  const expandedFolderIds = useSidebarStore((state) => state.expandedFolderIds);
  const error = useSidebarStore((state) => state.error);
  const loadSidebarData = useSidebarStore((state) => state.loadSidebarData);
  const toggleFolder = useSidebarStore((state) => state.toggleFolder);
  const toggleFolderTree = useSidebarStore((state) => state.toggleFolderTree);
  const setFolderExpanded = useSidebarStore((state) => state.setFolderExpanded);
  const setSidebarStructure = useSidebarStore(
    (state) => state.setSidebarStructure,
  );
  const createRootFolder = useSidebarStore((state) => state.createRootFolder);
  const createDraftFeed = useSidebarStore((state) => state.createDraftFeed);
  const initializeFeed = useSidebarStore((state) => state.initializeFeed);
  const renameFeed = useSidebarStore((state) => state.renameFeed);
  const renameFolder = useSidebarStore((state) => state.renameFolder);
  const removeFolder = useSidebarStore((state) => state.removeFolder);
  const removeFeed = useSidebarStore((state) => state.removeFeed);
  const reloadSidebarData = useSidebarStore((state) => state.reloadSidebarData);
  const persistSidebarStructure = useSidebarStore(
    (state) => state.persistSidebarStructure,
  );
  const resolvedTheme = useThemeStore((state) => state.resolvedTheme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const [activeDropFolderId, setActiveDropFolderId] = useState<string | null>(
    null,
  );
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [creatingFolderId, setCreatingFolderId] = useState<string | null>(null);
  const [creatingFeedId, setCreatingFeedId] = useState<string | null>(null);
  const [editingFeedId, setEditingFeedId] = useState<string | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [pendingDeleteFolderId, setPendingDeleteFolderId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    void loadSidebarData();
  }, [loadSidebarData]);

  useEffect(() => {
    const unlistenPromise = listen("feed-sync-updated", () => {
      void reloadSidebarData();
    });

    return () => {
      void unlistenPromise.then((unlisten) => unlisten());
    };
  }, [reloadSidebarData]);

  const tree = buildSidebarTree(folders, feeds);
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 6 },
    }),
  );
  const sortableIds = useMemo(() => flattenNodeIds(tree), [tree]);
  const activeDragItem = useMemo(
    () => (activeDragId ? getSidebarDragItem(tree, feeds, activeDragId) : null),
    [activeDragId, feeds, tree],
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveDragId(String(event.active.id));
  }

  function handleDragMove(event: DragMoveEvent) {
    const overId = event.over ? String(event.over.id) : null;

    if (!overId) {
      setActiveDropFolderId(null);
      return;
    }

    const target =
      parseContextDropZoneId(overId) ??
      (folders.some((folder) => folder.id === overId)
        ? {
            contextId: overId,
            index: 0,
          }
        : null);

    setActiveDropFolderId(target?.contextId ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    const activeId = String(event.active.id);
    const overId = event.over ? String(event.over.id) : null;

    if (!overId || activeId === overId) {
      setActiveDropFolderId(null);
      setActiveDragId(null);
      return;
    }

    const target =
      parseContextDropZoneId(overId) ??
      (folders.some((folder) => folder.id === overId)
        ? {
            contextId: overId,
            index: 0,
          }
        : null);

    if (!target) {
      setActiveDropFolderId(null);
      setActiveDragId(null);
      return;
    }

    const nextState = moveSidebarNode({
      folders,
      feeds,
      tree,
      activeId,
      targetContextId: target.contextId,
      targetIndex: target.index,
    });

    if (nextState.folders === folders && nextState.feeds === feeds) {
      setActiveDropFolderId(null);
      setActiveDragId(null);
      return;
    }

    setSidebarStructure(nextState.folders, nextState.feeds);
    setActiveDropFolderId(null);
    setActiveDragId(null);
    void persistSidebarStructure();
  }

  async function handleCreateFolder(parentFolderId: string | null = null) {
    const folder = await createRootFolder();
    setCreatingFolderId(folder.id);

    if (!parentFolderId) {
      setEditingFolderId(folder.id);
      return;
    }

    const nextFolders = [
      ...folders,
      {
        ...folder,
        parentFolderId,
        sortOrder: folders.filter((item) => item.parentFolderId === parentFolderId).length,
      },
    ];

    setSidebarStructure(nextFolders, feeds);
    setFolderExpanded(parentFolderId, true);
    setEditingFolderId(folder.id);
    await persistSidebarStructure();
  }

  async function handleCreateFeed(folderId: string | null = null) {
    const feed = await createDraftFeed();

    if (folderId) {
      const nextFeeds = [
        ...feeds,
        {
          ...feed,
          folderId,
          sortOrder: feeds.filter((candidate) => candidate.folderId === folderId).length,
        },
      ];

      setSidebarStructure(folders, nextFeeds);
      setFolderExpanded(folderId, true);
      await persistSidebarStructure();
    }

    setCreatingFeedId(feed.id);
  }

  async function handleMoveFeedIntoNewFolder(feedId: string) {
    const feed = feeds.find((item) => item.id === feedId);

    if (!feed) {
      return;
    }

    const folder = await createRootFolder();
    const nextParentFolderId = feed.folderId;
    const nextFolders = [
      ...folders,
      {
        ...folder,
        parentFolderId: nextParentFolderId,
        sortOrder: folders.filter((item) => item.parentFolderId === nextParentFolderId).length,
      },
    ];
    const sourceSiblingFeeds = feeds
      .filter((item) => item.folderId === feed.folderId && item.id !== feed.id)
      .sort((left, right) => left.sortOrder - right.sortOrder);
    const sourceOrderById = new Map(
      sourceSiblingFeeds.map((item, index) => [item.id, index]),
    );
    const nextFeeds = feeds.map((item) => {
      if (item.id === feed.id) {
        return {
          ...item,
          folderId: folder.id,
          sortOrder: 0,
        };
      }

      if (item.folderId === feed.folderId && sourceOrderById.has(item.id)) {
        return {
          ...item,
          sortOrder: sourceOrderById.get(item.id) ?? item.sortOrder,
        };
      }

      return item;
    });

    setSidebarStructure(nextFolders, nextFeeds);
    setFolderExpanded(folder.id, true);
    setEditingFolderId(folder.id);
    await persistSidebarStructure();
  }

  async function handleCommitFolderRename(folderId: string, name: string) {
    try {
      await renameFolder(folderId, name);
      setCreatingFolderId(null);
      setEditingFolderId(null);
    } catch {
      setCreatingFolderId(null);
      setEditingFolderId(null);
    }
  }

  async function handleCancelCreateFolder(folderId: string) {
    setCreatingFolderId(null);
    setEditingFolderId(null);
    await removeFolder(folderId);
  }

  async function handleDeleteFolder(folderId: string) {
    const deletedFolderIds = [folderId, ...getDescendantFolderIds(folders, folderId)];
    const deletedFeedIds = feeds
      .filter((feed) => feed.folderId && deletedFolderIds.includes(feed.folderId))
      .map((feed) => feed.id);

    await removeFolder(folderId);
    setPendingDeleteFolderId(null);
    setEditingFolderId(null);

    if (
      currentRoute === ROUTE.FOLDER &&
      typeof routeParams.folderId === "string" &&
      deletedFolderIds.includes(routeParams.folderId)
    ) {
      setCurrentRoute(ROUTE.DASHBOARD);
      return;
    }

    if (
      currentRoute === ROUTE.FEED &&
      typeof routeParams.feedId === "string" &&
      deletedFeedIds.includes(routeParams.feedId)
    ) {
      setCurrentRoute(ROUTE.DASHBOARD);
    }
  }

  async function handleCommitFeedRename(feedId: string, title: string) {
    try {
      await renameFeed(feedId, title);
      setEditingFeedId(null);
    } catch {
      setEditingFeedId(null);
    }
  }

  async function handleDeleteFeed(feedId: string) {
    await removeFeed(feedId);
    setEditingFeedId(null);

    if (currentRoute === ROUTE.FEED && routeParams.feedId === feedId) {
      setCurrentRoute(ROUTE.DASHBOARD);
    }
  }

  async function handleSubmitFeedUrl(feedId: string, value: string) {
    const trimmedValue = value.trim();

    try {
      new URL(trimmedValue);
    } catch {
      setCreatingFeedId(null);
      await removeFeed(feedId);
      return;
    }

    setCreatingFeedId(null);
    setCurrentRoute(ROUTE.FEED, { feedId });

    try {
      await initializeFeed(feedId, trimmedValue);
      await reloadSidebarData();
    } catch {
      await removeFeed(feedId);
      setCurrentRoute(ROUTE.DASHBOARD);
    }
  }

  async function handleCancelCreateFeed(feedId: string) {
    setCreatingFeedId(null);
    await removeFeed(feedId);
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-5">
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

        <div className="flex min-h-0 flex-1 flex-col gap-1">
          <div className="flex items-center justify-between px-2">
            <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-content-subtle">
              Library
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <span>
                  <button className="p-1.5 cursor-pointer rounded-sm hover:bg-interactive-hover active:bg-interactive-active">
                    <PlusIcon className="size-2.5" />
                  </button>
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onSelect={() => void handleCreateFeed()}
                >
                  Feed
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => void handleCreateFolder()}>
                  Folder
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {error ? (
            <div className="px-2 text-[12px] text-danger">{error}</div>
          ) : null}

          <div className="min-h-0 flex-1 overflow-auto">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragMove={handleDragMove}
              onDragEnd={handleDragEnd}
              onDragCancel={() => {
                setActiveDropFolderId(null);
                setActiveDragId(null);
              }}
            >
              <SortableContext
                items={sortableIds}
                strategy={verticalListSortingStrategy}
              >
                <SidebarTreeContext
                  nodes={tree}
                  contextId={null}
                  depth={0}
                  currentRoute={currentRoute}
                  routeParams={routeParams}
                  feeds={feeds}
                  expandedFolderIds={expandedFolderIds}
                  activeDropFolderId={activeDropFolderId}
                  toggleFolderTree={toggleFolderTree}
                  onToggleFolder={toggleFolder}
                  onSelectFolder={(folderId) =>
                    setCurrentRoute(ROUTE.FOLDER, { folderId })
                  }
                  onSelectFeed={(feedId) => setCurrentRoute(ROUTE.FEED, { feedId })}
                  onCreateFeed={handleCreateFeed}
                  onCreateFolder={handleCreateFolder}
                  editingFolderId={editingFolderId}
                  creatingFolderId={creatingFolderId}
                  creatingFeedId={creatingFeedId}
                  editingFeedId={editingFeedId}
                  pendingDeleteFolderId={pendingDeleteFolderId}
                  onCommitFolderRename={handleCommitFolderRename}
                  onCommitFeedRename={handleCommitFeedRename}
                  onCancelFolderRename={() => setEditingFolderId(null)}
                  onCancelCreateFolder={handleCancelCreateFolder}
                  onCancelFeedRename={() => setEditingFeedId(null)}
                  onStartFolderRename={(folderId) => setEditingFolderId(folderId)}
                  onStartFeedRename={(feedId) => setEditingFeedId(feedId)}
                  onRequestDeleteFolder={(folderId) => setPendingDeleteFolderId(folderId)}
                  onCancelDeleteFolder={() => setPendingDeleteFolderId(null)}
                  onConfirmDeleteFolder={handleDeleteFolder}
                  onDeleteFeed={handleDeleteFeed}
                  onMoveFeedIntoNewFolder={handleMoveFeedIntoNewFolder}
                  onSubmitFeedUrl={handleSubmitFeedUrl}
                  onCancelCreateFeed={handleCancelCreateFeed}
                />
              </SortableContext>
              <DragOverlay>
                {activeDragItem ? (
                  <SidebarDragPreview
                    type={activeDragItem.type}
                    label={activeDragItem.label}
                    iconUrl={activeDragItem.iconUrl}
                  />
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        </div>
      </div>

      <div className="pt-3">
        <label className="flex w-fit items-center gap-2 rounded-[10px] px-2 py-1.5 text-[11px] font-medium text-content-muted transition-colors hover:bg-interactive-hover hover:text-content">
          <Switch
            checked={resolvedTheme === "dark"}
            onCheckedChange={() => toggleTheme()}
            aria-label="Toggle dark mode"
            className="h-4.5 w-8 p-[2px] data-[state=checked]:bg-accent"
          />
          <span>Dark</span>
        </label>
      </div>
    </div>
  );
}

function SidebarTreeContext({
  nodes,
  contextId,
  depth,
  currentRoute,
  routeParams,
  feeds,
  expandedFolderIds,
  activeDropFolderId,
  toggleFolderTree,
  onToggleFolder,
  onSelectFolder,
  onSelectFeed,
  onCreateFeed,
  onCreateFolder,
  editingFolderId,
  creatingFolderId,
  creatingFeedId,
  editingFeedId,
  pendingDeleteFolderId,
  onCommitFolderRename,
  onCommitFeedRename,
  onCancelFolderRename,
  onCancelCreateFolder,
  onCancelFeedRename,
  onStartFolderRename,
  onStartFeedRename,
  onRequestDeleteFolder,
  onCancelDeleteFolder,
  onConfirmDeleteFolder,
  onDeleteFeed,
  onMoveFeedIntoNewFolder,
  onSubmitFeedUrl,
  onCancelCreateFeed,
}: {
  nodes: SidebarNode[];
  contextId: string | null;
  depth: number;
  currentRoute: ROUTE;
  routeParams: Record<string, string | number | boolean | null>;
  feeds: Array<{ id: string; iconUrl: string | null; folderId: string | null }>;
  expandedFolderIds: Record<string, boolean>;
  activeDropFolderId: string | null;
  toggleFolderTree: (folderId: string) => void;
  onToggleFolder: (folderId: string) => void;
  onSelectFolder: (folderId: string) => void;
  onSelectFeed: (feedId: string) => void;
  onCreateFeed: (folderId?: string | null) => void | Promise<void>;
  onCreateFolder: (parentFolderId?: string | null) => void | Promise<void>;
  editingFolderId: string | null;
  creatingFolderId: string | null;
  creatingFeedId: string | null;
  editingFeedId: string | null;
  pendingDeleteFolderId: string | null;
  onCommitFolderRename: (
    folderId: string,
    name: string,
  ) => void | Promise<void>;
  onCommitFeedRename: (feedId: string, title: string) => void | Promise<void>;
  onCancelFolderRename: () => void;
  onCancelCreateFolder: (folderId: string) => void | Promise<void>;
  onCancelFeedRename: () => void;
  onStartFolderRename: (folderId: string) => void;
  onStartFeedRename: (feedId: string) => void;
  onRequestDeleteFolder: (folderId: string) => void;
  onCancelDeleteFolder: () => void;
  onConfirmDeleteFolder: (folderId: string) => void | Promise<void>;
  onDeleteFeed: (feedId: string) => void | Promise<void>;
  onMoveFeedIntoNewFolder: (feedId: string) => void | Promise<void>;
  onSubmitFeedUrl: (feedId: string, value: string) => void | Promise<void>;
  onCancelCreateFeed: (feedId: string) => void | Promise<void>;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <SidebarDropZone
        id={buildContextDropZoneId(contextId, 0)}
        depth={depth}
      />

      {nodes.map((node, index) => {
        if (node.type === "feed") {
          const isActive =
            currentRoute === ROUTE.FEED && routeParams.feedId === node.id;

          return (
            <div key={node.id} className="flex flex-col">
              <SidebarFeedItem
                id={node.id}
                label={node.title}
                iconUrl={feeds.find((feed) => feed.id === node.id)?.iconUrl ?? null}
                depth={depth}
                isActive={isActive}
                isEditing={editingFeedId === node.id}
                isCreating={creatingFeedId === node.id}
                onClick={() => {
                  if (creatingFeedId !== node.id && editingFeedId !== node.id) {
                    onSelectFeed(node.id);
                  }
                }}
                onDoubleClick={() => {
                  if (creatingFeedId !== node.id && editingFeedId !== node.id) {
                    onStartFeedRename(node.id);
                  }
                }}
                onCommitRename={(value) => onCommitFeedRename(node.id, value)}
                onCancelRename={onCancelFeedRename}
                onContextMenuRename={() => onStartFeedRename(node.id)}
                onContextMenuMoveIntoNewFolder={() =>
                  void onMoveFeedIntoNewFolder(node.id)
                }
                onContextMenuDelete={() => void onDeleteFeed(node.id)}
                onSubmitUrl={(value) => onSubmitFeedUrl(node.id, value)}
                onCancelCreate={() => onCancelCreateFeed(node.id)}
              />
              <SidebarDropZone
                id={buildContextDropZoneId(contextId, index + 1)}
                depth={depth}
              />
            </div>
          );
        }

        const isExpanded = expandedFolderIds[node.id] ?? true;
        const isActive =
          currentRoute === ROUTE.FOLDER && routeParams.folderId === node.id;
        const isDeletePending = pendingDeleteFolderId === node.id;
        const pendingDeleteFolderIds = isDeletePending
          ? [node.id, ...getDescendantFolderIdsFromNodes(node)]
          : [];
        const pendingDeleteFeedCount = feeds.filter(
          (feed) => feed.folderId && pendingDeleteFolderIds.includes(feed.folderId),
        ).length;
        const pendingDeleteSubfolderCount = Math.max(
          0,
          pendingDeleteFolderIds.length - 1,
        );
        const deleteConfirmationMessage = isDeletePending
          ? pendingDeleteSubfolderCount > 0 || pendingDeleteFeedCount > 0
            ? `This will permanently delete ${pendingDeleteSubfolderCount} subfolder${pendingDeleteSubfolderCount === 1 ? "" : "s"}, ${pendingDeleteFeedCount} feed${pendingDeleteFeedCount === 1 ? "" : "s"}, and all stored articles inside them.`
            : "This folder is empty."
          : null;

        return (
          <div key={node.id} className="flex flex-col">
            <SidebarFolderItem
              id={node.id}
              label={node.name}
              depth={depth}
              isExpanded={isExpanded}
              isActive={isActive}
              isDropTarget={activeDropFolderId === node.id}
              dropInsideZoneId={buildFolderRowDropZoneId(node.id)}
              isCreating={creatingFolderId === node.id}
              isEditing={editingFolderId === node.id}
              onToggle={() => onToggleFolder(node.id)}
              onClick={(event) => {
                if (editingFolderId === node.id) {
                  return;
                }

                if (event.altKey) {
                  toggleFolderTree(node.id);
                  return;
                }

                onSelectFolder(node.id);
              }}
              onContextMenuCreateFeed={() => void onCreateFeed(node.id)}
              onContextMenuCreateFolder={() => void onCreateFolder(node.id)}
              onContextMenuRename={() => onStartFolderRename(node.id)}
              onContextMenuDelete={() => onRequestDeleteFolder(node.id)}
              onCommitRename={(name) => onCommitFolderRename(node.id, name)}
              onCancelRename={onCancelFolderRename}
              onCancelCreate={() => onCancelCreateFolder(node.id)}
              deleteConfirmationMessage={deleteConfirmationMessage}
              onCancelDelete={onCancelDeleteFolder}
              onConfirmDelete={() => void onConfirmDeleteFolder(node.id)}
            />

            {isExpanded ? (
              <SidebarTreeContext
                nodes={node.children}
                contextId={node.id}
                depth={depth + 1}
                currentRoute={currentRoute}
                routeParams={routeParams}
                feeds={feeds}
                expandedFolderIds={expandedFolderIds}
                activeDropFolderId={activeDropFolderId}
                toggleFolderTree={toggleFolderTree}
                onToggleFolder={onToggleFolder}
                onSelectFolder={onSelectFolder}
                onSelectFeed={onSelectFeed}
                onCreateFeed={onCreateFeed}
                onCreateFolder={onCreateFolder}
                editingFolderId={editingFolderId}
                creatingFolderId={creatingFolderId}
                creatingFeedId={creatingFeedId}
                editingFeedId={editingFeedId}
                pendingDeleteFolderId={pendingDeleteFolderId}
                onCommitFolderRename={onCommitFolderRename}
                onCommitFeedRename={onCommitFeedRename}
                onCancelFolderRename={onCancelFolderRename}
                onCancelCreateFolder={onCancelCreateFolder}
                onCancelFeedRename={onCancelFeedRename}
                onStartFolderRename={onStartFolderRename}
                onStartFeedRename={onStartFeedRename}
                onRequestDeleteFolder={onRequestDeleteFolder}
                onCancelDeleteFolder={onCancelDeleteFolder}
                onConfirmDeleteFolder={onConfirmDeleteFolder}
                onDeleteFeed={onDeleteFeed}
                onMoveFeedIntoNewFolder={onMoveFeedIntoNewFolder}
                onSubmitFeedUrl={onSubmitFeedUrl}
                onCancelCreateFeed={onCancelCreateFeed}
              />
            ) : null}

            <SidebarDropZone
              id={buildContextDropZoneId(contextId, index + 1)}
              depth={depth}
            />
          </div>
        );
      })}
    </div>
  );
}

function flattenNodeIds(nodes: SidebarNode[]): string[] {
  return nodes.flatMap((node) =>
    node.type === "folder"
      ? [node.id, ...flattenNodeIds(node.children)]
      : [node.id],
  );
}

function getDescendantFolderIds(
  folders: Array<{ id: string; parentFolderId: string | null }>,
  folderId: string,
): string[] {
  const childFolderIds = folders
    .filter((folder) => folder.parentFolderId === folderId)
    .map((folder) => folder.id);

  return childFolderIds.flatMap((childFolderId) => [
    childFolderId,
    ...getDescendantFolderIds(folders, childFolderId),
  ]);
}

function getDescendantFolderIdsFromNodes(node: Extract<SidebarNode, { type: "folder" }>): string[] {
  return node.children.flatMap((child) =>
    child.type === "folder"
      ? [child.id, ...getDescendantFolderIdsFromNodes(child)]
      : [],
  );
}

function getSidebarDragItem(
  nodes: SidebarNode[],
  feeds: Array<{ id: string; iconUrl: string | null }>,
  id: string,
): { type: "folder" | "feed"; label: string; iconUrl?: string | null } | null {
  for (const node of nodes) {
    if (node.id === id) {
      if (node.type === "folder") {
        return {
          type: "folder",
          label: node.name,
        };
      }

      return {
        type: "feed",
        label: node.title,
        iconUrl: feeds.find((feed) => feed.id === node.id)?.iconUrl ?? null,
      };
    }

    if (node.type === "folder") {
      const nestedMatch = getSidebarDragItem(node.children, feeds, id);

      if (nestedMatch) {
        return nestedMatch;
      }
    }
  }

  return null;
}

function buildContextDropZoneId(contextId: string | null, index: number) {
  return `dropzone:${contextId ?? "root"}:${index}`;
}

function buildFolderRowDropZoneId(folderId: string) {
  return `folderrow:${folderId}`;
}

function parseContextDropZoneId(id: string) {
  if (id.startsWith("folderrow:")) {
    const [, folderId] = id.split(":");

    if (!folderId) {
      return null;
    }

    return {
      contextId: folderId,
      index: 0,
    };
  }

  if (!id.startsWith("dropzone:")) {
    return null;
  }

  const [, rawContextId, rawIndex] = id.split(":");

  if (rawIndex === undefined) {
    return null;
  }

  return {
    contextId: rawContextId === "root" ? null : rawContextId,
    index: Number(rawIndex),
  };
}
