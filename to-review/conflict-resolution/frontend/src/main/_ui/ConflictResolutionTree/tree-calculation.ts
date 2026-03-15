/*
 * @nu-art/conflict-resolution-frontend - Conflict resolution tree calculation
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import type {DBEntityDependencies} from '@nu-art/conflict-resolution-shared';
import {ConflictResolutionTree} from './types.js';
import {DB_Prototype} from '@nu-art/db-api-shared';
import {RuntimeModules, StaticLogger, UniqueId, _keys} from '@nu-art/ts-common';
import type {ModuleFE_BaseDB} from '@nu-art/db-api-frontend';

const getItem = (dbKey: string, itemId: UniqueId): DB_Prototype['dbType'] | undefined => {
	const module = RuntimeModules().filter(m => (m as ModuleFE_BaseDB<any>).config?.dbKey === dbKey)[0] as ModuleFE_BaseDB<any>;
	if (!module) {
		StaticLogger.logWarning(`Could not get module for dbKey ${dbKey}`);
		return;
	}

	const item = module.cache.unique(itemId) as DB_Prototype['dbType'] | undefined;
	if (!item)
		StaticLogger.logWarning(`Could not get item for dbKey ${dbKey} and id ${itemId}`);
	return item;
};

export const calculateConflictResolutionTree = (dependencies: DBEntityDependencies): ConflictResolutionTree['nodeType'] => {
	const checkedItemIds = _keys(dependencies.dependencyMap) as UniqueId[];
	return {
		type: 'root',
		alwaysExpanded: true,
		item: {},
		_children: checkedItemIds.map(id => calculateConflictResolutionTree_CheckedItem(dependencies.dependencyMap, id, dependencies.dbKey)),
	};
};

const calculateConflictResolutionTree_CheckedItem = (dependencyMap: DBEntityDependencies['dependencyMap'], itemId: UniqueId, dbKey: string): ConflictResolutionTree['nodeType'] => {
	const conflictingCollectionKeys = _keys(dependencyMap[itemId]) as string[];
	const item = getItem(dbKey, itemId);
	return {
		type: 'checkedItem',
		item: {itemId, dbKey, item},
		alwaysExpanded: false,
		_children: conflictingCollectionKeys.map(dbKey => calculateConflictResolutionTree_ConflictingCollection(dbKey, dependencyMap[itemId][dbKey])),
	};
};

const calculateConflictResolutionTree_ConflictingCollection = (dbKey: string, conflictingItemIds: UniqueId[]): ConflictResolutionTree['nodeType'] => {
	return {
		type: 'conflictingCollection',
		item: {dbKey},
		alwaysExpanded: false,
		_children: conflictingItemIds.map(id => calculateConflictResolutionTree_ConflictingItem(dbKey, id))
	};
};

const calculateConflictResolutionTree_ConflictingItem = (dbKey: string, itemId: UniqueId): ConflictResolutionTree['nodeType'] => {
	const item = getItem(dbKey, itemId);
	return {
		type: 'conflictingItem',
		item: {dbKey, itemId, item},
		alwaysExpanded: false,
	};
};