/*
 * @nu-art/app-config-shared - CrudTypes and BaseDBDefBE for app-config
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {CrudApiDef} from '@nu-art/db-api-shared';
import {tsValidateMustExist, tsValidateOptional, tsValidateString} from '@nu-art/ts-common';

const validator = {
	_id: tsValidateOptional,
	key: tsValidateString(),
	data: tsValidateMustExist,
};


/** BaseDBDefBE-compatible definition for backend ModuleBE_BaseDB. Includes backend and validators for FirestoreCollectionV3. */
export const BaseDBDefBE_AppConfig = {
	dbKey: DBKey_AppConfig,
	entityName: EntityName_AppConfig,
	versions: [...Versions_AppConfig],
	uniqueKeys: ['_id'] as const,
	backend: {name: DBKey_AppConfig},
	generatedPropsValidator: {} as Record<string, unknown>,
	modifiablePropsValidator: validator,
};

/** CRUD API definition for app-config (used by db-api backend and frontend). */
export const CrudApiDef_AppConfig = CrudApiDef<Types_AppConfig>(DBKey_AppConfig);
