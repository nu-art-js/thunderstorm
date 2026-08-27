import {DB_UniqueId, DBPointer} from '../main/db-object.js';

// DBPointer distributes over key unions — dbKey narrowing correlates with id brand.
type DocsOrTasksPointer = DBPointer<'docs' | 'tasks'>;

declare const pointer: DocsOrTasksPointer;
if (pointer.dbKey === 'docs') {
	const docsId: DB_UniqueId<'docs'> = pointer.id;
	void docsId;
} else {
	const tasksId: DB_UniqueId<'tasks'> = pointer.id;
	void tasksId;
}

// Single-key pointer stays a concrete branded pair.
const docsPointer: DBPointer<'docs'> = {
	dbKey: 'docs',
	id: 'doc-1' as DB_UniqueId<'docs'>,
};
void docsPointer;

// Bare string is rejected; type parameters still work.
type RejectBareString = DBPointer<string>;
const _assertNever: RejectBareString = null as never;
void _assertNever;

declare function identityPointer<Key extends string>(dbKey: Key, id: DB_UniqueId<Key>): DBPointerOf<Key>;
const genericOk = identityPointer('docs', 'x' as DB_UniqueId<'docs'>);
void genericOk;
