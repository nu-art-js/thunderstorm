/*
 * @nu-art/storm-shared - Shared types for storm packages
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import type {DB_Prototype} from '@nu-art/db-api-shared';
import {ThunderDispatcher} from './ThunderDispatcher.js';

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


export type ApiCallerEventType<Proto extends DB_Prototype> =
	| [SingleApiEvent, Proto['dbType']]
	| [MultiApiEvent, Proto['dbType'][]];

export type DispatcherDef<Proto extends DB_Prototype, MethodName extends `${string}`> = {
	eventName: MethodName;
	method: (...params: ApiCallerEventType<Proto>) => void;
};

export type DispatcherInterface<Def extends DispatcherDef<any, any>> = {
	[K in Def['eventName']]: Def['method'];
};

export class ThunderDispatcherV3<T extends DispatcherDef<any, any>>
	extends ThunderDispatcher<{ [K in T['eventName']]: T['method'] }, T['eventName']> {
}
