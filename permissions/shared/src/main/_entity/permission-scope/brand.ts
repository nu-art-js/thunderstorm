import {hashToUniqueId} from '@nu-art/db-api-shared';
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

const scopeRegistry = new Map<string, PermissionScope>();

/**
 * Creates a frozen, branded permission scope. Use this to define scopes
 * for the @RequirePermission decorator (e.g. pathway: read, write, delete, admin).
 */
export function definePermissionScope<K extends string, V extends readonly string[]>(key: K, values: V): PermissionScope & { key: K; values: V } {
	const scope = Object.freeze({key, values}) as PermissionScope & { key: K; values: V };
	scopeRegistry.set(key, scope);
	return scope;
}

export function getPermissionScopeValues(key: string): readonly string[] | undefined {
	return scopeRegistry.get(key)?.values;
}

export function getAllRegisteredScopes(): PermissionScope[] {
	return [...scopeRegistry.values()];
}


export function permissionScopeId<Scope extends PermissionScope>(key: Scope['key'], value: Scope['values'][number]) {
	return hashToUniqueId<DatabaseDef_PermissionScope['dbKey']>(`${key}:${value}`);
}
