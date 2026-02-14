/*
 * @nu-art/storm-shared - Shared types for storm packages
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import type {DBProto} from '@nu-art/ts-common';
import {ThunderDispatcher} from './ThunderDispatcher.js';

export type SingleApiEvent = 'create' | 'update' | 'unique' | 'delete' | 'patch';
export type MultiApiEvent = 'query' | 'upsert-all' | 'sync' | 'delete-multi';

export type ApiCallerEventType<Proto extends DBProto<any>> =
	| [SingleApiEvent, Proto['dbType']]
	| [MultiApiEvent, Proto['dbType'][]];

export type DispatcherDef<Proto extends DBProto<any>, MethodName extends `${string}`> = {
	eventName: MethodName;
	method: (...params: ApiCallerEventType<Proto>) => void;
};

export class ThunderDispatcherV3<T extends DispatcherDef<any, any>>
	extends ThunderDispatcher<{ [K in T['eventName']]: T['method'] }, T['eventName']> {}
