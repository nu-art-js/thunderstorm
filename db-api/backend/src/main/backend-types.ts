/*
 * @nu-art/db-api-backend - Backend type definitions for db-api BE modules (no Proto).
 * Copyright (C) 2020 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
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
 * No Proto reference in db-api backend base.
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
