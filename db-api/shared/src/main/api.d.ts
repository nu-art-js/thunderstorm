import { EntityDependencyError, FirestoreQuery } from '@nu-art/firebase-shared';
import { ResponseError } from '@nu-art/ts-common/core/exceptions/types';
import { ApiDefResolver, BodyApi, QueryApi } from '@nu-art/http-client';
import { Database, DatabasePrototype, IndexKeys } from './types.js';
import { DB_BaseObject } from './types/db-object.js';
import { Metadata } from './types/metadata.js';
/**
 * API structure for database operations (standard version).
 *
 * Defines the complete set of database API endpoints including query, upsert, patch, delete operations.
 *
 * @template Proto - Database prototype type extending DatabasePrototype
 */
export type ApiStruct_DBApiGen<Proto extends DatabasePrototype<any, any, any>> = {
    v1: {
        query: BodyApi<Proto['dbType'][], FirestoreQuery<Proto['dbType']>, FirestoreQuery<Proto['dbType']> | undefined | {}>;
        queryUnique: QueryApi<Proto['dbType'], DB_BaseObject, ResponseError<string, any>, string>;
        upsert: BodyApi<Proto['dbType'], Proto['uiType']>;
        upsertAll: BodyApi<Proto['dbType'][], Proto['uiType'][]>;
        patch: BodyApi<Proto['dbType'], Proto['uiType']>;
        delete: QueryApi<Proto['dbType'], DB_BaseObject>;
        deleteQuery: BodyApi<Proto['dbType'][], FirestoreQuery<Proto['dbType']>>;
        deleteAll: QueryApi<void>;
        metadata: QueryApi<Metadata<Proto['dbType']>>;
    };
};
/**
 * API structure for database operations with IndexedDB support.
 *
 * Enhanced version that includes IndexedDB-specific query capabilities and error handling.
 *
 * @template Proto - Database prototype type extending DatabasePrototype
 */
export type ApiStruct_DBApiGenIDB<Proto extends DatabasePrototype<any, any, any>> = {
    v1: {
        query: BodyApi<Proto['dbType'][], FirestoreQuery<Proto['dbType']>>;
        queryUnique: QueryApi<Proto['dbType'], DB_BaseObject, ResponseError<string, any>, string | IndexKeys<Proto['dbType'], keyof Proto['dbType']>>;
        upsert: BodyApi<Proto['dbType'], Proto['uiType']>;
        upsertAll: BodyApi<Proto['dbType'][], Proto['uiType'][]>;
        patch: BodyApi<Proto['dbType'], IndexKeys<Proto['dbType'], keyof Proto['dbType']> & Partial<Proto['dbType']>>;
        delete: QueryApi<Proto['dbType'] | undefined, DB_BaseObject, EntityDependencyError>;
        deleteQuery: BodyApi<Proto['dbType'][], FirestoreQuery<Proto['dbType']>>;
        deleteAll: QueryApi<Proto['dbType'][]>;
        metadata: QueryApi<Metadata<Proto['dbType']>>;
    };
};
/**
 * Generates API definitions for standard database operations.
 *
 * Creates API endpoint definitions for all database CRUD operations based on the database definition.
 *
 * @template Proto - Database prototype type
 * @param dbDef - Database definition containing dbKey and other metadata
 * @param version - API version string (default: 'v1')
 * @returns API definition resolver for the database operations
 */
export declare const DBApiDefGenerator: <Proto extends DatabasePrototype<any, any, any>>(dbDef: Database<Proto>, version?: string) => ApiDefResolver<ApiStruct_DBApiGen<Proto>>;
/**
 * Generates API definitions for database operations with IndexedDB support.
 *
 * Creates API endpoint definitions optimized for IndexedDB caching and offline support.
 *
 * @template Proto - Database prototype type
 * @param dbDef - Database definition containing dbKey and other metadata
 * @param version - API version string (default: 'v1')
 * @returns API definition resolver for the database operations with IDB support
 */
export declare const DBApiDefGeneratorIDB: <Proto extends DatabasePrototype<any, any, any>>(dbDef: Database<Proto>, version?: string) => ApiDefResolver<ApiStruct_DBApiGenIDB<Proto>>;
