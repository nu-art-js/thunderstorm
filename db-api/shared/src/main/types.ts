/*
 * Database API infrastructure library for Thunderstorm.
 *
 * Provides shared types and interfaces for database API operations across frontend and backend.
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

import {DotNotation, DotNotationValueType, SubsetObjectByKeys, ValidatorTypeResolver} from '@nu-art/ts-common';
import {DB_BaseObject, DB_Object} from './types/db-object.js';
import {EntityDependencyError} from '@nu-art/firebase-shared';
import {ApiDef, BodyApi, HttpMethod, QueryApi} from '@nu-art/http-client';
import type {CrudQuery} from './query-types.js';


/**
 * Removes all database metadata keys from a type.
 *
 * @template T - Database object type
 */
export type OmitDBObject<T extends DB_Object> = Omit<T, keyof DB_Object>;

/**
 * Index keys type for querying by indexed fields.
 *
 * Allows querying by any combination of indexed keys.
 *
 * @template T - Object type
 * @template Ks - Indexed keys
 */
export type IndexKeys<T extends Object, Ks extends keyof T> = { [K in Ks]?: T[K] }; // {_id:'all bases belong to us'} || {label: 'all items with this label'}

/**
 * Database index definition.
 *
 * Defines an index on one or more fields of a database object.
 *
 * @template T - Database object type
 */
export type DBIndex<T extends DB_Object> = {
	/** Index identifier */
	id: string,
	/** Field(s) to index (single key or array of keys) */
	keys: keyof T | (keyof T)[],
	/** Optional index parameters */
	params?: { multiEntry: boolean, unique: boolean }
};

/** Default unique key name for database objects */
export type Default_UniqueKey = '_id';

/** Version type (semantic version string) */
export type VersionType = string

/**
 * Version declaration for database object versioning.
 *
 * Defines available versions and their corresponding types.
 *
 * @template Versions - Array of version strings
 * @template Types - Map of version to object type
 */
export type VersionsDeclaration<Versions extends VersionType[] = ['1.0.0'], Types extends { [V in Versions[number]]: DB_Object } = { [V in Versions[number]]: DB_Object }> = {
	/** Array of version strings */
	versions: Versions
	/** Map of version to object type */
	types: Types
};

/**
 * Type for defining dependencies between database objects.
 *
 * Maps dot-notation paths to DBProto definitions, allowing type-safe
 * references to related database objects.
 *
 * @template T - Object type with dependencies
 */
export type ProtoDependencies<T extends object> = { [K in DotNotation<T>]?: DatabasePrototype<any> }

type Exact<T, Shape> = T & {
	[K in Exclude<keyof Shape, keyof T>]?: never;
};

/**
 * Defines the base structure and constraints for a database object.
 *
 * @template T The base type of the database object.
 * @template GeneratedKeys Keys that are auto-generated and should not be manually modified.
 * @template Versions Versioning information for the database object.
 * @template UniqueKeys Keys that are unique to each instance of the database object.
 * @template Dependencies (Future Use) Defines dependencies or relationships to other database objects.
 */
export type Proto_DB_Object<
	T extends DB_Object,
	DatabaseKey extends string,
	GeneratedKeys extends keyof T | never,
	Versions extends VersionsDeclaration<VersionType[]>,
	UniqueKeys extends keyof T = Default_UniqueKey,
	Dependencies extends Exact<{ [K in DotNotation<T>]?: DatabasePrototype<any> }, Dependencies> = never> = {

	type: T,
	dbKey: DatabaseKey;
	generatedKeys: GeneratedKeys | keyof DB_Object
	versions: Versions,
	uniqueKeys: UniqueKeys
	dependencies: keyof Dependencies extends never ? never : Dependencies
}

type DependenciesImpl<T extends object, D extends ProtoDependencies<T>> = {
	[K in keyof D]: D[K] extends DatabasePrototype<any>
		? {
			dbKey: D[K]['dbKey'],
			direction?: 'ref' | 'dep' // default is "dep"
			fieldType: TypeOfTypeAsString<DotNotationValueType<T, K & string>>
		}
		: never
}

/**
 * Extends Proto_DB_Object with additional UI and validation details.
 *
 * @template P The Proto_DB_Object this DBProto is based on.
 * @template ModifiableSubType The subset of P's type that is modifiable.
 * @template GeneratedSubType The subset of P's type that is auto-generated.
 */
export type DatabasePrototype<P extends Proto_DB_Object<any, string, any, VersionsDeclaration<VersionType[]>, any, any>, ModifiableSubType = Omit<P['type'], P['generatedKeys'] | keyof DB_Object>, GeneratedSubType = SubsetObjectByKeys<P['type'], P['generatedKeys']>> = {
	uiType: ModifiableSubType & Partial<GeneratedSubType> & Partial<DB_Object>,
	// dbType: ModifiableSubType & GeneratedSubType & DB_Object,
	preDbType: ModifiableSubType & Partial<GeneratedSubType>,
	dbType: P['type'],
	dbKey: P['dbKey'],
	generatedPropsValidator: ValidatorTypeResolver<Omit<GeneratedSubType, keyof DB_Object>>
	modifiablePropsValidator: ValidatorTypeResolver<ModifiableSubType>
	uniqueKeys: P['uniqueKeys'][],
	generatedProps: P['generatedKeys'][]
	versions: P['versions']
	indices: DBIndex<P['type']>[]
	uniqueParam: Default_UniqueKey | { [K in P['uniqueKeys']]: P['type'][K] }
	lockKeys?: (keyof P['type'])[]
	dependencies: DependenciesImpl<P['type'], P['dependencies']>
}

