/*
 * @nu-art/sync-manager-backend - Placeholder test
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {assert} from 'chai';
import {ModuleBE_SyncManager_Class} from '../main/index.js';
import type {DB_DeletedDoc, SyncableCollectionBE} from '@nu-art/sync-manager-shared';
import type {DB_Object} from '@nu-art/ts-common';

const mockCollection: SyncableCollectionBE = {
	dbKey: 'test-collection',
	queryUpdatedSince: async () => [],
	getNewestTimestamp: async () => 0
};

describe('sync-manager-backend', () => {
	let instance: ModuleBE_SyncManager_Class;

	before(() => {
		instance = new ModuleBE_SyncManager_Class();
	});

	it('class can be instantiated', () => {
		assert.exists(instance);
		assert.typeOf(instance.queryDeleted, 'function');
		assert.typeOf(instance.onPostWrite, 'function');
	});

	it('querySyncResponse returns toUpdate from collection and toDelete from store', async () => {
		const liveItem: DB_Object = {_id: 'live-1', __updated: 100, __created: 90, _v: '1'};
		const deletedItem: DB_DeletedDoc = {
			_id: 'del-1' as DB_DeletedDoc['_id'],
			__updated: 99,
			__created: 80,
			_v: '1',
			__collectionName: 'test-collection',
			__docId: 'del-1',
		};
		const collectionWithLive: SyncableCollectionBE = {
			...mockCollection,
			queryUpdatedSince: async () => [liveItem]
		};
		instance.queryDeleted = async () => [deletedItem];
		const result = await instance.querySyncResponse(collectionWithLive, 50);
		assert.deepEqual(result.toUpdate, [liveItem]);
		assert.deepEqual(result.toDelete, [deletedItem]);
	});
});
