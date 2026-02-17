import {DB_Object} from './db-object.js';

/**
 * Single-item API event types.
 */
export const EventType_Create = 'create';
export const EventType_Update = 'update';
export const EventType_Delete = 'delete';
export const EventType_Patch = 'patch';
export const EventType_Unique = 'unique';

export type SingleApiEvent =
	| typeof EventType_Create
	| typeof EventType_Update
	| typeof EventType_Delete
	| typeof EventType_Patch
	| typeof EventType_Unique;

/**
 * Multi-item API event types.
 */
export const EventType_Query = 'query';
export const EventType_UpsertAll = 'upsert-all';
export const EventType_DeleteMulti = 'delete-multi';

export type MultiApiEvent =
	| typeof EventType_Query
	| typeof EventType_UpsertAll
	| typeof EventType_DeleteMulti;

export type ApiCallerEventType<DBType extends DB_Object> =
	| [SingleApiEvent, DBType]
	| [MultiApiEvent, DBType[]];


