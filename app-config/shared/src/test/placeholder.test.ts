/*
 * @nu-art/app-config-shared - tests
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {assert} from 'chai';
import {DBDef_AppConfig} from '../main/db-def.js';
import type {RequestBody_GetResolverByKey} from '../main/api-def.js';

describe('app-config-shared', () => {
	it('DBDef_AppConfig.dbKey is app-configs', () => {
		assert.equal(DBDef_AppConfig.dbKey, 'app-configs');
	});
	it('DBDef_AppConfig.entityName is AppConfig', () => {
		assert.equal(DBDef_AppConfig.entityName, 'AppConfig');
	});
	it('RequestBody_GetResolverByKey has key', () => {
		const r: RequestBody_GetResolverByKey = {key: 'test-key'};
		assert.equal(r.key, 'test-key');
	});
});
