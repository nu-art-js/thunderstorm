/*
 * @nu-art/permissions-backend - Firebase test helpers
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import type {Module} from '@nu-art/ts-common';
import {MemStorage} from '@nu-art/ts-common/mem-storage';
import {MemKey_AccountId, ModuleBE_AccountDB, ModuleBE_SessionDB} from '@nu-art/user-account-backend';
import {ModulePackBE_Permissions} from '../../main/core/module-pack.js';
import {permissionTestCleanup, Test_DefaultAccountId} from '../_core/consts.js';

/** Test config for permissions backend. Wire into your test runner (e.g. storm tester) with additional modules if needed. */
export type PermissionsTestConfig = {
	modules: Module[];
	config: Record<string, unknown>;
	before?: () => Promise<void>;
	after?: () => Promise<void>;
};

export const DefaultStormTestConfig_Permissions: PermissionsTestConfig = {
	modules: [
		ModuleBE_AccountDB,
		ModuleBE_SessionDB,
		...ModulePackBE_Permissions
	],
	config: {
		ModuleBE_PermissionsAssert: { strictMode: true },
		ModuleBE_AccountDB: { canRegister: true }
	},
	before: async () => {
		await new MemStorage().init(async () => {
			MemKey_AccountId.set(Test_DefaultAccountId);
			await permissionTestCleanup();
		});
	},
	after: async () => {
		await permissionTestCleanup();
	}
};
