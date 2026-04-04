/*
 * @nu-art/db-api-frontend - Database API infrastructure for Thunderstorm frontend
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {Database, type DB_Prototype} from '@nu-art/db-api-shared';
import type {DBConfig_ModuleFE} from './ModuleFE_BaseDB.js';

export function buildConfigFromDBDef<Proto extends DB_Prototype>(dbDef: Database<Proto>): DBConfig_ModuleFE<Proto> {
	return {
		dbKey: dbDef.dbKey,
		validator: dbDef.modifiablePropsValidator,
		generatedProps: 'generatedProps' in dbDef ? dbDef.generatedProps as (keyof Proto['dbType'])[] : undefined,
		uniqueKeys: (dbDef.uniqueKeys ?? ['_id']) as Proto['uniqueKeys'],
		versions: [...dbDef.versions],
		dbConfig: {
			name: dbDef.frontend.name ?? (dbDef.dbKey as string),
			group: dbDef.frontend.group ?? 'default',
			version: dbDef.versions[0] ?? '1.0.0',
			uniqueKeys: (dbDef.uniqueKeys ?? ['_id']) as (keyof Proto['dbType'])[]
		}
	};
}
