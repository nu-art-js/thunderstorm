import * as React from 'react';
import {TreeNode, TreeType} from '@nu-art/thunderstorm/frontend';
import {DBProto, UniqueId} from '@nu-art/ts-common';

type Props_CheckedItem = {
	itemId: UniqueId;
	dbKey: string;
	item?: DBProto<any>['dbType'];
};

type Props_ConflictingCollection = {
	dbKey: string;
};

type Props_ConflictingItem = {
	itemId: UniqueId;
	dbKey: string;
	item?: DBProto<any>['dbType'];
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