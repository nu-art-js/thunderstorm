/*
 * @nu-art/db-api-frontend - Database API infrastructure for Thunderstorm frontend
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import type {CrudTypes} from '@nu-art/db-api-shared';
import {DBConfig} from './to-refactor/db-types.js';

/**
 * Minimal configuration for BaseDB/BaseApi modules.
 *
 * Contains only what the module needs to operate, without Proto dependencies.
 *
 * @template Types - CrudTypes that define the entity types
 */
export type BaseDBConfig<Types extends CrudTypes> = {
	dbKey: Types['dbKey'];
	validator: Types['validator'];
	uniqueKeys: Types['uniqueKeys'];
	versions: string[];
	dbConfig: DBConfig<Types['dbItem']>;
};
