/*
 * Permissions management system, define access level for each of
 * your server apis, and restrict users by giving them access levels
 *
 * Copyright (C) 2020 Adam van der Kruk aka TacB0sS
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {md5} from '@nu-art/ts-common';
import type {PermissionScope} from '@nu-art/permissions-shared';

export type FunctionPermissionDef = {
	id: string;
	scopeKey: string;
	value: string;
};

const registry = new Map<string, FunctionPermissionDef>();
const scopeValuesRegistry = new Map<string, readonly string[]>();

function compositeKey(scopeKey: string, value: string): string {
	return `${scopeKey}\0${value}`;
}

/**
 * Registers a function permission (scope + value). Called from @RequirePermission decorator init.
 * Returns the same def if (scopeKey, value) was already registered (stable id).
 * Also stores the scope's ordered values array for position-based assertion.
 */
export function registerFunctionPermission(scope: PermissionScope, value: string): FunctionPermissionDef {
	const scopeKey = scope.key;
	if (!scopeValuesRegistry.has(scopeKey))
		scopeValuesRegistry.set(scopeKey, scope.values);

	const key = compositeKey(scopeKey, value);
	const existing = registry.get(key);
	if (existing)
		return existing;

	const id = md5(`function-permission/${scopeKey}/${value}`);
	const def: FunctionPermissionDef = {id, scopeKey, value};
	registry.set(key, def);
	return def;
}

/**
 * Returns all registered function permissions for server load (create domains/levels in DB).
 */
export function getRegisteredFunctionPermissions(): FunctionPermissionDef[] {
	return [...registry.values()];
}

/**
 * Returns the def for a given (scopeKey, value), or undefined if not registered.
 */
export function getFunctionPermissionDef(scopeKey: string, value: string): FunctionPermissionDef | undefined {
	return registry.get(compositeKey(scopeKey, value));
}

/**
 * Returns the ordered values array for a scope key, or undefined if the scope was never registered.
 */
export function getScopeValues(scopeKey: string): readonly string[] | undefined {
	return scopeValuesRegistry.get(scopeKey);
}
