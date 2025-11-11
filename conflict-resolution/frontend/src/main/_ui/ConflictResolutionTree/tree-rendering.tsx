import * as React from 'react';
import {ConflictResolutionTree_RendererMap, ConflictResolutionTree_RendererProps} from './types.js';
import {ConflictResolutionItem} from '@nu-art/conflict-resolution-shared';
import {TypedMap} from '@nu-art/ts-common';
import {Label, ModuleFE_Thunderstorm} from '@nu-art/thunderstorm/frontend/index';

const renderTreeNode_CheckedItem = (props: ConflictResolutionTree_RendererProps<'checkedItem'>, map: TypedMap<ConflictResolutionItem<any>>) => {
	const crItem = map[props.item.dbKey];
	let content: React.ReactNode;
	if (!crItem || !props.item.item)
		content = props.item.itemId;
	else
		content = crItem.renderer(props.item.item) ?? props.item.itemId;
	return <Label
		className={'conflict-resolution-tree__checked-item'}
		tooltip={content}
	>{content}</Label>;
};

const renderTreeNode_ConflictingCollection = (props: ConflictResolutionTree_RendererProps<'conflictingCollection'>, map: TypedMap<ConflictResolutionItem<any>>) => {
	const crItem = map[props.item.dbKey];
	if (!crItem)
		return <>{props.item.dbKey}</>;

	return <>{crItem.collectionRenderer(props.item.dbKey)}</>;
};

const renderTreeNode_ConflictingItem = (props: ConflictResolutionTree_RendererProps<'conflictingItem'>, map: TypedMap<ConflictResolutionItem<any>>) => {
	const crItem = map[props.item.dbKey];
	let content: React.ReactNode;
	if (!crItem || !props.item.item)
		content = props.item.itemId;
	else
		content = crItem.renderer(props.item.item) ?? props.item.itemId;
	return <Label
		className={'conflict-resolution-tree__conflicting-item'}
		tooltip={content}
		onClick={() => ModuleFE_Thunderstorm.copyToClipboard(props.item.itemId)}
	>{content}</Label>;
};

export const ConflictResolutionTreeRenderers = (map: TypedMap<ConflictResolutionItem<any>>): ConflictResolutionTree_RendererMap => ({
	root: () => <></>,
	checkedItem: (props) => renderTreeNode_CheckedItem(props, map),
	conflictingCollection: (props) => renderTreeNode_ConflictingCollection(props, map),
	conflictingItem: (props) => renderTreeNode_ConflictingItem(props, map),
});