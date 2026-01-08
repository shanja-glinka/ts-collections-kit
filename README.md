# TS Collections Kit

Type-safe Laravel-like collections + observable entities with snapshots, transactions, Visitor/Observer patterns, and full `collect.js` runtime API (no method gaps). Ideal when you need rich collection helpers, change tracking, and rollback in one package.

## Key Features
- Full `collect.js` API at runtime with strict TypeScript types (own typings, no `any`).
- `BaseCollection<T>`: snapshots (Memento), transactions, event stream (RxJS), Visitor, map/filter returning `BaseCollection`.
- `BaseEntity`: proxy-based property tracking, lifecycle + property observables, class-transformer + class-validator integration, snapshot/restore on entities.
- Observer integration: collection forwards entity events, emits add/remove/commit/rollback.
- Type-safe contracts and zero `any`/type assertions.

## When to Use
- Need Laravel-like collection helpers in TS without losing type safety.
- Want to track entity/property changes and react to them (UI, logging, sync).
- Need undo/rollback (single-step or transactional) on collections and their items.
- Apply bulk operations via Visitor across collections.

## Installation
```bash
npm install @shanja-glinka/ts-collections-kit
```

## Quick Start
```ts
import { BaseCollection, BaseEntity, EntityEvent } from '@shanja-glinka/ts-collections-kit';

class Todo extends BaseEntity {
  public title!: string;
  public done = false;
}

const todos = new BaseCollection<Todo>([]);

const sub = todos.subscribe((event) => {
  if (event.type === EntityEvent.Updated) {
    console.log('Entity updated', event.payload);
  }
});

const todo = new Todo();
todo.title = 'Ship release';

todos.add(todo);          // emits 'add'
todo.done = true;         // emits EntityEvent.Updated via collection

todos.beginTransaction(); // transactional group
todo.title = 'Ship release v2';
todos.rollbackTransaction(); // restores previous entity state

sub.unsubscribe();
```

## Entities
- `BaseEntity.plainToInstance()` turns plain objects into validated entities (class-transformer + class-validator).
- Lifecycle hooks: `creating/created/updating/updated/deleting/deleted/restoring/restored`.
- Observables: `getEntityObservable()` (lifecycle) and `getPropertyObservable()` (property-level changes).
- Snapshots on entities: `captureSnapshot()` / `restoreSnapshot()` restore state without emitting events.

## Collections
- Full `collect.js` runtime API (map/filter/reduce/where/... 120+ methods).
- Snapshots: `rollback()` restores last snapshot; `commit()` clears history.
- Transactions: `beginTransaction()/commitTransaction()/rollbackTransaction()`; state and entity snapshots restored on rollback.
- Events: `add`, `remove`, `commit`, `rollback`, plus forwarded entity events.
- Visitor: `accept(visitor)` applies your `visit()` to each item.
- Typed map/filter: still return `BaseCollection`, preserving chainability + added features.

## Usage Patterns
- **Snapshots only**: enableSnapshots: true (create snapshot before mutations).
- **Transactions**: enableSnapshots + enableTransactions to group mutations; rollback restores items and entity state.
- **Observers**: subscribe via `collection.subscribe()` or entity `subscribeEntityEvents/subscribePropertyEvents`.
- **Visitor**: implement `IVisitor<T>` with `visit(item: T): void` and call `collection.accept(visitor)`.

## Testing
- Unit tests (Jest, verbose): `npm test`
- Lint: `npm run lint:check`

## Performance Benchmarks
Run synthetic benchmarks (limits to avoid OOM; see env caps):
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
- Classes: `BaseCollection`, `BaseEntity`
- Types/interfaces: `ICollection`, `IObservable`, `IVisitor`, `IBaseEntity`, `ICollectionOptions`, `CollectionEvent`, `EntityEvent`, etc.
- Utils: `deepClone`

#### Нагрузочное тестирование

Нагрузочные проверки вынесены в отдельный раннер, чтобы они не делали unit-тесты медленными и нестабильными.

```bash
PERF_ITEMS=100000 npm run perf
```

- `PERF_ITEMS` — общее количество элементов для числовых тестов (по умолчанию 100 000).
- Снапшоты намеренно ограничены `PERF_SNAPSHOT_ITEMS` (по умолчанию 2 000, максимум 10 000), чтобы избежать OOM: при включённых снапшотах каждый `add` делает глубокую копию массива.
