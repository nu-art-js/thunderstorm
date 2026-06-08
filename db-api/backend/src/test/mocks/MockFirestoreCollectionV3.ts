/*
 * @nu-art/db-api-backend - In-memory mock for FirestoreCollectionV3 (tests only)
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import type {FirestoreCollection} from '@nu-art/firebase-backend/firestore/FirestoreCollection';
import type {FirestoreQuery} from '@nu-art/firebase-shared';
import {DB_Object, generateHex, currentTimeMillis} from '@nu-art/ts-common';

type DocRefLike = { ref: { id: string }; data?: DB_Object };

function filterByWhere<T extends DB_Object>(items: T[], where: Record<string, unknown> | undefined): T[] {
	if (!where || Object.keys(where).length === 0)
		return [...items];
	return items.filter(item => {
		for (const [key, value] of Object.entries(where)) {
			if (value === undefined || value === null)
				continue;
			const itemVal = (item as Record<string, unknown>)[key];
			if (typeof value === 'object' && value !== null && '$in' in value) {
				const arr = (value as { $in: unknown[] }).$in;
				if (!Array.isArray(arr) || !arr.includes(itemVal))
					return false;
			} else if (itemVal !== value)
				return false;
		}
		return true;
	});
}

function applyLimit<T>(items: T[], limit: { page?: number; itemsCount?: number } | undefined): T[] {
	if (!limit || typeof limit !== 'object' || typeof limit.itemsCount !== 'number')
		return items;
	const page = Math.max(0, limit.page ?? 0);
	const size = Math.max(1, limit.itemsCount);
	const start = page * size;
	return items.slice(start, start + size);
}

/**
 * Creates an in-memory mock that implements the FirestoreCollectionV3 shape used by ModuleBE_BaseDB and ModuleBE_BaseApi.
 * Backed by a Map keyed by _id. When the real V3 interface changes, update this mock to match.
 */
export function createMockFirestoreCollectionV3(
	options?: { manipulateQuery?: (query: FirestoreQuery<DB_Object>) => FirestoreQuery<DB_Object> }
): FirestoreCollection<any> {
	const store = new Map<string, DB_Object>();
	const manipulateQuery = options?.manipulateQuery ?? ((q: FirestoreQuery<DB_Object>) => q);

	const runTransaction = async <T>(fn: () => Promise<T>): Promise<T> => fn();

	const getDocWrapper = (id: string) => ({
		ref: {id},
		get: async () => store.get(id),
		update: async (partial: Partial<DB_Object> & { _id: string }) => {
			const existing = store.get(id);
			if (!existing)
				return undefined;
			const updated = {...existing, ...partial} as DB_Object;
			(updated as Record<string, unknown>).__updated = currentTimeMillis();
			store.set(id, updated);
			return updated;
		}
	});

	const queryItems = (query: FirestoreQuery<DB_Object>): DB_Object[] => {
		const all = Array.from(store.values());
		const filtered = filterByWhere(all, query.where);
		return applyLimit(filtered, query.limit as { page?: number; itemsCount?: number } | undefined);
	};

	// Mirrors the real collection: the "manipulated" read paths (where/custom/unique) run
	// the registered manipulateQuery hook (stand-in for the permissions query interceptor),
	// while unManipulatedQuery/uniqueUnmanipulated bypass it.
	const manipulatedQueryItems = (query: FirestoreQuery<DB_Object>): DB_Object[] =>
		queryItems(manipulateQuery({...query, where: {...(query.where ?? {})}} as FirestoreQuery<DB_Object>));

	const query = {
		where: async (q: FirestoreQuery<DB_Object>) => manipulatedQueryItems(typeof q === 'object' && q && 'where' in q ? q : {where: q as Record<string, unknown>}),
		unique: async (id: string) => manipulatedQueryItems({where: {_id: id} as Record<string, unknown>})[0],
		uniqueUnmanipulated: async (id: string) => store.get(id),
		unManipulatedQuery: async (q: FirestoreQuery<DB_Object>) => queryItems(q),
		custom: async (q: FirestoreQuery<DB_Object>) => manipulatedQueryItems(q)
	};

	const set = {
		item: async (uiItem: DB_Object & { _id?: string }) => {
			let id = uiItem._id;
			if (!id) {
				id = generateHex(12);
				(uiItem as Record<string, unknown>)._id = id;
			}
			const now = currentTimeMillis();
			(uiItem as Record<string, unknown>).__updated = (uiItem as Record<string, unknown>).__updated ?? now;
			(uiItem as Record<string, unknown>).__created = (uiItem as Record<string, unknown>).__created ?? now;
			const saved = {...uiItem, _id: id} as DB_Object;
			store.set(id, saved);
			return saved;
		},
		all: async (uiItems: (DB_Object & { _id?: string })[]) => {
			const result: DB_Object[] = [];
			for (const item of uiItems)
				result.push(await set.item(item));
			return result;
		}
	};

	const deleteOps = {
		unique: async (id: string) => {
			const item = store.get(id);
			if (item)
				store.delete(id);
			return item;
		},
		query: async (q: FirestoreQuery<DB_Object>) => {
			const items = queryItems(q);
			for (const item of items)
				store.delete(item._id);
			return items;
		},
		multi: {
			allDocs: async (docs: DocRefLike[]) => {
				const deleted: DB_Object[] = [];
				for (const doc of docs) {
					const id = doc.ref?.id ?? (doc.data as DB_Object)?._id;
					if (id) {
						const item = store.get(id);
						if (item) {
							store.delete(id);
							deleted.push(item);
						}
					}
				}
				return deleted;
			}
		}
	};

	const doc = {
		unique: (id: string) => getDocWrapper(id),
		item: (uiItem: DB_Object & { _id?: string }) => getDocWrapper(uiItem._id ?? ''),
		unManipulatedQuery: async (q: FirestoreQuery<DB_Object>) => {
			const items = queryItems(q);
			return items.map(item => ({ref: {id: item._id}, data: item}));
		}
	};

	const upgradeInstances = async (_instances: DB_Object[]) => {
	};

	const create = {
		item: async (preDBItem: DB_Object & { _id?: string }) => set.item(preDBItem),
		all: async (preDBItems: (DB_Object & { _id?: string })[]) => set.all(preDBItems)
	};

	return {
		query,
		create,
		set,
		delete: deleteOps,
		doc,
		runTransaction,
		upgradeInstances
	} as unknown as FirestoreCollection<any>;
}
