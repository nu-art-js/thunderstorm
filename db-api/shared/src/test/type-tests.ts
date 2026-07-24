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
