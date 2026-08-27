import {Dispatcher, UniqueId} from '@nu-art/ts-common';
import {CanDeleteDBEntitiesProto} from './types.js';
import {MemKey, MemStorage} from '@nu-art/ts-common/mem-storage/MemStorage';
import {PotentialDependenciesToDelete} from '@nu-art/firebase-shared';
import {Transaction} from 'firebase-admin/firestore';

export const canDeleteDispatcher = new Dispatcher<CanDeleteDBEntitiesProto, '__canDeleteEntitiesProto'>('__canDeleteEntitiesProto');

export type TransactionPreCloseCallback = () => void | Promise<void>;

export type TransactionWrapper = {
	transaction: Transaction;
	active: boolean;
	writeCount?: number;
	beginTransaction?: () => void;
	/** Coalesced callbacks drained once before outer TX commit (same session). */
	preClose?: Map<string, TransactionPreCloseCallback>;
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

/**
 * Defer work to outer TX pre-close (coalesce by key), or run inline when no TX is open.
 * Flush writes must run while the session is still active — before commit.
 */
export async function registerTransactionPreClose(key: string, fn: TransactionPreCloseCallback): Promise<void> {
	if (!MemStorage.getStore()) {
		await fn();
		return;
	}

	const wrapper = MemKey_FirestoreTransaction.peak();
	if (!wrapper?.active) {
		await fn();
		return;
	}

	if (!wrapper.preClose)
		wrapper.preClose = new Map();

	wrapper.preClose.set(key, fn);
}

export async function drainTransactionPreClose(wrapper: TransactionWrapper): Promise<void> {
	const callbacks = wrapper.preClose ? [...wrapper.preClose.values()] : [];
	wrapper.preClose = undefined;
	for (const fn of callbacks)
		await fn();
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