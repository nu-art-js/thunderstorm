/*
 * @nu-art/permissions-backend - Firebase test helpers
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {ModuleBE_APIs, ModuleBE_SyncManager} from '@nu-art/thunderstorm-backend';
import {MemKey_AccountId, ModuleBE_AccountDB, ModuleBE_SessionDB} from '@nu-art/user-account-backend';
import type {StormTestInput} from '@nu-art/thunderstorm-backend/test/StormTest';
import {ModulePackBE_Permissions} from '../../main/core/module-pack.js';
import {permissionTestCleanup, Test_DefaultAccountId} from '../_core/consts.js';

export const DefaultStormTestConfig_Permissions: StormTestInput = {
	modules: [
		ModuleBE_APIs,
		ModuleBE_SyncManager,
		ModuleBE_AccountDB,
		ModuleBE_SessionDB,
		...ModulePackBE_Permissions
	],
	config: {
		ModuleBE_PermissionsAssert: { strictMode: true },
		ModuleBE_AccountDB: { canRegister: true }
	},
	before: async () => {
		MemKey_AccountId.set(Test_DefaultAccountId);
		await permissionTestCleanup();
	},
	after: async () => {
		await permissionTestCleanup();
	}
};
