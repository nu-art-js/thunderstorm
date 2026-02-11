/*
 * @nu-art/sync-manager-shared - Placeholder test
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {assert} from 'chai';
import {SmartSync_DeltaSync, ApiDef_SyncManager, DBDef_DeletedDoc} from '../main/index.js';

describe('sync-manager-shared', () => {
	it('exports sync consts and API def', () => {
		assert.equal(SmartSync_DeltaSync, 'delta-sync');
		assert.exists(ApiDef_SyncManager?.v1?.smartSync);
	});
	it('exports deleted-doc DBDef', () => {
		assert.equal(DBDef_DeletedDoc?.dbKey, '__deleted__docs');
	});
});
