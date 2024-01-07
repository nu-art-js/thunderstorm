/*
 * Thunderstorm is a full web app framework!
 *
 * Typescript & Express backend infrastructure that natively runs on firebase function
 * Typescript & React frontend infrastructure
 *
 * Copyright (C) 2020 Adam van der Kruk aka TacB0sS
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as React from 'react';
import {ComponentType} from 'react';
import {_keys, BadImplementationException, TS_Object,} from '@nu-art/ts-common';
import {SimpleTreeNodeRenderer} from '../TS_Tree/SimpleTreeNodeRenderer';
import {_BaseNodeRenderer, NodeRendererProps,} from './BaseRenderer';
import {_className} from '../../utils/tools';

// export type TreeItem<Rm extends BaseRendererMap<any>, K extends keyof Rm = keyof Rm, Item = InferItemType<Rm[K]>> = {
// 	item: Item
// 	type: K
// 	_children?: ItemToRender<Rm>[]
// }
//
// export type ItemToRender<Rm extends BaseRendererMap<any>, K extends keyof Rm = keyof Rm, Item = InferItemType<Rm[K]>> = TreeItem<Rm, K> & {
// 	_children?: ItemToRender<Rm>[]
// }
export type TreeNode = {
	propKey: string
	item: any
	adapter: Adapter
	expandToggler: (e: React.MouseEvent, expand?: boolean) => void
	expanded: boolean,
};

// Simple LIST is an array of item of type T
export type ListData<I> = I[];

// the moment we want to have a nested LIST of a single item of type T
export type ListItem<I> = {
	item: I
	_children?: ListItem<I>[]
}

export type NestedListItem<I> = {
	item: I
	_children?: NestedListData<I>[]
}

export type NestedListData<I> = I | NestedListItem<I>;

// Simple TREE with simple key as string and single item of type T
export type TreeData<I> = { [k: string]: I | TreeData<I> }

// the moment we want to have a TREE of a single item of type T
type TreeItem<TreeMap> = { [K in keyof TreeMap]: { type: K; item: TreeMap[K], _children?: TreeItem<TreeMap>[] } }[keyof TreeMap];

export type TreeType<TreeMap> = {
	map: TreeMap
	action: { [K in keyof TreeMap]: (item: TreeMap[K]) => Promise<any> | any }
	nodeRenderer: { [K in keyof TreeMap]: React.ComponentType<NodeRendererProps<TreeMap[K]>> }
	renderer: { [K in keyof TreeMap]: React.ComponentType<{ item: TreeMap[K] }> }

	rendererV3: { [K in keyof TreeMap]: React.ComponentType<TreeMap[K]> }

	nodeType: TreeItem<TreeMap>
}
type AdapterData<D> = D | (() => D);

export class BaseAdapter<T extends any = any, R extends React.ComponentType<T> = React.ComponentType<T>> {

	data: any;
	childrenKey?: string;

	constructor(data: any) {
		this.data = data;
	}

	setData(data: object) {
		this.data = data;
		return this;
	}

	filter = <K extends any>(obj: K, key: keyof K) => true;

	// by default all objects and arrays are parents
	isParent = (obj: any) => {
		if (obj === undefined || obj === null)
			return false;

		if (!this.childrenKey)
			return Array.isArray(obj) || typeof obj === 'object';

		return typeof obj === 'object' && obj['_isParent'] === true || Array.isArray(obj);
	};

	hadChildren = (obj: any) => {
		if (!this.isParent(obj))
			return false;

		return obj['length'] > 0;
	};

	// this can be gone.. and builders must use the new filterChildren
	getFilteredChildren<K extends TS_Object>(obj: K): (keyof K)[] | [] {
		if (obj === undefined || obj === null)
			return [];

		if (typeof obj !== 'object')
			return [];

		if (Array.isArray(obj))
			return _keys(obj);

		if (!this.childrenKey)
			return _keys(obj).filter(k => this.filter(obj, k));

		const objElement = obj[this.childrenKey as keyof K];
		if (!objElement)
			return [];

		return _keys(objElement) as unknown as (keyof K)[];
	}

	// this to allow us to navigate and skip into nested items in an object without changing the object
	// adjust = (obj: any): { data: any; deltaPath: string } => this.adjustImpl(obj, "_children");
	adjust: ((obj: any) => { data: any; deltaPath: string }) = (obj: any) => {
		if (!this.childrenKey)
			return ({data: obj, deltaPath: ''});

		if (!obj[this.childrenKey])
			return {data: obj, deltaPath: ''};

		const objElement: any = {...obj[this.childrenKey], type: obj.type, item: obj.item, _isParent: true, length: obj[this.childrenKey].length};
		return {data: objElement, deltaPath: this.childrenKey || ''};
	};

	clone(baseAdapter: this) {
		_keys(this).forEach(k => {
			baseAdapter[k] = this[k];
		});
		return baseAdapter;
	}
}

export class Adapter<T extends any = any, I extends NodeRendererProps<T> = NodeRendererProps<T>>
	extends BaseAdapter<I> {

	hideRoot: boolean = false;
	treeNodeRenderer: _BaseNodeRenderer<any> = SimpleTreeNodeRenderer;

	setTreeNodeRenderer(renderer: any) {
		this.treeNodeRenderer = renderer;
		return this;
	}

	public resolveRenderer(propKey: string): _BaseNodeRenderer<I> {
		return (pah: any) => null;
	}
}

abstract class BaseAdapterBuilder<Data> {
	data!: Data;
	treeNodeRenderer!: ComponentType<NodeRendererProps>;
	multiRenderer = false;
	expandCollapseRenderer: ComponentType<NodeRendererProps>;

	protected filter = <K extends any>(obj: K, key: keyof K) => true;
	childrenKey?: string;

	constructor() {
		this.expandCollapseRenderer = this.defaultExpandCollapseRenderer;
	}

	setData(data: Data) {
		this.data = data;
		return this;
	}

	setNodeRenderer(treeNodeRenderer: ComponentType<NodeRendererProps>) {
		this.treeNodeRenderer = treeNodeRenderer;
		return this;
	}

	setExpandCollapseRenderer(expandCollapseRenderer: ComponentType<NodeRendererProps>) {
		this.expandCollapseRenderer = expandCollapseRenderer;
		return this;
	}

	// Utility - move to builder
	setChildrenKey = (childrenKey: string) => {
		this.childrenKey = childrenKey;
		return this;
	};

	setFilter(filter: <K extends any>(obj: K, key: keyof K) => boolean) {
		this.filter = filter;
	}

	protected defaultExpandCollapseRenderer = (props: NodeRendererProps) => {
		function resolveSymbol() {

			if (typeof props.item !== 'object')
				return '';

			if (Object.keys(props.item).length === 0)
				return '';

			if (props.node.adapter.isParent(props.item)) {
				if (props.node.expanded)
					return '-';

				return '+';
			}

			return '';
		}

		const className = _className('node-icon', props.node.expanded ? 'expanded' : undefined);
		return <div className={className} style={{minWidth: '12px'}}>{resolveSymbol()}</div>;
	};

	protected defaultTreeNodeRenderer = (props: NodeRendererProps) => {
		const _Renderer: _BaseNodeRenderer<any> = this.resolveRenderer(props.item.type);
		return (
			<div className="ll_h_c clickable"
					 onClick={props.node.expandToggler}>

				<this.expandCollapseRenderer {...props}/>
				<_Renderer item={this.multiRenderer ? props.item.item : props.item} node={props.node}/>
			</div>
		);
	};

	protected abstract resolveRenderer(type: string): _BaseNodeRenderer<any>;

}

class ListSingleAdapterBuilder<ItemType extends any = any>
	extends BaseAdapterBuilder<AdapterData<ListData<ItemType>>> {

	readonly renderer: _BaseNodeRenderer<ItemType>;

	constructor(renderer: _BaseNodeRenderer<ItemType>) {
		super();
		this.renderer = renderer;
		this.treeNodeRenderer = (props: NodeRendererProps<ItemType>) => {
			const _Renderer = this.resolveRenderer();
			return <_Renderer item={props.item} node={props.node}/>;
		};

	}

	protected resolveRenderer(type?: string): _BaseNodeRenderer<any> {
		return this.renderer;
	}

	nested() {
		this.childrenKey = '_children';
		this.treeNodeRenderer = (props: NodeRendererProps<ItemType>) => {
			const _Renderer = this.renderer;
			return <_Renderer {...props}/>;
		};

		return this as ListSingleAdapterBuilder<NestedListData<ItemType>>;
	}

	build() {
		const adapter = new Adapter(this.data);
		adapter.hideRoot = true;
		adapter.treeNodeRenderer = this.treeNodeRenderer;
		adapter.childrenKey = this.childrenKey;
		adapter.isParent = (obj: any) => obj === this.data;
		// @ts-ignore
		adapter.itemRenderer = this.renderer;
		return adapter;
	}
}

class MultiTypeAdapterBuilder<TreeMap extends TreeType<any>>
	extends BaseAdapterBuilder<TreeMap['nodeType']> {

	readonly rendererMap: TreeMap['nodeRenderer'];
	private _hideRoot = true;

	constructor(rendererMap: TreeMap['nodeRenderer']) {
		super();
		this.multiRenderer = true;
		this.rendererMap = rendererMap;
		this.childrenKey = '_children';

		this.treeNodeRenderer = (props: NodeRendererProps<TreeItem<any>>) => {
			const _Renderer: _BaseNodeRenderer<any> = this.resolveRenderer(props.item.type as string);
			return <_Renderer item={props.item.item} node={props.node}/>;
		};
	}

	protected resolveRenderer = (type?: string): _BaseNodeRenderer<any> => {
		if (!type)
			throw new BadImplementationException('multi renderer adapter items must have a type to resolve renderer');

		const renderer = this.rendererMap[type];
		if (!renderer)
			throw new BadImplementationException(`renderer of type ${type} doesn't exists, in rendererMap found keys: ${JSON.stringify(_keys(this.rendererMap))}`);

		return renderer;
	};

	tree() {
		this.treeNodeRenderer = this.defaultTreeNodeRenderer;
		this._hideRoot = false;
		return this as unknown as MultiTypeAdapterBuilder<TreeMap>;
	}

	hideRoot() {
		this._hideRoot = true;
		return this;
	}

	build() {
		const adapter = new Adapter(this.data);
		adapter.hideRoot = this._hideRoot;
		adapter.treeNodeRenderer = this.treeNodeRenderer;
		adapter.resolveRenderer = this.resolveRenderer;
		adapter.childrenKey = this.childrenKey;
		return adapter;

	}
}

class TreeSingleAdapterBuilder<RenderItemType extends any = any>
	extends BaseAdapterBuilder<AdapterData<TreeData<RenderItemType>>> {

	readonly renderer: _BaseNodeRenderer<RenderItemType>;
	private _hideRoot = false;

	constructor(renderer: _BaseNodeRenderer<RenderItemType>) {
		super();
		this.renderer = renderer;
		this.treeNodeRenderer = this.defaultTreeNodeRenderer;
	}

	protected resolveRenderer(type?: string): _BaseNodeRenderer<any> {
		return this.renderer;
	}

	hideRoot() {
		this._hideRoot = true;
		return this;
	}

	build() {
		const adapter = new Adapter(this.data);
		adapter.treeNodeRenderer = this.treeNodeRenderer;
		adapter.hideRoot = this._hideRoot;
		return adapter;
	}
}

class ListAdapterBuilder {

	singleRender<Item>(renderer: _BaseNodeRenderer<Item>) {
		return new ListSingleAdapterBuilder<Item>(renderer);
	}

	multiRender<TreeMap extends TreeType<any>>(rendererMap: TreeMap['nodeRenderer']) {
		return new MultiTypeAdapterBuilder<TreeMap>(rendererMap);
	}

	multiRenderV3<TreeMap extends TreeType<any>>(rendererMap: TreeMap['nodeRenderer']) {
		return new MultiTypeAdapterBuilder<TreeMap>(rendererMap);
	}
}

class TreeAdapterBuilder {

	singleRender<Item>(renderer: _BaseNodeRenderer<Item>) {
		return new TreeSingleAdapterBuilder<Item>(renderer);
	}

	multiRender<TreeMap extends TreeType<any>>(rendererMap: TreeMap['nodeRenderer']) {
		return new MultiTypeAdapterBuilder<TreeMap>(rendererMap).tree();
	}
}

class _AdapterBuilder {

	list() {
		return new ListAdapterBuilder();
	}

	tree() {
		return new TreeAdapterBuilder();
	}
}

export function AdapterBuilder() {
	return new _AdapterBuilder();
}

export function SimpleTreeAdapter<T>(options: TreeData<T>, renderer: (node: NodeRendererProps<T>) => React.ReactElement) {
	return AdapterBuilder()
		.tree()
		.singleRender(renderer)
		.setData(options)
		.build();
}

export function SimpleListAdapter<T>(options: T[], renderer: (node: NodeRendererProps<T>) => React.ReactElement) {
	return AdapterBuilder()
		.list()
		.singleRender(renderer)
		.setData(options)
		.build();
}

