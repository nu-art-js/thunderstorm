/*
 * @nu-art/sync-manager-backend - Placeholder test
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {assert} from 'chai';
import {ModuleBE_SyncManager} from '../main/index.js';

describe('sync-manager-backend', () => {
	it('singleton exists and exposes queryDeleted', () => {
		assert.exists(ModuleBE_SyncManager);
		assert.typeOf(ModuleBE_SyncManager.queryDeleted, 'function');
	});
});
