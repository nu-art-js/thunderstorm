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
import {DB_BaseObject, DB_Object, Default_UniqueKey} from './db-object.js';
import {EntityDependencyError} from '@nu-art/firebase-shared';
import {ApiDef, BodyApi, HttpMethod, QueryApi} from '@nu-art/http-client';
import type {CrudQuery} from './query-types.js';
import {DBIndex} from '@nu-art/idb-shared';


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
export type ProtoDependencies<T extends object> = { [K in DotNotation<T>]?: DB_Prototype }

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
export type DB_ProtoSeed<
	T extends DB_Object,
	DatabaseKey extends string,
	GeneratedKeys extends keyof T | never,
	Versions extends VersionsDeclaration<VersionType[]>,
	UniqueKeys extends keyof T = Default_UniqueKey,
	Dependencies extends Exact<{ [K in DotNotation<T>]?: DB_Prototype }, Dependencies> = never> = {

	type: T,
	dbKey: DatabaseKey;
	generatedKeys: GeneratedKeys | keyof DB_Object
	versions: Versions,
	uniqueKeys: UniqueKeys
	dependencies: keyof Dependencies extends never ? never : Dependencies
}

type DependenciesImpl<T extends object, D extends ProtoDependencies<T>> = {
	[K in keyof D]: D[K] extends DB_Prototype
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
export type DB_Prototype<ProtoSeed extends DB_ProtoSeed<any, string, any, VersionsDeclaration<VersionType[]>, any, any> = any, ModifiableSubType = Omit<ProtoSeed['type'], ProtoSeed['generatedKeys'] | keyof DB_Object>, GeneratedSubType = SubsetObjectByKeys<ProtoSeed['type'], ProtoSeed['generatedKeys']>> = {
	editableType: ModifiableSubType,
	uiType: ModifiableSubType & Partial<GeneratedSubType> & Partial<DB_Object>,
	// dbType: ModifiableSubType & GeneratedSubType & DB_Object,
	preDbType: ModifiableSubType & Partial<GeneratedSubType>,
	dbType: ProtoSeed['type'],
	dbKey: ProtoSeed['dbKey'],
	generatedPropsValidator: ValidatorTypeResolver<Omit<GeneratedSubType, keyof DB_Object>>
	modifiablePropsValidator: ValidatorTypeResolver<ModifiableSubType>
	uniqueKeys: ProtoSeed['uniqueKeys'][],
	generatedProps: ProtoSeed['generatedKeys'][]
	versions: ProtoSeed['versions']
	indices: DBIndex<ProtoSeed['type']>[]
	uniqueParam: Default_UniqueKey | { [K in ProtoSeed['uniqueKeys']]: ProtoSeed['type'][K] }
	lockKeys?: (keyof ProtoSeed['type'])[]
	dependencies: DependenciesImpl<ProtoSeed['type'], ProtoSeed['dependencies']>
}

/**
 * Represents the definition of a database entity with metadata and validation rules.
 *
 * @template Proto The DBProto type that this definition is based on.
 */
export type Database<Proto extends DB_Prototype> = {
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


/** Flat CRUD API defs (no v1 wrapper). Generic so ApiHandler infers payload types. */
export type CrudApiTypes<Proto extends DB_Prototype = DB_Prototype> = {
	query: BodyApi<Proto['dbType'][], CrudQuery<Proto['dbType']>>;
	queryUnique: QueryApi<Proto['dbType'], DB_BaseObject>;
	upsert: BodyApi<Proto['dbType'], Proto['uiType']>;
	upsertAll: BodyApi<Proto['dbType'][], Proto['uiType'][]>;
	deleteUnique: QueryApi<Proto['dbType'] | undefined, DB_BaseObject, EntityDependencyError>;
	deleteQuery: BodyApi<Proto['dbType'][], CrudQuery<Proto['dbType']>>;
	deleteAll: QueryApi<Proto['dbType'][]>;
};

export type CrudApiDef_Type<Proto extends DB_Prototype = DB_Prototype> = {
	query: ApiDef<CrudApiTypes<Proto>['query']>;
	queryUnique: ApiDef<CrudApiTypes<Proto>['queryUnique']>;
	upsert: ApiDef<CrudApiTypes<Proto>['upsert']>;
	upsertAll: ApiDef<CrudApiTypes<Proto>['upsertAll']>;
	deleteUnique: ApiDef<CrudApiTypes<Proto>['deleteUnique']>;
	deleteQuery: ApiDef<CrudApiTypes<Proto>['deleteQuery']>;
	deleteAll: ApiDef<CrudApiTypes<Proto>['deleteAll']>;
};

export function CrudApiDef<Proto extends DB_Prototype>(database: Database<Proto>, version = 'v1'): CrudApiDef_Type<Proto> {
	return {
		query: {method: HttpMethod.POST, path: `${version}/${database.dbKey}/query`, timeout: 60000},
		queryUnique: {method: HttpMethod.GET, path: `${version}/${database.dbKey}/query-unique`},
		upsert: {method: HttpMethod.POST, path: `${version}/${database.dbKey}/upsert`},
		upsertAll: {method: HttpMethod.POST, path: `${version}/${database.dbKey}/upsert-all`},
		deleteUnique: {method: HttpMethod.GET, path: `${version}/${database.dbKey}/delete-unique`},
		deleteQuery: {method: HttpMethod.POST, path: `${version}/${database.dbKey}/delete-query`},
		deleteAll: {method: HttpMethod.GET, path: `${version}/${database.dbKey}/delete-all`},
	};
}
