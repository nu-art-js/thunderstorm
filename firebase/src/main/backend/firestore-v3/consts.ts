import {Dispatcher, UniqueId} from '@nu-art/ts-common';
import {CanDeleteDBEntitiesProto} from './types';
import {MemKey} from '@nu-art/ts-common/mem-storage/MemStorage';
import {DB_EntityDependency} from '../../shared/types';

export const canDeleteDispatcherV3 = new Dispatcher<CanDeleteDBEntitiesProto, '__canDeleteEntitiesProto'>('__canDeleteEntitiesProto');

export type MemKey_DeletedDocs_Type = {
	transaction: FirebaseFirestore.Transaction;
	deleted: { [collectionKey: string]: Set<UniqueId> };
}

export const MemKey_DeletedDocs = new MemKey<MemKey_DeletedDocs_Type[]>('deleted--docs');

export function addDeletedToTransaction(transaction: FirebaseFirestore.Transaction | undefined, deleted: DB_EntityDependency) {
	if (!transaction)
		return;

	const storage = MemKey_DeletedDocs.get([]);
	let item = storage.find(i => i.transaction === transaction);
	if (!item) {
		item = {transaction, deleted: {}};
		storage.push(item);
	}
	if (!item.deleted[deleted.collectionKey])
		item.deleted[deleted.collectionKey] = new Set<UniqueId>();
	deleted.conflictingIds.forEach(id => item!.deleted[deleted.collectionKey].add(id));
	MemKey_DeletedDocs.set(storage);
}