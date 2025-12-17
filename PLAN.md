# Trello Clone - Step-by-Step Implementation Plan (RxDB Version)

## Key Technical Decisions

1. **RxDB** - Local-first database with built-in IndexedDB storage, BroadcastChannel sync, and Firestore replication. ✅ **Verified**: Excellent choice - offline functionality works seamlessly with LWW conflict resolution.
2. **Firebase Firestore** (not Realtime Database) - RxDB has built-in Firestore replication plugin with LWW conflict resolution
3. **Last-Write-Wins (LWW)** - RxDB handles conflict resolution automatically using timestamps. ✅ **Tested**: Works correctly in offline scenarios.
4. **Optimistic Updates** - UI updates immediately via RxDB reactive queries, sync happens in background
5. **RxDB Collections** - Each entity type (boards, columns, cards) will be an RxDB collection with reactive queries
6. **Zustand + RxDB** - Zustand for UI state management, RxDB for persistence and sync (connected via reactive queries)


## 📊 Progress Summary

**Completed Phases: 9.25/11**
- ✅ Phase 1: Foundation
- ✅ Phase 2: RxDB Setup & Data Models (Boards & Columns schemas)
- ✅ Phase 3: Zustand Store Integration
- ✅ Phase 4: BroadcastChannel Tab Sync
- ✅ Phase 5: Basic UI - Boards List
- ✅ Phase 6: Board Detail & Columns
- ✅ Phase 7: Firebase Integration (Firestore Replication ✅ Complete, Offline Support ✅ Verified, Auth ✅ Complete)
- ✅ Phase 8: Cards (Display + CRUD + Firestore Sync ✅ Complete)
- ✅ Phase 9: Drag & Drop (Column Reordering ✅ Complete, Card Drag & Drop ✅ Complete, UX Improvements ✅ Complete, Polish & Smooth Experience ✅ Complete)
- ✅ Phase 10.1: Multi-User Support (Users can access their own boards via ownerId ✅ Complete)
- ✅ Phase 11.1: Offline Indicator (Status Indicator ✅ Complete with enum-based status, comprehensive tests)

**Remaining Phases: 1.75/11**
- ⏳ Phase 10.2-10.4: Sharing UI + Logic (Multi-User Support ✅ Complete, Sharing UI + Logic ⏳ Not Started)
- ⏳ Phase 11: Polish & Bonus Features (Offline Indicator ✅ Complete, Animations + Accessibility + PWA + Deployment)

**Core Features Status:**
- ✅ Boards CRUD (Create, Read, Update, Delete)
- ✅ Columns CRUD (Create, Read, Update, Delete)
- ✅ Cards CRUD (Create, Read, Update, Delete ✅ Complete)
- ✅ Firebase Sync (Firestore Replication ✅ Complete)
- ✅ Drag & Drop (Column Reordering ✅ Complete, Card Drag & Drop ✅ Complete - Within Column + Cross-Column, UX Improvements ✅ Complete, Polish & Smooth Experience ✅ Complete)
- ✅ Status Indicator (Sync status monitoring with enum-based status, comprehensive tests ✅ Complete)
- ⏳ Multi-User & Sharing (Multi-User Support ✅ Complete - users can access their own boards, Sharing UI + Logic ⏳ Not Started)

**Estimated Progress: ~93%**
- Foundation & Infrastructure: ✅ Complete
- Core Features (Boards/Columns/Cards): ✅ Complete
- Firebase Sync: ✅ Complete (Firestore Replication + Auth)
- Drag & Drop: ✅ Complete (Column Reordering + Card Drag & Drop Within Column + Cross-Column + UX Improvements + Polish & Smooth Experience)
- Status Monitoring: ✅ Complete (Enum-based sync status with comprehensive test coverage)
- Architecture Improvements: ✅ Parallel sync subscriptions with `ownerId` filtering (Boards, Columns & Cards)
- Remaining Features: ⏳ Sharing UI + Logic (Multi-User Support ✅ Complete - users can access their own boards), Additional Polish & Bonus Features

**Test Coverage**: 214 tests passing (unit + integration, including drag & drop tests and sync status tests)


## Implementation Steps

### ✅ Phase 1: Foundation (COMPLETED)

#### ✅ Step 1.1: Project Setup

- [x] Initialize Vite + React + TypeScript project
- [x] Install core dependencies: React, TypeScript, Vite
- [x] Configure TypeScript (`tsconfig.json`)
- [x] Configure Vite (`vite.config.ts`)
- [x] Add Vitest setup with React Testing Library
- [x] Create basic test: render "Hello World" component
- [x] **Test**: Verify project builds and test passes

