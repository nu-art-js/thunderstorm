import {BadImplementationException} from '@nu-art/ts-common';
import type {PermissionScope} from './_entity/permission-scope/brand.js';
import type {PermissionRoleType} from './_entity/permission-role/types.js';


export type RoleScopeEntry = {
	readonly scope: PermissionScope;
	readonly value: string;
};

export type PermissionRoleDefinition = {
	readonly key: string;
	readonly label: string;
	readonly type: PermissionRoleType;
	readonly scopes: readonly RoleScopeEntry[];
};

const roleDefinitionRegistry = new Map<string, PermissionRoleDefinition>();

export function definePermissionRole(def: PermissionRoleDefinition): PermissionRoleDefinition {
	for (const {scope, value} of def.scopes) {
		if (!scope.values.includes(value))
			throw new BadImplementationException(`Invalid value '${value}' for scope '${scope.key}'. Valid values: [${scope.values.join(', ')}]`);
	}

	if (roleDefinitionRegistry.has(def.key))
		throw new BadImplementationException(`Duplicate role definition for key '${def.key}'`);

	const frozen = Object.freeze(def);
	roleDefinitionRegistry.set(def.key, frozen);
	return frozen;
}

export function getRegisteredRoleDefinitions(): PermissionRoleDefinition[] {
	return [...roleDefinitionRegistry.values()];
}
