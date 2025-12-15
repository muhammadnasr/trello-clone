# Trello Clone - Step-by-Step Implementation Plan (RxDB Version)

## 📊 Progress Summary

**Completed Phases: 6.5/11**
- ✅ Phase 1: Foundation
- ✅ Phase 2: RxDB Setup & Data Models (Boards & Columns schemas)
- ✅ Phase 3: Zustand Store Integration
- ✅ Phase 4: BroadcastChannel Tab Sync
- ✅ Phase 5: Basic UI - Boards List
- ✅ Phase 6: Board Detail & Columns

**Remaining Phases: 4.5/11**
- ✅ Phase 7: Firebase Integration (Firestore Replication ✅ Complete, Auth ⏳ Pending)
- ⏳ Phase 8: Cards (Display + CRUD + Firestore Sync)
- ⏳ Phase 9: Drag & Drop (Column & Card Reordering)
- ⏳ Phase 10: Multi-User & Sharing (Sharing UI + Logic + Security Rules)
- ⏳ Phase 11: Polish & Bonus Features (Offline Indicator + Animations + Accessibility + PWA + Deployment)

**Core Features Status:**
- ✅ Boards CRUD (Create, Read, Update, Delete)
- ✅ Columns CRUD (Create, Read, Update, Delete)
- ⏳ Cards (Not started)
- ✅ Firebase Sync (Firestore Replication ✅ Complete)
- ⏳ Drag & Drop (Not started)
- ⏳ Multi-User & Sharing (Not started)

**Estimated Progress: ~45%**
- Foundation & Infrastructure: ✅ Complete
- Core Features (Boards/Columns): ✅ Complete
- Firebase Sync: ✅ Complete (Firestore Replication)
- Remaining Features: ⏳ Not started (Cards, Auth, Drag & Drop, Multi-User, Polish)

**Next Phase: Phase 7 - Firebase Auth (remaining) / Phase 8 - Cards**

**Test Coverage**: 85 tests passing (unit + integration)

---

## Architecture Overview

The application uses RxDB as the core local-first database layer:

- **UI Layer**: React components with Shadcn-UI and TailwindCSS v4
- **State Layer**: Zustand stores (synced with RxDB reactive queries)
- **Database Layer**: RxDB with IndexedDB storage
- **Sync Layer**: 
  - Same-device tabs: RxDB BroadcastChannel replication
  - Cross-device: RxDB Firestore replication plugin
- **Routing**: TanStack Router

---

## 📋 Evaluation Criteria

Please keep in mind that **a shift in mindset is also part of what we are evaluating**.

Using RxDB is acceptable, as long as the solution clearly demonstrates:
- ✅ **Working with new concepts and approaches**: The implementation should show understanding and effective use of RxDB's reactive programming model, local-first architecture, and multi-tab synchronization
- ✅ **Well-structured data flow**: Clear separation between database layer (RxDB), state management (Zustand), and UI components
- ✅ **Maintainable architecture**: Code organization, type safety, and patterns that make the codebase easy to understand and extend

**Key Evaluation Points:**
- How well the reactive data flow is implemented (RxDB → Zustand → UI)
- Understanding of local-first principles and offline-first capabilities
- Proper use of RxDB features (reactive queries, multi-instance sync, schema validation)
- Code quality, structure, and maintainability
- Test coverage and quality

---

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

#### Step 7.5: Offline Support (RxDB Built-in)

- RxDB automatically handles offline queue
- Test offline behavior with boards and columns
- **Test**: Verify offline operations queue and sync when online

### Phase 8: Cards

#### Step 8.1: Card Display

- Display cards within columns
- Show card title, createdAt
- **Test**: Verify cards render in columns

#### Step 8.2: Card CRUD Operations

- Implement create card
- Implement edit card title
- Implement delete card
- **Test**: Verify all card operations work

#### Step 8.3: Extend Firestore Replication for Cards

- Add cards collection to Firestore replication
- Test sync with cards
- **Test**: Verify cards sync to Firestore

### Phase 9: Drag & Drop

#### Step 9.1: Install & Setup react-dnd-kit

- Install react-dnd-kit
- Configure DndContext
- **Test**: Verify drag context works

#### Step 9.2: Column Reordering

- Implement drag & drop for columns
- Update order in RxDB
- **Test**: Verify columns can be reordered

#### Step 9.3: Card Drag & Drop

- Implement drag & drop within column (reorder)
- Implement drag & drop across columns
- Update card order and columnId in RxDB
- **Test**: Verify cards can be moved within and between columns