#### ✅ Step 1.2: TailwindCSS v4 Setup

- [x] Install and configure TailwindCSS v4
- [x] Add base styles and configuration
- [x] Create a simple styled component
- [x] **Test**: Verify Tailwind classes apply correctly

#### ✅ Step 1.3: TanStack Router Setup

- [x] Install TanStack Router
- [x] Configure router with basic routes (`/` and `/boards/:boardId`)
- [x] Create placeholder pages
- [x] **Test**: Verify routing works (navigate between routes)

#### ✅ Step 1.4: Shadcn-UI Setup

- [x] Install Shadcn-UI CLI and dependencies
- [x] Configure `components.json`
- [x] Add a test component (Button)
- [x] **Test**: Verify Shadcn component renders and styles correctly

### ✅ Phase 2: RxDB Setup & Data Models (COMPLETED)

#### ✅ Step 2.1: RxDB Installation & Configuration

- [x] Install RxDB and required plugins
- [x] Create RxDB database instance
- [x] Configure IndexedDB storage adapter
- [x] **Test**: Verify RxDB database initializes successfully

#### ✅ Step 2.2: Define RxDB Schemas

- [x] Define RxDB JSON schemas for:
  - `Board`: id, title, createdAt, updatedAt, ownerId
  - `Column`: id, boardId, title, order, createdAt, updatedAt
- [x] Create RxDB collections with schemas (separate schema files)
- [x] **Test**: Verify collections are created and schemas validate correctly

#### ✅ Step 2.3: TypeScript Types from Schemas

- [x] Generate/define TypeScript types matching RxDB schemas
- [x] Create type guards and validators
- [x] **Test**: Verify type definitions work correctly

### ✅ Phase 3: Zustand Store Integration (COMPLETED)

#### ✅ Step 3.1: Zustand Setup

- [x] Install Zustand
- [x] Create basic store structure (boards, columns slices)
- [x] **Test**: Verify store creation and basic state access

#### ✅ Step 3.2: Connect Zustand to RxDB

- [x] Use RxDB reactive queries to sync store
- [x] Implement store actions that update RxDB collections
- [x] Handle RxDB changes → Zustand store updates
- [x] **Test**: Verify store stays in sync with RxDB changes

#### ✅ Step 3.3: Hydration on App Load

- [x] Load data from RxDB on app startup
- [x] Populate Zustand store with initial data
- [x] **Test**: Verify app loads data from RxDB on startup

### ✅ Phase 4: BroadcastChannel Tab Sync (COMPLETED)

#### ✅ Step 4.1: Enable RxDB BroadcastChannel Replication

- [x] Configure `multiInstance: true` in database config
- [x] BroadcastChannel-based synchronization automatically enabled
- [x] **Test**: Verify changes in one tab appear in another tab automatically

**Note**: RxDB automatically uses BroadcastChannel for multi-tab synchronization when `multiInstance: true` is set.

### ✅ Phase 5: Basic UI - Boards List (COMPLETED)

#### ✅ Step 5.1: Boards List Page

- [x] Create `/` route component
- [x] Display list of boards from Zustand store (synced with RxDB)
- [x] Add create board button
- [x] **Test**: Verify boards list renders and displays data

#### ✅ Step 5.2: Board CRUD Operations

- [x] Implement create board (with form/modal)
- [x] Implement rename board
- [x] Implement delete board
- [x] All operations update RxDB → Zustand → UI
- [x] **Test**: Verify all board CRUD operations work and persist

### ✅ Phase 6: Board Detail & Columns (COMPLETED)

#### ✅ Step 6.1: Board Detail Page

- [x] Create `/boards/:boardId` route
- [x] Display board title
- [x] Load columns for board from RxDB
- [x] Add "Back to Boards" navigation
- [x] **Test**: Verify board detail page loads and displays columns

#### ✅ Step 6.2: Column CRUD Operations

- [x] Implement create column
- [x] Implement rename column
- [x] Implement delete column
- [x] Column services and Zustand store
- [x] Columns sync to store
- [x] **Test**: Verify all column operations work (29 new tests)
- [x] **Architecture Improvement**: Refactored sync to use parallel subscriptions with `ownerId` filtering (see Refactoring section)
- [ ] Implement reorder columns (drag handles or buttons) - Deferred to Phase 9 (Drag & Drop)

### Phase 7: Firebase Integration

**Note**: Moved before Cards to test Firebase sync early and minimize surprises before adding more complexity.

