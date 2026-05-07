import {Dispatcher, UniqueId} from '@nu-art/ts-common';
import {CanDeleteDBEntitiesProto} from './types.js';
import {MemKey} from '@nu-art/ts-common/mem-storage/MemStorage';
import {PotentialDependenciesToDelete} from '@nu-art/firebase-shared';
import {Transaction} from 'firebase-admin/firestore';

export const canDeleteDispatcher = new Dispatcher<CanDeleteDBEntitiesProto, '__canDeleteEntitiesProto'>('__canDeleteEntitiesProto');

export type TransactionWrapper = {
	transaction: Transaction;
	active: boolean;
	writeCount?: number;
	beginTransaction?: () => void;
};

export const MemKey_FirestoreTransaction = new MemKey<TransactionWrapper>('firestore--transaction');

export function getActiveTransaction(): Transaction | undefined {
	const wrapper = MemKey_FirestoreTransaction.peak();
	if (!wrapper?.active)
		return undefined;

	return wrapper.transaction;
}

export function markTransactionWrite(): void {
	const wrapper = MemKey_FirestoreTransaction.peak();
	if (!wrapper?.active)
		return;

	if (wrapper.writeCount === 0)
		wrapper.beginTransaction?.();

	wrapper.writeCount = (wrapper.writeCount ?? 0) + 1;
}

export type MemKey_DeletedDocs_Type = {
	transaction: Transaction;
	deleted: { [dbKey: string]: Set<UniqueId> };
}

export const MemKey_DeletedDocs = new MemKey<MemKey_DeletedDocs_Type[]>('deleted--docs');

export function addDeletedToTransaction(deleted: PotentialDependenciesToDelete) {
	const transaction = getActiveTransaction();
	if (!transaction)
		return;

	const storage = MemKey_DeletedDocs.get([]);
	let item = storage.find(i => i.transaction === transaction);
	if (!item) {
		item = {transaction, deleted: {}};
		storage.push(item);
	}
	if (!item.deleted[deleted.dbKey])
		item.deleted[deleted.dbKey] = new Set<UniqueId>();
	deleted.ids.forEach(id => item!.deleted[deleted.dbKey].add(id));
	MemKey_DeletedDocs.set(storage);
}