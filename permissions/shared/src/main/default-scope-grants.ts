/*
 * Permissions management system
 * Copyright (C) 2020 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {md5} from '@nu-art/ts-common';
import type {PermissionScope} from './permission-scope.js';
import {toPermissionGroupId} from './_entity/permission-group/db-def.js';

export type DefaultScopeGrant = {
	readonly scope: PermissionScope;
	readonly value: string;
};

export interface CollectDefaultScopeValues {
	__collectDefaultScopeValues(): DefaultScopeGrant[];
}

export type RegisteredScope = {
	readonly key: string;
	readonly values: readonly string[];
};

export type ResolveAdditionalGroupsContext = 'register' | 'login';

export interface ResolveAdditionalPermissionGroups {
	__resolveAdditionalPermissionGroups(accountId: string, context: ResolveAdditionalGroupsContext): Promise<string[]>;
}

export const GroupId_Default = toPermissionGroupId(md5('permissions/default-group'));
export const GroupId_PermissionsAdmin = toPermissionGroupId('8b54efda69b385a566735cca7be031d5');
