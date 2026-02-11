/*
 * @nu-art/sync-env-shared - tests
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {assert} from 'chai';
import type {SyncEnvBackupMetadata, Request_FetchFromEnv} from '../main/apis.js';

describe('sync-env-shared', () => {
	it('SyncEnvBackupMetadata has collectionsData and timestamp', () => {
		const m: SyncEnvBackupMetadata = {
			collectionsData: [{dbKey: 'k', numOfDocs: 1, version: '1.0'}],
			timestamp: 123
		};
		assert.equal(m.timestamp, 123);
		assert.lengthOf(m.collectionsData, 1);
		assert.equal(m.collectionsData[0].dbKey, 'k');
	});
	it('Request_FetchFromEnv has required fields', () => {
		const r: Request_FetchFromEnv = {
			backupId: 'id',
			env: 'dev',
			chunkSize: 100,
			selectedModules: ['mod1']
		};
		assert.equal(r.backupId, 'id');
		assert.equal(r.env, 'dev');
		assert.equal(r.chunkSize, 100);
	});
});
