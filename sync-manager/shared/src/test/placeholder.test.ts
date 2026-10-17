/*
 * @nu-art/sync-manager-shared - Placeholder test
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {assert} from 'chai';
import {HttpMethod} from '@nu-art/api-types';
import {ApiDef_SyncManager, isSyncApiDef, SmartSync_DeltaSync, syncApiDef} from '../main/index.js';

describe('sync-manager-shared', () => {
	it('exports sync consts and API def', () => {
		assert.equal(SmartSync_DeltaSync, 'delta-sync');
		assert.exists(ApiDef_SyncManager?.smartSync);
	});

	it('syncApiDef marks the same object and keeps the path', () => {
		const def = syncApiDef({method: HttpMethod.POST, path: '/v1/mcp/clients'});
		assert.isTrue(isSyncApiDef(def));
		assert.equal(def.path, '/v1/mcp/clients');
		assert.equal(def.method, HttpMethod.POST);
		assert.isFalse(isSyncApiDef({method: HttpMethod.GET, path: '/v1/mcp/clients'}));
	});
});
