import { useEffect, useMemo, useState } from "react";
import type { DragEndEvent, DragMoveEvent } from "@dnd-kit/core";
import {
  DndContext,
  MouseSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { LayoutDashboardIcon, MailIcon } from "lucide-react";
import { moveSidebarNode } from "@/lib/sidebarMove";
import { buildSidebarTree } from "@/lib/sidebarTree";
import { ROUTE, useRoutes } from "@/stores/routeStore";
import { useSidebarStore } from "@/stores/sidebarStore";
import type { SidebarNode } from "@/types/sidebar";
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
  const setSidebarStructure = useSidebarStore((state) => state.setSidebarStructure);
  const persistSidebarStructure = useSidebarStore(
    (state) => state.persistSidebarStructure,
  );
  const [activeDropFolderId, setActiveDropFolderId] = useState<string | null>(null);

  useEffect(() => {
    void loadSidebarData();
  }, [loadSidebarData]);

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
        <div className="px-2 text-[10px] font-medium uppercase tracking-[0.12em] text-content-subtle">
          Library
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
          <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
            <SidebarTreeContext
              nodes={tree}
              contextId={null}
              depth={0}
              currentRoute={currentRoute}
              routeParams={routeParams}
              expandedFolderIds={expandedFolderIds}
              activeDropFolderId={activeDropFolderId}
              toggleFolderTree={toggleFolderTree}
              onToggleFolder={toggleFolder}
              onSelectFolder={(folderId) =>
                setCurrentRoute(ROUTE.FOLDER, { folderId })
              }
              onSelectFeed={(feedId) => setCurrentRoute(ROUTE.FEED, { feedId })}
            />
          </SortableContext>
        </DndContext>
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
  expandedFolderIds,
  activeDropFolderId,
  toggleFolderTree,
  onToggleFolder,
  onSelectFolder,
  onSelectFeed,
}: {
  nodes: SidebarNode[];
  contextId: string | null;
  depth: number;
  currentRoute: ROUTE;
  routeParams: Record<string, string | number | boolean | null>;
  expandedFolderIds: Record<string, boolean>;
  activeDropFolderId: string | null;
  toggleFolderTree: (folderId: string) => void;
  onToggleFolder: (folderId: string) => void;
  onSelectFolder: (folderId: string) => void;
  onSelectFeed: (feedId: string) => void;
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
            <div key={node.id} className="flex flex-col gap-0.5">
              <SidebarFeedItem
                id={node.id}
                label={node.title}
                depth={depth}
                isActive={isActive}
                onClick={() => onSelectFeed(node.id)}
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
          <div key={node.id} className="flex flex-col gap-0.5">
            <SidebarFolderItem
              id={node.id}
              label={node.name}
              depth={depth}
              isExpanded={isExpanded}
              isActive={isActive}
              isDropTarget={activeDropFolderId === node.id}
              dropInsideZoneId={buildFolderRowDropZoneId(node.id)}
              onToggle={() => onToggleFolder(node.id)}
              onClick={(event) => {
                if (event.altKey) {
                  toggleFolderTree(node.id);
                  return;
                }

                onSelectFolder(node.id);
              }}
            />

            {isExpanded ? (
              <SidebarTreeContext
                nodes={node.children}
                contextId={node.id}
                depth={depth + 1}
                currentRoute={currentRoute}
                routeParams={routeParams}
                expandedFolderIds={expandedFolderIds}
                activeDropFolderId={activeDropFolderId}
                toggleFolderTree={toggleFolderTree}
                onToggleFolder={onToggleFolder}
                onSelectFolder={onSelectFolder}
                onSelectFeed={onSelectFeed}
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
