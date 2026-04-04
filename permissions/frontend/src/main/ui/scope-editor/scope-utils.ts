/*
 * Scope derivation and resolution utilities.
 * Used by Component_ScopeListEditor and any read-only scope display.
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {sortArray} from '@nu-art/ts-common';
import type {DatabaseDef_PermissionScope, DB_PermissionScope} from '@nu-art/permissions-shared';
import {getPermissionScopeValues} from '@nu-art/permissions-shared';
import {ModuleFE_PermissionScope} from '../../_entity.js';


export type ScopeDescriptor = { key: string; values: string[] };

export function deriveScopeStructure(): ScopeDescriptor[] {
	const entities = ModuleFE_PermissionScope.cache.all();
	const scopeKeys = new Set(entities.map(e => e.key));

	return sortArray([...scopeKeys].map(key => {
		const definedValues = getPermissionScopeValues(key);
		if (definedValues)
			return {key, values: [...definedValues]};

		return {key, values: entities.filter(e => e.key === key).map(e => e.value)};
	}), d => d.key);
}

export function resolveScopeSelections(
	scopeEntries: DatabaseDef_PermissionScope['id'][],
	scopes?: ScopeDescriptor[],
	scopeEntities?: DB_PermissionScope[]
): Record<string, string> {
	scopes ??= deriveScopeStructure();
	scopeEntities ??= ModuleFE_PermissionScope.cache.all();
	const entryIds = new Set(scopeEntries as string[]);
	const selections: Record<string, string> = {};

	for (const scope of scopes) {
		let maxIdx = -1;
		for (const entity of scopeEntities) {
			if (entity.key !== scope.key || !entryIds.has(entity._id as string))
				continue;

			const idx = scope.values.indexOf(entity.value);
			if (idx > maxIdx)
				maxIdx = idx;
		}

		if (maxIdx >= 0)
			selections[scope.key] = scope.values[maxIdx];
	}

	return selections;
}
