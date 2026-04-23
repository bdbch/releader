import { useCallback, useEffect, useState, type MouseEvent } from "react";

type UseItemSelectionOptions = {
  itemIds: string[];
  scopeKey?: string;
  enableSelectAll?: boolean;
};

export function useItemSelection({
  itemIds,
  scopeKey,
  enableSelectAll = false,
}: UseItemSelectionOptions) {
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [selectionAnchorId, setSelectionAnchorId] = useState<string | null>(null);
  const hasSelection = selectedItemIds.length > 0;

  const clearSelection = useCallback(() => {
    setSelectedItemIds([]);
    setSelectionAnchorId(null);
  }, []);

  const selectAll = useCallback(() => {
    setSelectedItemIds(itemIds);
    setSelectionAnchorId(itemIds[0] ?? null);
  }, [itemIds]);

  const handleItemClick = useCallback(
    (event: MouseEvent<HTMLElement>, itemId: string) => {
      const isToggleSelection = event.metaKey || event.ctrlKey;
      const isRangeSelection = event.shiftKey;

      if (isRangeSelection) {
        const anchorId = selectionAnchorId ?? selectedItemIds[selectedItemIds.length - 1] ?? itemId;
        const nextRangeIds = getRangeSelection(itemIds, anchorId, itemId);

        setSelectedItemIds(nextRangeIds);
        setSelectionAnchorId(anchorId);
        return;
      }

      if (isToggleSelection) {
        setSelectedItemIds((current) => {
          if (current.includes(itemId)) {
            const nextSelection = current.filter((currentItemId) => currentItemId !== itemId);
            setSelectionAnchorId(nextSelection[nextSelection.length - 1] ?? null);
            return nextSelection;
          }

          const nextSelection = [...current, itemId];
          setSelectionAnchorId(itemId);
          return nextSelection;
        });
        return;
      }

      setSelectedItemIds([itemId]);
      setSelectionAnchorId(itemId);
    },
    [itemIds, selectedItemIds, selectionAnchorId],
  );

  useEffect(() => {
    clearSelection();
  }, [clearSelection, scopeKey]);

  useEffect(() => {
    setSelectedItemIds((current) => current.filter((itemId) => itemIds.includes(itemId)));
    setSelectionAnchorId((current) => (current && itemIds.includes(current) ? current : null));
  }, [itemIds]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target instanceof HTMLInputElement ||
          target instanceof HTMLTextAreaElement ||
          target instanceof HTMLSelectElement)
      ) {
        return;
      }

      if (event.key === "Escape") {
        clearSelection();
        return;
      }

      if (
        enableSelectAll &&
        hasSelection &&
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === "a"
      ) {
        event.preventDefault();
        selectAll();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [clearSelection, enableSelectAll, hasSelection, selectAll]);

  return {
    selectedItemIds,
    hasSelection,
    clearSelection,
    selectAll,
    handleItemClick,
  };
}

function getRangeSelection(itemIds: string[], startId: string, endId: string) {
  const startIndex = itemIds.indexOf(startId);
  const endIndex = itemIds.indexOf(endId);

  if (startIndex === -1 || endIndex === -1) {
    return [endId];
  }

  const rangeStart = Math.min(startIndex, endIndex);
  const rangeEnd = Math.max(startIndex, endIndex);
  return itemIds.slice(rangeStart, rangeEnd + 1);
}
