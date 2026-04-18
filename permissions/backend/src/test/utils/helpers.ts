/*
 * @nu-art/permissions-backend - Firebase test helpers
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import type {Module} from '@nu-art/ts-common';
import {ModuleBE_AccountDB, ModuleBE_SessionDB} from '@nu-art/user-account-backend';
import {ModulePackBE_Permissions} from '../../main/core/module-pack.js';

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
		ModuleBE_PermissionsAssert: {strictMode: true},
		ModuleBE_AccountDB: {canRegister: true}
	},
};
