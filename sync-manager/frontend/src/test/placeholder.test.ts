/*
 * @nu-art/sync-manager-frontend - Placeholder test
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {assert} from 'chai';
import {ModuleFE_SyncManager_Class} from '../main/index.js';

describe('sync-manager-frontend', () => {
	it('class can be instantiated with config', () => {
		const instance = new ModuleFE_SyncManager_Class({
			getLocalSyncData: () => [],
			onSmartSyncCompleted: () => {
			},
		});
		assert.exists(instance);
		assert.typeOf(instance.smartSync, 'function');
	});
});
