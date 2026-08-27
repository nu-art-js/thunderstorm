import {hashToUniqueId} from '@nu-art/db-api-shared';
import {DatabaseDef_PermissionScope} from './types.js';

/** Type-only brand for PermissionScope; use definePermissionScope() to create valid instances. */
declare const PermissionScopeBrand: unique symbol;

/**
 * Branded permission scope for function-based permissions.
 * Valid instances are created via definePermissionScope() or buildPermissionScope().
 */
export type PermissionScope = {
	readonly key: string;
	readonly values: readonly string[];
	readonly [PermissionScopeBrand]: true;
};

const scopeRegistry = new Map<string, PermissionScope>();

function createPermissionScope<K extends string, V extends readonly string[]>(key: K, values: V): PermissionScope & { key: K; values: V } {
	return Object.freeze({key, values}) as PermissionScope & { key: K; values: V };
}

/**
 * Creates a frozen, branded permission scope without registering it in the global scope registry.
 * Use for dynamic per-instance scopes (e.g. per-organization) that must not pollute bootstrap.
 */
export function buildPermissionScope<K extends string, V extends readonly string[]>(key: K, values: V): PermissionScope & { key: K; values: V } {
	return createPermissionScope(key, values);
}

/**
 * Creates a frozen, branded permission scope and registers it in the global scope registry.
 * Use this to define scopes for the @RequirePermission decorator (e.g. pathway: read, write, delete, admin).
 */
export function definePermissionScope<K extends string, V extends readonly string[]>(key: K, values: V): PermissionScope & { key: K; values: V } {
	const scope = createPermissionScope(key, values);
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
