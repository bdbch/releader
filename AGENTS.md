# AGENTS.md

## Project Overview

This project is a **native RSS Reader app** built with **Tauri 2.0**.

### Product goals
- Feel **native** on desktop platforms
- Be **simple**, **minimalistic**, and fast
- Use a **custom design language** that still feels “natively desktop”
- Use a **custom Tailwind theme**
- Store RSS data in a **simple persistent datastore** for now
- Prioritize clarity, readability, and low UI noise

---

## Core Product Principles

### 1. Native feel first
Agents should favor decisions that make the app feel like a real desktop app:
- responsive interactions
- keyboard-friendly flows
- subtle animations only where useful
- restrained spacing and typography
- desktop-like sidebar, panels, lists, and context actions

### 2. Minimalistic UI
- avoid unnecessary controls
- prefer clean list/detail layouts
- keep visual hierarchy strong and obvious
- reduce cognitive load
- default to simple solutions over clever ones
- do not add unnecessary descriptive copy, helper text, or marketing-style language in the UI

### 3. Custom but native-like design
The app should not copy one OS exactly, but it should feel at home on desktop:
- muted surfaces
- clear hover/active states
- practical spacing
- readable typography
- polished empty/loading/error states

### 4. Incremental architecture
For now, optimize for:
- correctness
- maintainability
- simple persistence
- easy iteration

Do **not** prematurely optimize for scale or distributed sync.

---

## Tech Direction

### App shell
- **Tauri 2.0** for native desktop app shell

### Frontend
- Use the existing frontend stack in the repo
- Prefer **component-driven UI**
- Use **Tailwind CSS** with a **custom theme**
- Prefer **Radix UI primitives** for select, dropdown, popover, dialog, and similar interactive overlay components
- Build reusable primitives for:
  - sidebar
  - feed/folder tree
  - filters
  - article list rows
  - article detail/content view
  - empty states
  - dialogs/popovers

### Persistence
Use a **simple persistent datastore** for now.
Preferred characteristics:
- local-first
- easy schema evolution
- straightforward querying for feeds, folders, items, read/unread state
- suitable for Tauri desktop usage

Good early options may include:
- SQLite
- lightweight JSON-backed storage if scope is still exploratory

Default preference: **SQLite** if implementation complexity remains reasonable.

---

## Information Architecture

## Main views

### Dashboard
Shows **all new news/items** with filters.

Expected behavior:
- aggregate across all feeds
- support filtering
- optimized for quick scanning

### Unread
Shows **all unread news/items** with the same filters, except:
- no unread/read toggle needed

### Folder view
Shows **all news/items inside a selected folder/category** with filters.

### Feed view
Shows **all news/items from a selected feed** with filters, except:
- no feed filter needed when already scoped to a feed

---

## Filtering Principles

Filtering should be consistent wherever possible.

Potential filter dimensions:
- read / unread
- starred / saved
- date/time range
- feed
- folder
- text search
- maybe tags later

Rules:
- dashboard: full filter set
- unread: same as dashboard except read/unread filter
- folder view: all relevant filters except folder selector if already scoped
- feed view: all relevant filters except feed selector if already scoped

Agents should keep filtering logic centralized and reusable.

---

## Sidebar / Folder / Feed Tree

### Required structure
- folders can contain **subfolders**
- folders can contain **feeds/items**
- subfolders and feeds can appear in **any order internally**
- in the sidebar UI, **folders must always render before feeds**

### Tree behavior
- folders are **collapsible**
- tree supports **multi-level nesting**
- structure must be easy to understand visually
- nesting depth should remain readable

### Drag and drop
The sidebar should support:
- multi-level drag-and-drop
- moving folders within folders
- reordering siblings
- moving feeds between folders
- preserving valid tree structure

Potential library:
- **dnd-kit**: https://dndkit.com/

Agents should prefer an implementation that:
- is predictable
- supports keyboard accessibility where possible
- keeps tree state and persisted structure in sync
- avoids fragile one-off drag logic

---

## Data Model Guidance

Initial domain entities should likely include:

### Folder
- id
- name
- parent_folder_id (nullable)
- sort_order / ordering metadata
- created_at
- updated_at

