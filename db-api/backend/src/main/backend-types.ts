/*
 * @nu-art/db-api-backend - Backend type definitions for db-api BE modules (no Proto).
 * Copyright (C) 2020 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import type {DB_Object} from '@nu-art/ts-common';
import type {FirestoreQuery} from '@nu-art/firebase-shared';
import type {Transaction} from 'firebase-admin/firestore';
import type {DB_Prototype} from '@nu-art/db-api-shared';

/**
 * Interceptor callback types for the mandatory interceptor chain on ModuleBE_BaseDB.
 * These are generic — no permission types. Any module can register interceptors.
 */
export type PreWriteInterceptor<Database extends DB_Prototype = DB_Prototype> =
	(dbItem: Database['uiType'], original: Database['dbType'], tx?: Transaction) => Promise<void>;

export type QueryInterceptor<Database extends DB_Prototype = DB_Prototype> =
	(query: FirestoreQuery<Database['dbType']>) => FirestoreQuery<Database['dbType']>;

export type PreDeleteInterceptor<Database extends DB_Prototype = DB_Prototype> =
	(dbItems: Database['dbType'][], tx?: Transaction) => Promise<void>;

/**
 * Shape of post-write processing data (mirrors firebase PostWriteProcessingData but for DB_Object, no DB_Prototype).
 * Used so BE can type handlers without depending on DB_Prototype.
 */
export type PostWriteProcessingDataShape<T extends DB_Object> = {
	before?: T | T[];
	updated?: T | T[];
	deleted?: T | T[] | null;
};

export type PostWriteInterceptor<Database extends DB_Prototype = DB_Prototype> =
	(data: PostWriteProcessingDataShape<Database['dbType']>, actionType: string, tx?: Transaction) => Promise<void>;

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