#### ✅ Step 7.1: Firebase Setup (COMPLETED)

- [x] Install Firebase SDK
- [x] Configure Firebase (Firestore, not Realtime DB - RxDB uses Firestore)
- [x] Set up Firebase config
- [x] **Test**: Verify Firebase connection works

#### Step 7.2: Firebase Auth

- Implement sign in/out
- Add auth state listener
- Protect routes (require auth for boards)
- **Test**: Verify authentication flow works

#### ✅ Step 7.3: RxDB Firestore Replication - Setup (COMPLETED)

- [x] Configure RxDB Firestore replication plugin
- [x] Set up replication for boards collection
- [x] Configure conflict resolution (LWW - handled by RxDB)
- [x] **Note**: Must use `firebase@11.10.0` (not v12+) - RxDB's replication plugin expects Firebase v11. Version mismatch causes "different Firestore SDK" error. Also configure Vite deduplication for Firebase modules.
- [x] **Test**: Verify Firestore replication initializes

#### ✅ Step 7.4: RxDB Firestore Replication - Columns Collection (COMPLETED)

- [x] Extend Firestore replication for columns collection
- [x] Test sync with existing boards and columns data
- [x] **Test**: Verify columns sync to Firestore

#### ✅ Step 7.5: Offline Support (RxDB Built-in) (COMPLETED)

- [x] RxDB automatically handles offline queue
- [x] Test offline behavior with boards and columns
- [x] **Test**: Verify offline operations queue and sync when online
- [x] **Verified**: Offline functionality works correctly with LWW (Last-Write-Wins) conflict resolution. RxDB proves to be an excellent choice for local-first architecture with seamless offline support.

### ✅ Phase 8: Cards (COMPLETED)

#### ✅ Step 8.1: Card Display (COMPLETED)

- [x] Display cards within columns
- [x] Show card title, createdAt
- [x] **Test**: Verify cards render in columns

#### ✅ Step 8.2: Card CRUD Operations (COMPLETED)

- [x] Implement create card (inline, no dialog)
- [x] Implement edit card title (inline editing)
- [x] Implement delete card
- [x] **Test**: Verify all card operations work (unit + integration tests)

#### ✅ Step 8.3: Extend Firestore Replication for Cards (COMPLETED)

- [x] Add cards collection to Firestore replication
- [x] Test sync with cards
- [x] **Test**: Verify cards sync to Firestore

### Phase 9: Drag & Drop

#### ✅ Step 9.1: Install & Setup react-dnd-kit (COMPLETED)

- [x] Install react-dnd-kit (@dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities)
- [x] Configure DndContext in ColumnsList
- [x] **Test**: Verify drag context works (build passes, existing tests pass)

#### ✅ Step 9.2: Column Reordering (COMPLETED)

- [x] Implement drag & drop for columns using SortableContext
- [x] Add drag handle (GripVertical icon) to ColumnCard
- [x] Update order in RxDB when columns are reordered
- [x] Sort columns by order in ColumnsList
- [x] **Test**: Verify columns can be reordered (all tests pass)

#### ✅ Step 9.3: Card Drag & Drop (COMPLETED)

- [x] Implement drag & drop within column (reorder)
- [x] Implement drag & drop across columns (drop on column or card)
- [x] Update card order and columnId in RxDB
- [x] Make columns droppable using `useDroppable` hook
- [x] Move `DndContext` to `ColumnsList` to enable cross-column drags
- [x] **Test**: Verify cards can be moved within and between columns (16 integration tests, including 3 cross-column tests)

#### ✅ Step 9.4: Drag & Drop UX Improvements (COMPLETED)

- [x] Add DragOverlay for cards to prevent disappearing when dragging between columns
- [x] Filter out dragged cards from CardsList during drag to prevent visual glitches
- [x] Add optimistic updates for card columnId to prevent bounce-back on drop
- [x] Improve drag experience with visual feedback (card follows cursor in overlay)

#### ✅ Step 9.5: Drag & Drop Polish - Smooth Experience (COMPLETED)

- [x] **Columns**: Added placeholder in original position when dragging (prevents visual jumps)
- [x] **Columns**: Highlight target column with blue ring when hovering over it
- [x] **Columns**: Prevent columns from moving during drag (only move on drop)
- [x] **Cards**: Added placeholder in original position when dragging (prevents visual jumps)
- [x] **Cards**: Highlight target card with blue ring when hovering over it
- [x] **Cards**: Prevent cards from moving during drag (only move on drop)
- [x] **Both**: Fixed transparency issues - cards/columns return to full opacity immediately after drag
- [x] **Both**: Smooth drag experience with visual feedback - dragged item follows cursor in DragOverlay
- [x] **Both**: Improved hover detection - works correctly even when dragging over cards inside columns

