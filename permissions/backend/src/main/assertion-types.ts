import type {PermissionScope} from '@nu-art/permissions-shared';
import type {DBPointer} from '@nu-art/ts-common';

export type PermissionAssertionContext = {
	readonly hasScope: (scope: PermissionScope, value: string) => boolean;
	readonly ownsEntity: (pointer: DBPointer) => Promise<boolean>;
	readonly and: (...predicates: (boolean | Promise<boolean>)[]) => Promise<boolean>;
	readonly or: (...predicates: (boolean | Promise<boolean>)[]) => Promise<boolean>;
};

export type PermissionAsserter = (assert: PermissionAssertionContext, ...args: any[]) => boolean | Promise<boolean>;
