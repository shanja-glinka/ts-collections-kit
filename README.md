# TS Collections Kit

Type-safe Laravel-like collections + observable entities with snapshots, transactions, audit/soft-delete layers, Visitor/Observer patterns, and the full `collect.js` runtime API. Built for domains that need rich helpers, change tracking, and rollback in one package.

## Problem This Package Solves
- Want Laravel-style collections in TypeScript without `any` or losing chaining.
- Need undo/rollback and transactions across collections and entities.
- Need audit/soft delete as optional layers, not mandatory fields everywhere.
- Need reactive change streams (Observer) and Visitor for bulk mutations.

## Key Features
- Full `collect.js` runtime API with strict TypeScript typings (own definitions, no `any`).
- `BaseCollection<T>`: snapshots (Memento), transactions, event stream (RxJS), Visitor, map/filter that return `BaseCollection`, optional snapshot limits to avoid runaway history.
- `BaseEntity`: proxy-based property tracking, lifecycle + property observables, class-transformer + class-validator integration, snapshot/restore on entities.
- Entity layers: `BaseEntity` (id only), `AuditedEntity` (created*/updated*), `SoftDeletableEntity` (deleted*/deletedBy), `AuditedSoftDeletableEntity` (both) without code duplication.
- Observer integration: collection forwards entity events, emits add/remove/commit/rollback.
- Cleanup: `BaseCollection.dispose()` unsubscribes everything and completes streams.
- Zero `any`/type assertions.

## When to Use
- Need Laravel-like collection helpers in TS with type safety.
- Need change tracking and reactive streams (UI, logging, sync).
- Need undo/rollback (single-step or transactional) with configurable history depth.
- Bulk operations via Visitor.
- Domain requires audit/soft-delete layers as opt-ins.

## When Not to Use
- You want zero dependencies beyond the TS/JS stdlib (this uses RxJS + collect.js).
- You do not need rollback/history or observability.

## Installation
```bash
npm install @shanja-glinka/ts-collections-kit
```

## Quick Start
```ts
import 'reflect-metadata';
import {
  BaseCollection,
  BaseEntity,
  EntityEvent,
} from '@shanja-glinka/ts-collections-kit';

class Todo extends BaseEntity {
  title!: string;
  done = false;
}

const todos = new BaseCollection<Todo>([], {
  enableSnapshots: true,
  enableTransactions: true,
  snapshotLimit: 5,
});

const subscription = todos.subscribe((event) => {
  if (event.type === 'add') {
    console.log('Added', event.payload);
    return;
  }
  if (event.type === EntityEvent.Updated) {
    const { item, change } = event.payload;
    console.log(`Updated ${item.id}:`, change);
  }
});

const todo = new Todo();
todo.id = 'todo-1';
todo.title = 'Ship release';

todos.add(todo); // emits 'add'
todo.done = true; // emits EntityEvent.Updated via collection

const token = todos.beginTransaction();
todo.title = 'Ship release v2';
todos.rollbackTransaction(); // restores previous title and state
console.log('Rolled back to token', token);

subscription.unsubscribe();
```

## Entities
- `BaseEntity.plainToInstance()` turns plain objects into validated entities (class-transformer + class-validator).
- Lifecycle hooks: `creating/created/updating/updated/deleting/deleted/restoring/restored`.
- Observables: `getEntityObservable()` (lifecycle) and `getPropertyObservable()` (property-level changes).
- Snapshots: `captureSnapshot()` / `restoreSnapshot()` apply state without emitting events.
- Layers:
  - `BaseEntity` — id + observability/snapshots.
  - `AuditedEntity` — adds createdAt/createdBy/updatedAt/updatedBy.
  - `SoftDeletableEntity` — adds deletedAt/deletedBy.
  - `AuditedSoftDeletableEntity` — combines audit + soft delete.
- Swappable transformation: override `BaseEntity.setTransformStrategy(...)` to plug your own transformer/validator (or disable class-transformer/class-validator).

## Collections
- Full `collect.js` runtime API (map/filter/reduce/where/... 120+ methods).
- Snapshots: `rollback()` restores last snapshot; `commit()` clears history; `snapshotLimit` trims history to avoid leaks.
- Transactions: `beginTransaction()/commitTransaction()/rollbackTransaction()`; state and entity snapshots restored on rollback.
- Events: `add`, `remove`, `commit`, `rollback`, plus forwarded entity events.
- Visitor: `accept(visitor)` applies your `visit()` to each item.
- Typed map/filter: still return `BaseCollection`, preserving chainability + added features.
- Cleanup: `dispose()` completes streams and removes subscriptions.

## Usage Patterns
- **Snapshots only**: set `enableSnapshots: true` to capture before mutations.
- **Transactions**: `enableSnapshots: true` + `enableTransactions: true` to group mutations; rollback restores items and entity state.
- **Snapshot limits**: set `snapshotLimit` to cap history (e.g., 10 undo steps).
- **Observers**: subscribe via `collection.subscribe()` or entity `subscribeEntityEvents/subscribePropertyEvents`.
- **Visitor**: implement `IVisitor<T>` with `visit(item: T): void` and call `collection.accept(visitor)`.

## Best Practices
- Set `snapshotLimit` to avoid unbounded memory usage for long-lived collections (e.g., 10–50 steps in apps, unlimited only in short-lived tests).
- Call `dispose()` on collections that outlive a view/component/scope to tear down subscriptions and avoid leaks.
- Use observables for UI/logging: subscribe to `collection.subscribe` for add/remove/commit/rollback, and to entity `getPropertyObservable` for fine-grained change logs; always unsubscribe when done.

## Testing
- Unit tests (Jest): `npm test`
- Lint: `npm run lint:check`

## Performance Benchmarks
Run synthetic benchmarks (guarded to avoid OOM):
```bash
PERF_ITEMS=50000 PERF_SNAPSHOT_ITEMS=2000 npm run perf
```
- `PERF_ITEMS` — dataset size for numeric benchmarks (default 50,000).
- `PERF_SNAPSHOT_ITEMS` — cap for snapshot-heavy tests (default 2,000, max 10,000) to avoid heap exhaustion.

## Build & Publish
- Build artifacts (CJS + ESM + types): `npm run build` (cleans `dist`).
- Prepublish hook already runs `build` (`prepublishOnly`).
- Export map:
  - CJS: `dist/cjs/main.cjs`
  - ESM: `dist/esm/main.js`
  - Types: `dist/esm/main.d.ts`
- Files published: only `dist` (see `package.json:files`).

## Supported Stack
- Node 18+ recommended
- TypeScript 5.x
- Dependencies: `collect.js`, `rxjs`, `lodash`, `class-transformer`, `class-validator`, `reflect-metadata`

## API Surface (top-level)
- Classes: `BaseCollection`, `BaseEntity`, `AuditedEntity`, `SoftDeletableEntity`, `AuditedSoftDeletableEntity`
- Types/interfaces: `ICollection`, `IObservable`, `IVisitor`, `IBaseEntity`, `IAuditedEntity`, `ISoftDeletableEntity`, `ICollectionOptions`, `CollectionEvent`, `EntityEvent`, etc.
- Utils: `deepClone`
