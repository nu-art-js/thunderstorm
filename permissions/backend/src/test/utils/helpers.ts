/*
 * @nu-art/permissions-backend - Firebase test helpers
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import type {StormTestInput} from '@nu-art/storm-testalot';
import {ModuleBE_AccountDB, ModuleBE_SessionDB} from '@nu-art/user-account-backend';
import {ModulePackBE_Permissions} from '../../main/core/module-pack.js';

export const DefaultStormTestConfig_Permissions: StormTestInput = {
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
