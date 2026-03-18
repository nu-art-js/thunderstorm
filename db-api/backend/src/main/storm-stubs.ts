/*
 * @nu-art/db-api-backend - Minimal stubs for ModuleBE_BaseDB (no thunderstorm dependency)
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {Const_UniqueKeys, Day, Hour} from '@nu-art/ts-common';
import {Dispatcher} from '@nu-art/ts-common';
import type {Transaction} from 'firebase-admin/firestore';
import type {BaseDBDefBE, DBApiBEConfigShape} from './backend-types.js';
import type {DBEntityDependencies} from '@nu-art/db-api-shared';

export type {DBApiBEConfigShape as DBApiBEConfig};

export const getModuleBEConfig = (dbDef: BaseDBDefBE): DBApiBEConfigShape => {
	return {
		versions: dbDef.versions,
		lockKeys: dbDef.lockKeys,
		uniqueKeys: dbDef.uniqueKeys ?? Const_UniqueKeys as readonly string[],
		itemName: dbDef.entityName,
		TTL: dbDef.TTL ?? Hour * 2,
		lastUpdatedTTL: dbDef.lastUpdatedTTL ?? Day,
	};
};

export {DBEntityDependencyErrorType, type DBEntityDependencies, type DBEntityDependencyError, type DBEntityDependencyResult} from '@nu-art/db-api-shared';

export interface EntityDependencyCollection {
	__collectEntityDependencies: (type: string, itemIds: string[], transaction?: Transaction) => Promise<DBEntityDependencies | undefined>;
}

export const dispatch_CollectEntityDependencies = new Dispatcher<EntityDependencyCollection, '__collectEntityDependencies'>('__collectEntityDependencies');
