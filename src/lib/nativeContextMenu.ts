import type { MouseEvent } from "react";
import { Menu, PredefinedMenuItem } from "@tauri-apps/api/menu";
import { LogicalPosition } from "@tauri-apps/api/dpi";
import { getCurrentWindow } from "@tauri-apps/api/window";

let activeContextMenu: Menu | null = null;

export type NativeContextMenuItem =
  | {
      type?: "item";
      id: string;
      text: string;
      enabled?: boolean;
      onSelect?: () => void | Promise<void>;
    }
  | {
      type: "separator";
    }
  | {
      type: "predefined";
      item: "Copy" | "Cut" | "Paste" | "SelectAll" | "Undo" | "Redo";
      text?: string;
    };

export async function showNativeContextMenu(
  event: MouseEvent<HTMLElement>,
  items: NativeContextMenuItem[],
) {
  if (items.length === 0) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();

  if (activeContextMenu) {
    await activeContextMenu.close().catch(() => undefined);
    activeContextMenu = null;
  }

  let menu: Menu | null = null;

  menu = await Menu.new({
    items: await Promise.all(
      items.map(async (item) => {
        if (item.type === "separator") {
          return PredefinedMenuItem.new({ item: "Separator" });
        }

        if (item.type === "predefined") {
          return PredefinedMenuItem.new({
            item: item.item,
            text: item.text,
          });
        }

        return {
          id: item.id,
          text: item.text,
          enabled: item.enabled,
          action: () => {
            if (menu) {
              void menu.close().catch(() => undefined);
              if (activeContextMenu?.rid === menu.rid) {
                activeContextMenu = null;
              }
            }
            void item.onSelect?.();
          },
        };
      }),
    ),
  });

  activeContextMenu = menu;

  await menu.popup(
    new LogicalPosition(event.clientX, event.clientY),
    getCurrentWindow(),
  );
}
