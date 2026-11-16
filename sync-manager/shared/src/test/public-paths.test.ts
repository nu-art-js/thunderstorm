/*
 * @nu-art/sync-manager-shared - Public RTDB paths
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect} from 'chai';
import {
	Default_SyncManagerNodePath,
	privateModuleStatePath,
	publicModuleStatePath,
	publicSyncDataPath,
} from '../main/public-paths.js';

describe('public sync paths', () => {
	it('puts collection stamps under /public and keeps the deleted counter private', () => {
		// Example: ModuleBE_SyncManager writes stamps at /public/state/ModuleBE_SyncManager/syncData
		expect(publicSyncDataPath('ModuleBE_SyncManager')).to.equal('/public/state/ModuleBE_SyncManager/syncData');
		expect(publicModuleStatePath('ModuleBE_SyncManager')).to.equal('/public/state/ModuleBE_SyncManager');
		expect(Default_SyncManagerNodePath).to.equal('/public/state/ModuleBE_SyncManager/syncData');
		expect(privateModuleStatePath('ModuleBE_SyncManager')).to.equal('/state/ModuleBE_SyncManager');
	});
});