/**
 * Represents the definition of a database entity with metadata and validation rules.
 *
 * @template Proto The DBProto type that this definition is based on.
 */
export type Database<Proto extends DatabasePrototype<any, any, any>> = {
	dbKey: Proto['dbKey'];
	entityName: string;
	frontend: {
		name: string;
		group: string;
	};
	backend: {
		name: string;
	};
	TTL?: number;
	lastUpdatedTTL?: number;
	upgradeChunksSize?: number;
	generatedProps?: Proto['generatedProps']
	generatedPropsValidator: Proto['generatedPropsValidator'];
	modifiablePropsValidator: Proto['modifiablePropsValidator'];
	uniqueKeys?: Proto['uniqueKeys'];
	versions: Proto['versions']['versions'];
	indices?: Proto['indices'];
	lockKeys?: Proto['lockKeys'];
	dependencies?: Proto['dependencies']
}


/**
 * Converts a TypeScript type to a string representation.
 *
 * Maps types to their string equivalents for metadata/validation:
 * - Arrays: 'string[]', 'number[]', 'boolean[]', 'object[]', or 'array'
 * - Primitives: 'string', 'number', 'boolean'
 * - Objects: 'object'
 *
 * @template ValueType - Type to convert
 */
export type TypeOfTypeAsString<ValueType> =
	ValueType extends any[] ?
		ValueType extends string[] ? 'string[]' :
			ValueType extends number[] ? 'number[]' :
				ValueType extends boolean[] ? 'boolean[]' :
					ValueType extends object[] ? 'object[]' : 'array'
		:
		ValueType extends string ? 'string' :
			ValueType extends number ? 'number' :
				ValueType extends boolean ? 'boolean' :
					ValueType extends object ? 'object' :
						never;

// --- CRUD API types (shared FE/BE) ---

export type CrudTypes<
	DBKey extends string = string,
	DBItem extends DB_Object = DB_Object,
	UIItem extends object & { _id?: string } = object & { _id?: string },
	Validator extends ValidatorTypeResolver<UIItem> = ValidatorTypeResolver<UIItem>,
	UniqueKeys extends (keyof DBItem)[] = (keyof DBItem)[]
> = {
	readonly dbKey: DBKey;
	readonly dbItem: DBItem;
	readonly uiItem: UIItem;
	readonly validator: Validator;
	readonly uniqueKeys: UniqueKeys;
};

/**
 * Shape of a query result that includes both items to update and items to delete.
 * Used when applying sync payloads (e.g. from sync manager) via ModuleFE_BaseDB.applySyncResponse.
 * Sync manager owns Response_DBSync; this type is the structural contract so db-api frontend need not depend on sync-manager.
 */
export type QueryResultWithDeletes<T extends DB_Object = DB_Object> = { toUpdate: T[]; toDelete: DB_Object[] };

/** Flat CRUD API defs (no v1 wrapper). Generic so ApiHandler infers payload types. */
export type CrudApiTypes<Types extends CrudTypes = CrudTypes> = {
	query: BodyApi<Types['dbItem'][], CrudQuery<Types['dbItem']>>;
	queryUnique: QueryApi<Types['dbItem'], DB_BaseObject>;
	upsert: BodyApi<Types['dbItem'], Types['uiItem']>;
	upsertAll: BodyApi<Types['dbItem'][], Types['uiItem'][]>;
	deleteUnique: QueryApi<Types['dbItem'] | undefined, DB_BaseObject, EntityDependencyError>;
	deleteQuery: BodyApi<Types['dbItem'][], CrudQuery<Types['dbItem']>>;
	deleteAll: QueryApi<Types['dbItem'][]>;
};

export type CrudApiDef_Type<Types extends CrudTypes = CrudTypes> = {
	query: ApiDef<CrudApiTypes<Types>['query']>;
	queryUnique: ApiDef<CrudApiTypes<Types>['queryUnique']>;
	upsert: ApiDef<CrudApiTypes<Types>['upsert']>;
	upsertAll: ApiDef<CrudApiTypes<Types>['upsertAll']>;
	deleteUnique: ApiDef<CrudApiTypes<Types>['deleteUnique']>;
	deleteQuery: ApiDef<CrudApiTypes<Types>['deleteQuery']>;
	deleteAll: ApiDef<CrudApiTypes<Types>['deleteAll']>;
};

export function CrudApiDef<Types extends CrudTypes>(dbKey: string, version = 'v1'): CrudApiDef_Type<Types> {
	return {
		query: {method: HttpMethod.POST, path: `${version}/${dbKey}/query`, timeout: 60000},
		queryUnique: {method: HttpMethod.GET, path: `${version}/${dbKey}/query-unique`},
		upsert: {method: HttpMethod.POST, path: `${version}/${dbKey}/upsert`},
		upsertAll: {method: HttpMethod.POST, path: `${version}/${dbKey}/upsert-all`},
		deleteUnique: {method: HttpMethod.GET, path: `${version}/${dbKey}/delete-unique`},
		deleteQuery: {method: HttpMethod.POST, path: `${version}/${dbKey}/delete-query`},
		deleteAll: {method: HttpMethod.GET, path: `${version}/${dbKey}/delete-all`},
	};
}
