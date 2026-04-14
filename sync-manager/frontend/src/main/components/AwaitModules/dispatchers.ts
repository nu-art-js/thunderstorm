/*
 * @nu-art/sync-manager-frontend - AwaitModules dispatchers
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {ThunderDispatcher} from '@nu-art/thunder-core';
import type {ModuleFE_BaseDB} from '@nu-art/db-api-frontend';

export interface QueryAwaitedModules {
	__queryAwaitedModule(): (ModuleFE_BaseDB<any>)[];
}

export interface OnSyncStatusChanged {
	__onSyncStatusChanged(module: ModuleFE_BaseDB<any>): void;
}

export const dispatch_QueryAwaitedModules = new ThunderDispatcher<QueryAwaitedModules, '__queryAwaitedModule'>('__queryAwaitedModule');
export const dispatch_onSyncStatusChanged = new ThunderDispatcher<OnSyncStatusChanged, '__onSyncStatusChanged'>('__onSyncStatusChanged');
