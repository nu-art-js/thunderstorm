import {Primitive} from '@nu-art/ts-common';
import {TreeType} from '../../adapter/Adapter.js';

export type TS_JSONViewer_Tree_Item = {
	key: string;
	value: Object | Primitive
}

export type TS_JSONViewer_Tree = TreeType<{
	root: any;
	item: TS_JSONViewer_Tree_Item;
}>