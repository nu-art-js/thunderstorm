import {BadImplementationException} from '@nu-art/ts-common';
import type {PermissionScope} from './_entity/permission-scope/brand.js';


export type GroupScopeEntry = {
	readonly scope: PermissionScope;
	readonly value: string;
};

export type AccessGroupDefinition = {
	readonly key: string;
	readonly label: string;
	readonly scopes: readonly GroupScopeEntry[];
	readonly memberKeys?: readonly string[];
	readonly scopeKey?: string;
};

const groupDefinitionRegistry = new Map<string, AccessGroupDefinition>();

export function defineAccessGroup(def: AccessGroupDefinition): AccessGroupDefinition {
	for (const {scope, value} of def.scopes) {
		if (!scope.values.includes(value))
			throw new BadImplementationException(`Invalid value '${value}' for scope '${scope.key}'. Valid values: [${scope.values.join(', ')}]`);
	}

	if (groupDefinitionRegistry.has(def.key))
		throw new BadImplementationException(`Duplicate access group definition for key '${def.key}'`);

	if (def.memberKeys?.includes(def.key))
		throw new BadImplementationException(`Access group '${def.key}' cannot reference itself as a member`);

	const frozen = Object.freeze(def);
	groupDefinitionRegistry.set(def.key, frozen);
	return frozen;
}

export function getRegisteredGroupDefinitions(): AccessGroupDefinition[] {
	return [...groupDefinitionRegistry.values()];
}
