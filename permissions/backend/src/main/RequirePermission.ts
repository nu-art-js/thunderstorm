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

import {HttpCodes} from '@nu-art/api-types';
import type {PermissionScope} from '@nu-art/permissions-shared';
import {registerFunctionPermission} from './core/function-permission-registry.js';
import type {FunctionPermissionDef} from './core/function-permission-registry.js';
import {ModuleBE_PermissionsAssert} from './modules/ModuleBE_PermissionsAssert.js';
import type {PermissionAsserter} from './assertion-types.js';

export {type FunctionPermissionDef} from './core/function-permission-registry.js';
export {type PermissionAssertionContext, type PermissionAsserter} from './assertion-types.js';

export const RequirePermissionDefKey = Symbol.for('RequirePermissionDef');

type AsyncMethodDecorator = <This, Args extends any[], Return>(
	originalMethod: (this: This, ...args: Args) => Promise<Return>,
	_context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Promise<Return>>
) => (this: This, ...args: Args) => Promise<Return>;

/**
 * Simple overload: checks that the caller has at least the required value
 * for the given scope (position-based in the scope's ordered values array).
 */
export function RequirePermission<P extends PermissionScope>(scope: P, value: P['values'][number]): AsyncMethodDecorator;

/**
 * Complex overload: receives a PermissionAssertionContext and the decorated
 * method's arguments. Return true to allow, false to deny (throws 403).
 *
 * @example
 * @RequirePermission((assert, body: EditArticleRequest) => {
 *   return assert.or(
 *     assert.and(
 *       assert.hasScope(PermissionScope_Articles, 'write'),
 *       assert.ownsEntity({dbKey: 'articles', id: body.articleId})
 *     ),
 *     assert.hasScope(PermissionScope_Articles, 'admin')
 *   );
 * })
 */
export function RequirePermission(asserter: PermissionAsserter): AsyncMethodDecorator;

export function RequirePermission(scopeOrAsserter: PermissionScope | PermissionAsserter, value?: string): AsyncMethodDecorator {
	if (typeof scopeOrAsserter === 'function') {
		const asserter = scopeOrAsserter;
		return function <This, Args extends any[], Return>(
			originalMethod: (this: This, ...args: Args) => Promise<Return>,
			_context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Promise<Return>>
		): (this: This, ...args: Args) => Promise<Return> {
			const wrapper = async function (this: This, ...args: Args): Promise<Return> {
				const ctx = ModuleBE_PermissionsAssert.createAssertionContext();
				const result = await asserter(ctx, ...args);
				if (!result)
					throw HttpCodes._4XX.FORBIDDEN('Permission assertion failed');

				return originalMethod.call(this, ...args);
			};
			return wrapper;
		};
	}

	const scope = scopeOrAsserter;
	return function <This, Args extends any[], Return>(
		originalMethod: (this: This, ...args: Args) => Promise<Return>,
		_context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Promise<Return>>
	): (this: This, ...args: Args) => Promise<Return> {
		const def = registerFunctionPermission(scope, value!);

		const wrapper = async function (this: This, ...args: Args): Promise<Return> {
			ModuleBE_PermissionsAssert.assertScopePermission(scope, value!);
			return originalMethod.call(this, ...args);
		};

		(wrapper as Function & { [RequirePermissionDefKey]?: FunctionPermissionDef })[RequirePermissionDefKey] = def;
		return wrapper;
	};
}

/**
 * Returns the function-permission def attached to a handler, or undefined.
 * Only set for the simple overload (scope + value).
 */
export function getRequirePermissionDef(handler: ((...args: any[]) => any) | null | undefined): FunctionPermissionDef | undefined {
	if (!handler || typeof handler !== 'function')
		return undefined;
	return (handler as { [RequirePermissionDefKey]?: FunctionPermissionDef })[RequirePermissionDefKey];
}