### Phase 10: Multi-User & Sharing

#### ✅ Step 10.1: Multi-User Support (COMPLETED)

- [x] Users can access their own boards via `ownerId` filtering
- [x] Boards, columns, and cards are filtered by `ownerId` in Firestore replication
- [x] Each user only sees and can modify their own data
- [x] **Note**: Multi-user support is complete - users can access their own boards. Sharing functionality (adding other users to boards) is not yet implemented.

#### Step 10.2: Board Sharing UI

- [ ] Add share button to board
- [ ] Create share modal (invite by email/UID)
- [ ] Add UI to add/remove users from sharing field
- **Test**: Verify sharing UI works

#### Step 10.3: Board Sharing Logic

- [ ] Implement owner/editor roles
- [ ] Add service functions to update sharing field
- [ ] Enforce permissions (only owner can share)
- **Test**: Verify sharing and permissions work

#### Step 10.4: Firebase Security Rules

- [ ] Configure Firestore security rules to check sharing field
- [ ] Verify security rules work correctly with sharing operations
- **Test**: Verify security rules prevent unauthorized access

### Phase 11: Polish & Bonus Features

#### ✅ Step 11.1: Offline Indicator (COMPLETED)

- [x] Add online/offline status indicator
- [x] Show sync status (RxDB provides sync state)
- [x] Monitor browser online/offline events
- [x] Monitor RxDB replication states (boards, columns, cards)
- [x] Display status in header with color-coded icons
- [x] Show appropriate status based on authentication and Firebase config
- [x] **Refactored**: Merged `isOnline` into unified `SyncStatus` enum (DISABLED, OFFLINE, SYNCING, ERROR, ONLINE)
- [x] **Refactored**: Removed Firebase dependency from StatusIndicator component (decoupled from Firebase/auth concerns)
- [x] **Refactored**: Simplified sync status aggregation logic (direct status updates from replication observables)
- [x] **Test**: Comprehensive test coverage (22 tests: 11 for syncStatus store, 11 for StatusIndicator component)

#### Step 11.2: Animations (motion/react)

- Install motion/react (formerly framer-motion)
- Add subtle animations for card moves
- Add column reorder animations
- **Test**: Verify animations work smoothly

#### Step 11.3: Accessibility

- Add ARIA labels and roles
- Ensure keyboard navigation works
- Add focus states
- **Test**: Verify accessibility with screen reader and keyboard

#### Step 11.4: Undo/Redo (Optional)

- Implement undo/redo stack in Zustand
- Add keyboard shortcuts (Cmd/Ctrl+Z, Cmd/Ctrl+Shift+Z)
- **Test**: Verify undo/redo works for all operations

#### Step 11.5: PWA Setup

- Configure Vite PWA plugin
- Add service worker
- Add app icons and manifest
- **Test**: Verify PWA installs and works offline

#### Step 11.6: Deployment

- Prepare for deployment (Vercel/Netlify)
- Add environment variables setup
- Create deployment config
- **Test**: Verify app works in production environment

## Testing Strategy

- **Unit Tests**: Store logic, RxDB operations, validators
- **Integration Tests**: Zustand-RxDB integration, replication sync
- **E2E Tests** 
- **Manual Testing**: Multi-tab sync, cross-device sync, offline behavior


## Success Criteria for Each Step

- All tests pass (green)
- Code compiles without errors
- Manual verification works (where applicable)
- No regressions in previous steps
- Documentation updated (where applicable)

---

## Refactoring & Code Quality Improvements

### Consolidate Create/Rename Dialogs

**Goal**: Reduce code duplication by creating a single reusable dialog component for creating and renaming entities (boards, columns).

### Replace Dynamic Imports with Static Imports in Tests

**Goal**: Simplify test code by using static imports instead of dynamic `await import()` calls.

### Component Re-render Optimization

**Goal**: Optimize component re-renders to prevent unnecessary updates when unrelated store values change.

### Remove Unnecessary setTimeout in Integration Tests

**Goal**: Remove artificial delays (`setTimeout`) from integration tests that were added as workarounds for sync timing issues.

### Revise useEffects

**Goal**: Review and optimize `useEffect` hooks across components to ensure they follow best practices and avoid unnecessary re-renders or side effects.

