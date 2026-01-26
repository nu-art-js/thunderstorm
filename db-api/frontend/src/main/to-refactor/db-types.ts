/*
 * @nu-art/db-api-frontend - Database API infrastructure for Thunderstorm frontend
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 *
 * TO-REFACTOR: These types should come from @nu-art/db-api-shared or be standardized.
 */

import {ValidatorTypeResolver} from '@nu-art/ts-common';


/**
 * Database index definition.
 */
export type DBIndex<ItemType extends object> = {
	id: string;
	keys: keyof ItemType | (keyof ItemType)[];
	params?: {
		multiEntry: boolean;
		unique: boolean;
	};
};

/**
 * IndexedDB configuration for a store.
 */
export type DBConfig<ItemType extends object> = {
	name: string;
	group: string;
	version: string;
	autoIncrement?: boolean;
	uniqueKeys: (keyof ItemType)[];
	indices?: DBIndex<ItemType>[];
	upgradeProcessor?: (store: IDBObjectStore) => void;
};


/**
 * Base database object with ID field.
 */
export type DB_BaseObject = {
	_id: string;
}

/**
 * Full database object with metadata.
 */
export type DB_Object = DB_BaseObject & {
	__created: number;
	__updated: number;
	_v: string;
}

/**
 * Keys that are part of DB_Object (not user-defined fields).
 */
export const KeysOfDB_Object: (keyof DB_Object)[] = ['_id', '__created', '__updated', '_v'];

/**
 * Database prototype definition.
 *
 * Defines the shape of a database entity including its types,
 * validators, and version information.
 */
export type DBProto<T extends DB_Object = DB_Object> = {
	dbType: T;
	uiType: Omit<T, keyof DB_Object> & Partial<DB_Object>;
	uniqueParam: string | { _id: string } | { [K in keyof T]?: T[K] };
	modifiablePropsValidator: ValidatorTypeResolver<Omit<T, keyof DB_Object>>;
	generatedPropsValidator: ValidatorTypeResolver<any>;
	versions: {
		versions: string[];
		types: { [v: string]: any };
	};
}

/**
 * Database definition (version 3).
 *
 * Contains all configuration needed to define a database collection.
 */
export type DBDef_V3<Proto extends DBProto<any>> = {
	dbKey: string;
	entityName: string;
	modifiablePropsValidator: Proto['modifiablePropsValidator'];
	generatedPropsValidator: Proto['generatedPropsValidator'];
	generatedProps?: (keyof Proto['dbType'])[];
	versions: string[];
	uniqueKeys?: (keyof Proto['dbType'])[];
	lockKeys?: (keyof Proto['dbType'])[];
	metadata?: any;
	frontend?: {
		name: string;
		group: string;
	};
	TTL?: number;
	lastUpdatedTTL?: number;
}

/**
 * Frontend module configuration derived from DBDef.
 */
export type DBApiFEConfig<Proto extends DBProto<any>> = {
	key: string;
	validator: Proto['modifiablePropsValidator'];
	dbConfig: DBConfig<Proto['dbType']>;
	versions: string[];
}

/**
 * Generate frontend module config from database definition.
 */
export function getModuleFEConfig<Proto extends DBProto<any>>(dbDef: DBDef_V3<Proto>): DBApiFEConfig<Proto> {
	return {
		key: dbDef.dbKey,
		validator: dbDef.modifiablePropsValidator,
		dbConfig: {
			name: dbDef.frontend?.name ?? dbDef.dbKey,
			group: dbDef.frontend?.group ?? 'default',
			version: dbDef.versions[0],
			uniqueKeys: (dbDef.uniqueKeys ?? ['_id']) as (keyof Proto['dbType'])[],
		},
		versions: dbDef.versions,
	};
}
