/*
 * @nu-art/app-config-shared - CrudTypes and BaseDBDefBE for app-config
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {CrudApiDef, CrudTypes} from '@nu-art/db-api-shared';
import {tsValidateMustExist, tsValidateOptional, tsValidateString} from '@nu-art/ts-common';
import type {DB_AppConfig, UI_AppConfig} from './types.js';
import {DBKey_AppConfig, EntityName_AppConfig, Versions_AppConfig} from './types.js';

const validator = {
	_id: tsValidateOptional,
	key: tsValidateString(),
	data: tsValidateMustExist,
};

export type Types_AppConfig = CrudTypes<
	typeof DBKey_AppConfig,
	DB_AppConfig,
	UI_AppConfig,
	typeof validator,
	['_id']
>;

export const CrudTypes_AppConfig: Types_AppConfig = {
	dbKey: DBKey_AppConfig,
	dbItem: undefined as unknown as DB_AppConfig,
	uiItem: undefined as unknown as UI_AppConfig,
	validator,
	uniqueKeys: ['_id'],
};

/** BaseDBDefBE-compatible definition for backend ModuleBE_BaseDB. */
export const BaseDBDefBE_AppConfig = {
	dbKey: DBKey_AppConfig,
	entityName: EntityName_AppConfig,
	versions: [...Versions_AppConfig],
	uniqueKeys: ['_id'] as const,
};

/** CRUD API definition for app-config (used by db-api backend and frontend). */
export const CrudApiDef_AppConfig = CrudApiDef<Types_AppConfig>(DBKey_AppConfig, 'v1');
