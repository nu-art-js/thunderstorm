/*
 * @nu-art/conflict-resolution-frontend - Conflict resolution tree types
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import * as React from 'react';
import {TreeNode, TreeType} from '@nu-art/thunder-widgets';
import {DB_Prototype} from '@nu-art/db-api-shared';
import {UniqueId} from '@nu-art/ts-common';

type Props_CheckedItem = {
	itemId: UniqueId;
	dbKey: string;
	item?: DB_Prototype['dbType'];
};

type Props_ConflictingCollection = {
	dbKey: string;
};

type Props_ConflictingItem = {
	itemId: UniqueId;
	dbKey: string;
	item?: DB_Prototype['dbType'];
};

type ConflictResolutionTree_Map = {
	root: {};
	checkedItem: Props_CheckedItem;
	conflictingCollection: Props_ConflictingCollection;
	conflictingItem: Props_ConflictingItem;
}

export type ConflictResolutionTree = TreeType<ConflictResolutionTree_Map>;
export type ConflictResolutionTree_RendererProps<K extends keyof ConflictResolutionTree['renderer']> = { item: ConflictResolutionTree_Map[K], node: TreeNode };
export type ConflictResolutionTree_RendererMap = { [K in keyof ConflictResolutionTree['renderer']]: React.ComponentType<ConflictResolutionTree_RendererProps<K>> }