### Feed
- id
- title
- url
- site_url
- folder_id (nullable)
- sort_order / ordering metadata
- icon/favicon (optional)
- last_fetched_at
- created_at
- updated_at

### Article / Item
- id
- feed_id
- guid / external_id
- title
- author (optional)
- url
- content / summary
- published_at
- fetched_at
- is_read
- is_starred
- created_at
- updated_at

### Optional future entities
- tags
- sync metadata
- article attachments
- cached full-content versions

Agents should design schemas with future evolution in mind, but keep v1 simple.

---

## UX Guidance

### Visual style
- quiet, refined, desktop-like
- strong typography
- subtle separators
- restrained colors
- no overly playful mobile-first patterns
- target a native visual language with a mix of **macOS + shadcn + Notion**
- avoid oversized typography and overly spacious layouts
- prefer compact, calm control styling and native-feeling interaction patterns

### Interaction style
- fast navigation
- obvious selection states
- hover/active/focus states must be polished
- avoid modal-heavy flows where unnecessary

### Content reading
Reading experience should prioritize:
- readability
- calm spacing
- good contrast
- link clarity
- clean typography for long-form content

---

## Tailwind Theme Guidance

Agents working on styling should:
- define semantic tokens, not only raw colors
- use theme values for:
  - background layers
  - foreground text
  - muted text
  - borders
  - hover/active states
  - accent color
  - destructive/warning states
- keep the theme extensible for possible future light/dark support

Avoid hardcoded color values scattered across components.

---

## Engineering Preferences

### Favor
- small reusable components
- clear state boundaries
- simple data flow
- explicit typing
- composable utilities
- predictable folder/feed tree transformations

### Avoid
- premature abstraction
- over-engineered state management
- tightly coupling UI tree rendering with persistence logic
- duplicated filtering logic across views
- deeply nested unreadable components

---

## Suggested Milestones

### Milestone 1: Foundations
- app shell
- base layout
- sidebar
- custom Tailwind theme
- local datastore setup
- core types/models

### Milestone 2: Feed and folder management
- create/edit/delete folders
- create/edit/delete feeds
- nested tree rendering
- collapsible folders
- drag-and-drop reordering and nesting

### Milestone 3: Reading flows
- dashboard
- unread view
- folder view
- feed view
- unified filtering

### Milestone 4: Item state
- mark read/unread
- bulk actions
- save/star items
- improve content rendering

### Milestone 5: Polish
- empty states
- loading states
- error handling
- keyboard UX
- desktop-native refinements

---

## Agent Instructions

When contributing to this project, agents should:

1. Preserve the product goals:
   - native feel
   - minimalism
   - clarity
   - maintainability

2. Prefer practical desktop UX over flashy UI patterns.

3. Keep data storage simple unless a more complex solution is clearly justified.

4. Treat the sidebar tree as a core architectural concern:
   - nested folders
   - folders before feeds in rendering
   - drag-and-drop correctness
   - persistence consistency

5. Reuse filtering and list logic across:
   - dashboard
   - unread
   - folder view
   - feed view

6. Make UI decisions that support future polish, not just quick prototypes.

7. When unsure, choose the simpler implementation that keeps the app fast and understandable.

8. When styling UI, aim for a native, minimal desktop feel with a **macOS + shadcn + Notion** mix:
   - restrained typography
   - compact spacing
   - subtle control chrome
   - native-feeling interactions over website-like marketing layouts

9. Avoid unnecessary descriptive UI copy:
   - do not add helper text unless it materially improves usability
   - avoid marketing-style headings, descriptions, and filler copy in panels and popovers
   - prefer concise labels over explanatory text when the control is already clear

---

## Nice-to-have Future Ideas

- full-text search
- article tagging
- keyboard shortcuts
- offline caching improvements
- OPML import/export
- sync across devices
- notifications for new items
- per-feed fetch settings
- dark mode / theme variants

---

## Definition of Success

A successful v1 feels like:
- a calm and polished desktop RSS reader
- easy to scan
- easy to organize
- easy to trust
- visually custom, but naturally desktop-native
