/*
 * @nu-art/sync-manager-backend - Placeholder test
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {assert} from 'chai';
import {ModuleBE_SyncManager_Class} from '../main/index.js';

describe('sync-manager-backend', () => {
	it('class can be instantiated with getDbModules', () => {
		const getDbModules = () => [];
		const instance = new ModuleBE_SyncManager_Class(getDbModules);
		assert.exists(instance);
		assert.typeOf(instance.queryDeleted, 'function');
		assert.typeOf(instance.setLastUpdated, 'function');
	});
});
