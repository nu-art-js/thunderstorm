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

import type {PermissionScope} from '@nu-art/permissions-shared';
import {registerFunctionPermission} from './core/function-permission-registry.js';
import type {FunctionPermissionDef} from './core/function-permission-registry.js';

export {type FunctionPermissionDef} from './core/function-permission-registry.js';

/**
 * Symbol key used to attach the function-permission def to a method.
 * PermissionsAssert (or middleware) can read this to assert before invoking the handler.
 */
export const RequirePermissionDefKey = Symbol.for('RequirePermissionDef');

/**
 * Method decorator that registers a function permission (scope + value) and attaches
 * the def to the method. No assert in the decorator; assert runs at request time
 * when the handler is invoked (via PermissionsAssert or module wrapper).
 *
 * @param scope - Branded permission scope (e.g. definePermissionScope('pathway', ['read','write','delete','admin']))
 * @param value - One of scope.values (e.g. 'write')
 */
export function RequirePermission<P extends PermissionScope>(scope: P, value: P['values'][number]) {
	return function <T extends (this: unknown, ...args: unknown[]) => Promise<unknown>>(
		originalMethod: T,
		_context: ClassMethodDecoratorContext<unknown, T>
	): T {
		const def = registerFunctionPermission(scope, value);
		(originalMethod as T & { [RequirePermissionDefKey]?: FunctionPermissionDef })[RequirePermissionDefKey] = def;
		return originalMethod;
	};
}

/**
 * Returns the function-permission def attached to a handler, or undefined.
 */
export function getRequirePermissionDef(handler: ((...args: unknown[]) => unknown) | null | undefined): FunctionPermissionDef | undefined {
	if (!handler || typeof handler !== 'function')
		return undefined;
	return (handler as { [RequirePermissionDefKey]?: FunctionPermissionDef })[RequirePermissionDefKey];
}
