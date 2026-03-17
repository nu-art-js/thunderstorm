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
