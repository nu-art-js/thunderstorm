/*
 * @nu-art/sync-manager-backend - Placeholder test
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {assert} from 'chai';
import {ModuleBE_SyncManager_Class} from '../main/index.js';
import type {ModuleBE_BaseDB} from '@nu-art/db-api-backend';
import type {FirestoreQuery} from '@nu-art/firebase-shared';
import type {DB_Object} from '@nu-art/ts-common';

describe('sync-manager-backend', () => {
	it('class can be instantiated with getDbModules', () => {
		const getDbModules = () => [];
		const instance = new ModuleBE_SyncManager_Class(getDbModules);
		assert.exists(instance);
		assert.typeOf(instance.queryDeleted, 'function');
		assert.typeOf(instance.onPostWrite, 'function');
	});

	it('querySyncResponse returns toUpdate from module and toDelete from store', async () => {
		const liveItem: DB_Object = {_id: 'live-1', __updated: 100, __created: 90, _v: '1'};
		const deletedItem: DB_Object = {_id: 'del-1', __updated: 99, __created: 80, _v: '1'};
		const mockModule = {
			dbDef: {dbKey: 'test-collection'},
			query: {
				custom: async (_query: FirestoreQuery<DB_Object>) => [liveItem]
			}
		} as unknown as ModuleBE_BaseDB<any>;
		const getDbModules = () => [mockModule];
		const instance = new ModuleBE_SyncManager_Class(getDbModules);
		instance.queryDeleted = async () => [deletedItem];
		const query: FirestoreQuery<DB_Object> = {where: {__updated: {$gte: 50}}};
		const result = await instance.querySyncResponse(mockModule, query);
		assert.deepEqual(result.toUpdate, [liveItem]);
		assert.deepEqual(result.toDelete, [deletedItem]);
	});
});
