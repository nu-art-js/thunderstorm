import { DBEntityDependencies } from '@nu-art/thunder-db-api-shared';
import { ConflictResolutionTree } from './types.js';
import { DBProto, RuntimeModules, StaticLogger, UniqueId, _keys } from '@nu-art/ts-common';
import { ModuleFE_BaseDB } from "@nu-art/thunder-routing";
const getItem = (dbKey: string, itemId: UniqueId): DBProto<any>['dbType'] | undefined => {
    const module = RuntimeModules().filter(module => (module as ModuleFE_BaseDB<any>).dbDef?.dbKey === dbKey)[0] as ModuleFE_BaseDB<any>;
    if (!module) {
        StaticLogger.logWarning(`Could not get module for dbKey ${dbKey}`);
        return;
    }
    const item = module.cache.unique(itemId) as DBProto<any>['dbType'] | undefined;
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
        item: { itemId, dbKey, item },
        alwaysExpanded: false,
        _children: conflictingCollectionKeys.map(dbKey => calculateConflictResolutionTree_ConflictingCollection(dbKey, dependencyMap[itemId][dbKey])),
    };
};
const calculateConflictResolutionTree_ConflictingCollection = (dbKey: string, conflictingItemIds: UniqueId[]): ConflictResolutionTree['nodeType'] => {
    return {
        type: 'conflictingCollection',
        item: { dbKey },
        alwaysExpanded: false,
        _children: conflictingItemIds.map(id => calculateConflictResolutionTree_ConflictingItem(dbKey, id))
    };
};
const calculateConflictResolutionTree_ConflictingItem = (dbKey: string, itemId: UniqueId): ConflictResolutionTree['nodeType'] => {
    const item = getItem(dbKey, itemId);
    return {
        type: 'conflictingItem',
        item: { dbKey, itemId, item },
        alwaysExpanded: false,
    };
};
