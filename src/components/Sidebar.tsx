import { useEffect, useMemo, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import type { DragEndEvent, DragMoveEvent } from "@dnd-kit/core";
import {
  DndContext,
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
import { Button } from "@/components/ui/Button";
import { SidebarDropZone } from "./SidebarDropZone";
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
  const isLoading = useSidebarStore((state) => state.isLoading);
  const error = useSidebarStore((state) => state.error);
  const loadSidebarData = useSidebarStore((state) => state.loadSidebarData);
  const toggleFolder = useSidebarStore((state) => state.toggleFolder);
  const toggleFolderTree = useSidebarStore((state) => state.toggleFolderTree);
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
  const [activeDropFolderId, setActiveDropFolderId] = useState<string | null>(
    null,
  );
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [creatingFeedId, setCreatingFeedId] = useState<string | null>(null);
  const [editingFeedId, setEditingFeedId] = useState<string | null>(null);
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
      return;
    }

    setSidebarStructure(nextState.folders, nextState.feeds);
    setActiveDropFolderId(null);
    void persistSidebarStructure();
  }

  async function handleCreateFolder() {
    const folder = await createRootFolder();
    setEditingFolderId(folder.id);
  }

  async function handleCreateFeed() {
    const feed = await createDraftFeed();
    setCreatingFeedId(feed.id);
  }

  async function handleCommitFolderRename(folderId: string, name: string) {
    try {
      await renameFolder(folderId, name);
      setEditingFolderId(null);
    } catch {
      setEditingFolderId(null);
    }
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

  const pendingDeleteFolder = pendingDeleteFolderId
    ? folders.find((folder) => folder.id === pendingDeleteFolderId) ?? null
    : null;
  const pendingDeleteFolderIds = pendingDeleteFolderId
    ? [pendingDeleteFolderId, ...getDescendantFolderIds(folders, pendingDeleteFolderId)]
    : [];
  const pendingDeleteFeedCount = feeds.filter(
    (feed) => feed.folderId && pendingDeleteFolderIds.includes(feed.folderId),
  ).length;
  const pendingDeleteSubfolderCount = Math.max(0, pendingDeleteFolderIds.length - 1);

  return (
    <div className="flex flex-col gap-5">
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

      <div className="flex flex-col gap-1">
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

        {isLoading ? (
          <div className="px-2 text-[12px] text-content-muted">Loading…</div>
        ) : null}

        {error ? (
          <div className="px-2 text-[12px] text-danger">{error}</div>
        ) : null}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveDropFolderId(null)}
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
              editingFolderId={editingFolderId}
              creatingFeedId={creatingFeedId}
              editingFeedId={editingFeedId}
              onCommitFolderRename={handleCommitFolderRename}
              onCommitFeedRename={handleCommitFeedRename}
              onCancelFolderRename={() => setEditingFolderId(null)}
              onCancelFeedRename={() => setEditingFeedId(null)}
              onStartFolderRename={(folderId) => setEditingFolderId(folderId)}
              onStartFeedRename={(feedId) => setEditingFeedId(feedId)}
              onRequestDeleteFolder={(folderId) => setPendingDeleteFolderId(folderId)}
              onDeleteFeed={handleDeleteFeed}
              onSubmitFeedUrl={handleSubmitFeedUrl}
              onCancelCreateFeed={handleCancelCreateFeed}
            />
          </SortableContext>
        </DndContext>
      </div>

      {pendingDeleteFolder ? (
        <div className="mx-2 rounded-[12px] border border-border-subtle bg-surface-subtle p-2.5">
          <div className="text-[12px] font-medium text-content">
            Delete "{pendingDeleteFolder.name}"?
          </div>
          <div className="mt-1 text-[12px] leading-5 text-content-muted">
            {pendingDeleteSubfolderCount > 0 || pendingDeleteFeedCount > 0
              ? `This will permanently delete ${pendingDeleteSubfolderCount} subfolder${pendingDeleteSubfolderCount === 1 ? "" : "s"}, ${pendingDeleteFeedCount} feed${pendingDeleteFeedCount === 1 ? "" : "s"}, and all stored articles inside them.`
              : "This folder is empty."}
          </div>
          <div className="mt-2.5 flex items-center justify-end gap-1.5">
            <Button
              variant="secondary"
              size="sm"
              className="h-7 rounded-[9px] border-border-subtle bg-background px-2.5 text-[12px] font-medium text-content-muted shadow-none hover:bg-interactive-hover hover:text-content"
              onClick={() => setPendingDeleteFolderId(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="h-7 rounded-[9px] px-2.5 text-[12px] font-medium shadow-none"
              onClick={() => void handleDeleteFolder(pendingDeleteFolder.id)}
            >
              Delete folder
            </Button>
          </div>
        </div>
      ) : null}
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
  editingFolderId,
  creatingFeedId,
  editingFeedId,
  onCommitFolderRename,
  onCommitFeedRename,
  onCancelFolderRename,
  onCancelFeedRename,
  onStartFolderRename,
  onStartFeedRename,
  onRequestDeleteFolder,
  onDeleteFeed,
  onSubmitFeedUrl,
  onCancelCreateFeed,
}: {
  nodes: SidebarNode[];
  contextId: string | null;
  depth: number;
  currentRoute: ROUTE;
  routeParams: Record<string, string | number | boolean | null>;
  feeds: Array<{ id: string; iconUrl: string | null }>;
  expandedFolderIds: Record<string, boolean>;
  activeDropFolderId: string | null;
  toggleFolderTree: (folderId: string) => void;
  onToggleFolder: (folderId: string) => void;
  onSelectFolder: (folderId: string) => void;
  onSelectFeed: (feedId: string) => void;
  editingFolderId: string | null;
  creatingFeedId: string | null;
  editingFeedId: string | null;
  onCommitFolderRename: (
    folderId: string,
    name: string,
  ) => void | Promise<void>;
  onCommitFeedRename: (feedId: string, title: string) => void | Promise<void>;
  onCancelFolderRename: () => void;
  onCancelFeedRename: () => void;
  onStartFolderRename: (folderId: string) => void;
  onStartFeedRename: (feedId: string) => void;
  onRequestDeleteFolder: (folderId: string) => void;
  onDeleteFeed: (feedId: string) => void | Promise<void>;
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
                onCommitRename={(value) => onCommitFeedRename(node.id, value)}
                onCancelRename={onCancelFeedRename}
                onContextMenuRename={() => onStartFeedRename(node.id)}
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
              onContextMenuRename={() => onStartFolderRename(node.id)}
              onContextMenuDelete={() => onRequestDeleteFolder(node.id)}
              onCommitRename={(name) => onCommitFolderRename(node.id, name)}
              onCancelRename={onCancelFolderRename}
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
                editingFolderId={editingFolderId}
                creatingFeedId={creatingFeedId}
                editingFeedId={editingFeedId}
                onCommitFolderRename={onCommitFolderRename}
                onCommitFeedRename={onCommitFeedRename}
                onCancelFolderRename={onCancelFolderRename}
                onCancelFeedRename={onCancelFeedRename}
                onStartFolderRename={onStartFolderRename}
                onStartFeedRename={onStartFeedRename}
                onRequestDeleteFolder={onRequestDeleteFolder}
                onDeleteFeed={onDeleteFeed}
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
