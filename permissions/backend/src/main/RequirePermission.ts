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
import {ModuleBE_PermissionsAssert} from './modules/ModuleBE_PermissionsAssert.js';

export {type FunctionPermissionDef} from './core/function-permission-registry.js';

/**
 * Symbol key used to attach the function-permission def to a method.
 * Introspection via getRequirePermissionDef(handler) reads this.
 */
export const RequirePermissionDefKey = Symbol.for('RequirePermissionDef');

/**
 * Self-enforcing method decorator. Registers a function permission (scope + value)
 * and wraps the method so that invocation asserts the caller's access level via
 * MemKey_UserPermissions before the original logic runs.
 *
 * Decoupled from @ApiHandler — works on any async method (API handlers, service
 * methods, scheduled entry points, internal helpers). When composed with @ApiHandler,
 * place @ApiHandler ABOVE this decorator so the route captures the wrapped method.
 *
 * @param scope - Branded permission scope (e.g. definePermissionScope('pipeline', ['read','write','admin']))
 * @param value - One of scope.values (e.g. 'write')
 */
export function RequirePermission<P extends PermissionScope>(scope: P, value: P['values'][number]) {
	return function <This, Args extends any[], Return>(
		originalMethod: (this: This, ...args: Args) => Promise<Return>,
		_context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Promise<Return>>
	): (this: This, ...args: Args) => Promise<Return> {
		const def = registerFunctionPermission(scope, value);

		const wrapper = async function (this: This, ...args: Args): Promise<Return> {
			ModuleBE_PermissionsAssert.assertFunctionPermission(def);
			return originalMethod.call(this, ...args);
		};

		(wrapper as Function & { [RequirePermissionDefKey]?: FunctionPermissionDef })[RequirePermissionDefKey] = def;
		return wrapper;
	};
}

/**
 * Returns the function-permission def attached to a handler, or undefined.
 */
export function getRequirePermissionDef(handler: ((...args: any[]) => any) | null | undefined): FunctionPermissionDef | undefined {
	if (!handler || typeof handler !== 'function')
		return undefined;
	return (handler as { [RequirePermissionDefKey]?: FunctionPermissionDef })[RequirePermissionDefKey];
}