### Phase 10: Multi-User & Sharing

#### Step 10.1: Board Sharing UI

- Add share button to board
- Create share modal (invite by email/UID)
- **Test**: Verify sharing UI works

#### Step 10.2: Board Sharing Logic

- Implement owner/editor roles
- Store sharedWith in board data (RxDB schema)
- Enforce permissions (only owner can delete/share)
- **Test**: Verify sharing and permissions work

#### Step 10.3: Firebase Security Rules

- Configure Firestore security rules
- Ensure users can only access shared boards
- **Test**: Verify security rules prevent unauthorized access

### Phase 11: Polish & Bonus Features

#### Step 11.1: Offline Indicator

- Add online/offline status indicator
- Show sync status (RxDB provides sync state)
- **Test**: Verify status indicator updates correctly

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
- **E2E Tests** (optional): Critical user flows (create board, move card)
- **Manual Testing**: Multi-tab sync, cross-device sync, offline behavior

## File Structure (Proposed)

```
trello-clone/
├── src/
│   ├── components/          # React components
│   │   ├── ui/             # Shadcn-UI components
│   │   ├── boards/         # Board-related components
│   │   ├── columns/        # Column components
│   │   └── cards/          # Card components
│   ├── lib/
│   │   ├── db/             # RxDB database setup and schemas
│   │   ├── firebase/       # Firebase config
│   │   └── utils/          # Utility functions
│   ├── stores/             # Zustand stores
│   │   ├── boards.ts
│   │   ├── columns.ts
│   │   ├── cards.ts
│   │   └── ui.ts
│   ├── types/              # TypeScript types
│   ├── routes/             # TanStack Router routes
│   └── main.tsx
├── tests/
│   ├── unit/               # Unit tests
│   ├── integration/        # Integration tests
│   └── setup.ts            # Test setup
├── public/
└── README.md
```

## Key Technical Decisions

1. **RxDB** - Local-first database with built-in IndexedDB storage, BroadcastChannel sync, and Firestore replication
2. **Firebase Firestore** (not Realtime Database) - RxDB has built-in Firestore replication plugin with LWW conflict resolution
3. **Last-Write-Wins (LWW)** - RxDB handles conflict resolution automatically using timestamps
4. **Optimistic Updates** - UI updates immediately via RxDB reactive queries, sync happens in background
5. **RxDB Collections** - Each entity type (boards, columns, cards) will be an RxDB collection with reactive queries
6. **Zustand + RxDB** - Zustand for UI state management, RxDB for persistence and sync (connected via reactive queries)

## Documentation Requirements

- **Architecture Documentation**: Detailed README explaining:
  - Why RxDB was chosen (local-first, built-in sync, conflict resolution)
  - How RxDB handles IndexedDB persistence
  - How BroadcastChannel replication works for multi-tab sync
  - How Firestore replication works for cross-device sync
  - LWW conflict resolution strategy and how RxDB implements it
  - Offline queue mechanism in RxDB
  - Trade-offs and design decisions

- **Code Comments**: Add comments in key files explaining:
  - RxDB schema design decisions
  - How reactive queries keep Zustand in sync
  - Replication configuration and what it does
  - Conflict resolution behavior

## Success Criteria for Each Step

- All tests pass (green)
- Code compiles without errors
- Manual verification works (where applicable)
- No regressions in previous steps
- Documentation updated (where applicable)

---

## Refactoring & Code Quality Improvements

### Consolidate Create/Rename Dialogs

**Goal**: Reduce code duplication by creating a single reusable dialog component for creating and renaming entities (boards, columns, cards).

**Current State**:
- Separate dialogs for create/rename operations:
  - `CreateBoardDialog` - creates boards
  - `RenameColumnDialog` - renames columns
  - `CreateColumnDialog` - creates columns
  - Inline rename dialog in `BoardCard` component

**Proposed Solution**:
- Create a generic `EntityDialog` component that can handle both create and rename modes
- Accept props: `mode` ('create' | 'rename'), `entityType` ('board' | 'column' | 'card'), `initialValue` (for rename), `onSubmit`, `onCancel`
- Replace all existing create/rename dialogs with this unified component
- Benefits:
  - Single source of truth for dialog UI/UX
  - Easier to maintain and update
  - Consistent behavior across all entities
  - Less code duplication

**Implementation Notes**:
- Keep existing functionality intact
- Ensure all tests still pass after refactoring
- Update component imports across the codebase

