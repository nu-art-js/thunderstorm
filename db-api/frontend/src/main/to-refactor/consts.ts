/*
 * @nu-art/db-api-frontend - Database API infrastructure for Thunderstorm frontend
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 *
 * TO-REFACTOR: These constants should be moved to a shared package or standardized.
 */


/**
 * Data synchronization status for frontend modules.
 */
export enum DataStatus {
	NoData = 0,
	ContainsData = 1,
	UpdatingData = 2
}

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
