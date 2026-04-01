import {stringToUniqueId} from '@nu-art/db-api-shared';
import {md5} from '@nu-art/ts-common';
import {DatabaseDef_PermissionScope} from './types.js';

/** Type-only brand for PermissionScope; use definePermissionScope() to create valid instances. */
declare const PermissionScopeBrand: unique symbol;

/**
 * Branded permission scope for function-based permissions.
 * Only instances created via definePermissionScope() are valid.
 */
export type PermissionScope = {
	readonly key: string;
	readonly values: readonly string[];
	readonly [PermissionScopeBrand]: true;
};

/**
 * Creates a frozen, branded permission scope. Use this to define scopes
 * for the @RequirePermission decorator (e.g. pathway: read, write, delete, admin).
 */
export function definePermissionScope<K extends string, V extends readonly string[]>(key: K, values: V): PermissionScope & { key: K; values: V } {
	return Object.freeze({key, values}) as PermissionScope & { key: K; values: V };
}


export function permissionScopeId<Scope extends PermissionScope>(key: Scope['key'], value: Scope['values'][number]) {
	return stringToUniqueId<DatabaseDef_PermissionScope['dbKey']>(md5(`${key}:${value}`));
}
