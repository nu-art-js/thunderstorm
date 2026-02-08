/*
 * @nu-art/app-config-shared - tests
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {assert} from 'chai';
import {DBKey_AppConfig, EntityName_AppConfig} from '../main/types.js';
import type {RequestBody_GetResolverByKey} from '../main/api-def.js';

describe('app-config-shared', () => {
	it('DBKey_AppConfig is app-configs', () => {
		assert.equal(DBKey_AppConfig, 'app-configs');
	});
	it('EntityName_AppConfig is AppConfig', () => {
		assert.equal(EntityName_AppConfig, 'AppConfig');
	});
	it('RequestBody_GetResolverByKey has key', () => {
		const r: RequestBody_GetResolverByKey = {key: 'test-key'};
		assert.equal(r.key, 'test-key');
	});
});
