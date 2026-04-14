/*
 * @nu-art/sync-manager-shared - Placeholder test
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {assert} from 'chai';
import {SmartSync_DeltaSync, ApiDef_SyncManager} from '../main/index.js';

describe('sync-manager-shared', () => {
	it('exports sync consts and API def', () => {
		assert.equal(SmartSync_DeltaSync, 'delta-sync');
		assert.exists(ApiDef_SyncManager?.smartSync);
	});
});
