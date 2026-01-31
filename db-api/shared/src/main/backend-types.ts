/*
 * Database API infrastructure library for Thunderstorm.
 *
 * Shared backend type definitions: minimal shapes for BE modules (no Proto).
 * Symmetric to FE CrudTypes / BaseDBConfig.
 *
 * Copyright (C) 2020 Adam van der Kruk aka TacB0sS
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Minimal dependency definition shape (read by BE for entity dependency collection).
 */
export type BaseDBDefBE_Dependency = {
	dbKey: string;
	fieldType: 'string' | 'string[]';
};

/**
 * Minimal shape for the dbDef object passed to ModuleBE_BaseDB constructor.
 *
 * Application passes DBDef<Proto> (or equivalent); the base only depends on this shape.
 * No Proto reference in db-api shared or backend base.
 */
export type BaseDBDefBE = {
	dbKey: string;
	entityName: string;
	versions: readonly string[];
	uniqueKeys?: readonly string[];
	dependencies?: Record<string, BaseDBDefBE_Dependency>;
	TTL?: number;
	lastUpdatedTTL?: number;
	lockKeys?: readonly string[];
	metadata?: object;
};

/**
 * Config shape returned by getModuleBEConfig(dbDef).
 * Non-generic; used by ModuleBE_BaseDB config.
 */
export type DBApiBEConfigShape = {
	uniqueKeys: readonly string[];
	itemName: string;
	versions: readonly string[];
	TTL: number;
	lastUpdatedTTL: number;
	lockKeys?: readonly string[];
};
