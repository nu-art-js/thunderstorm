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

import * as React from "react";
import {ComponentType} from "react";
import {_keys,} from "@nu-art/ts-common";
import {SimpleTreeNodeRenderer} from "../tree/SimpleTreeNodeRenderer";
import {_BaseNodeRenderer, BaseRendererMap, NodeRendererProps, TreeRendererMap,} from "./BaseRenderer";
import {TreeNode} from "../tree/types";


export type InferItemType<R> =
	R extends React.ComponentType<{ item: infer Item, node: TreeNode }> ? Item :
		"Make sure the Renderer renders the correct item type e.g. (props:{item:Item, node: TreeNode}) => React.ReactNode";

// export type TreeItem<Rm extends BaseRendererMap<any>, K extends keyof Rm = keyof Rm, Item = InferItemType<Rm[K]>> = {
// 	item: Item
// 	type: K
// 	_children?: ItemToRender<Rm>[]
// }
//
// export type ItemToRender<Rm extends BaseRendererMap<any>, K extends keyof Rm = keyof Rm, Item = InferItemType<Rm[K]>> = TreeItem<Rm, K> & {
// 	_children?: ItemToRender<Rm>[]
// }

export type _GenericRenderer<Rm extends BaseRendererMap<any>, ItemType extends InferItemType<Rm[keyof Rm]> = InferItemType<Rm[keyof Rm]>> = {
	rendererMap: Rm
	items: ItemType[]
}

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
export type TreeItem<I> = ListItem<I> & {
	type: string
	_children?: TreeItem<I>[]
}

// the moment we want to have a TREE with multiple item types
export type TreeData_MultiType<Rm extends BaseRendererMap<any>, I extends InferItemType<Rm[keyof Rm]> = InferItemType<Rm[keyof Rm]>> =
	TreeItem<I>
	| TreeData<TreeItem<I>>


// type NodeAdjuster = (obj: any) => { data: any; deltaPath?: string };
// type NestedType<T extends any = any> = { item: T, _children: NestedObjectOfType<T>[] };
// type NestedObjectOfType<T extends any = any> = T | NestedType<T>;

type AdapterData<D> = D | (() => D);

export class BaseAdapter<T extends any = any, R extends React.ComponentType<T> = React.ComponentType<T>> {

	data: any;
	childrenKey?: string;

	constructor(data: any) {
		this.data = data
	}

	setData(data: object) {
		this.data = data;
		return this;
	}

	filter = <K extends any>(obj: K, key: keyof K) => true;

	// by default all objects and arrays are parents
	isParent = (obj: any) => {
		if (!this.childrenKey)
			return Array.isArray(obj) || typeof obj === "object";

		return typeof obj === "object" && obj["_isParent"] === true || Array.isArray(obj);
	};

	// this can be gone.. and builders must use the new filterChildren
	getFilteredChildren<K extends object>(obj: K): (keyof K)[] | [] {
		if (obj === undefined || obj === null)
			return [];

		if (typeof obj !== "object")
			return [];

		if (Array.isArray(obj))
			return _keys(obj);

		if (!this.childrenKey)
			return _keys(obj).filter(k => this.filter(obj, k));

		if (!obj[this.childrenKey as keyof K])
			return [];

		return _keys(obj[this.childrenKey as keyof K] as any) as (keyof K)[];
	}

	// this to allow us to navigate and skip into nested items in an object without changing the object
	// adjust = (obj: any): { data: any; deltaPath: string } => this.adjustImpl(obj, "_children");
	adjust: ((obj: any) => { data: any; deltaPath: string }) = (obj: any) => {
		if (!this.childrenKey)
			return ({data: obj, deltaPath: ""});

		if (!obj[this.childrenKey])
			return {data: obj, deltaPath: ""};

		const objElement: any = {...obj[this.childrenKey], type: obj.type, item: obj.item, _isParent: true};
		return {data: objElement, deltaPath: this.childrenKey || ""};
	}

	clone(baseAdapter: this) {
		_keys(this).forEach(k => {
			baseAdapter[k] = this[k]
		});
		return baseAdapter
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

class BaseAdapterBuilder<Data> {
	data!: Data;
	treeNodeRenderer!: ComponentType<NodeRendererProps>;

	protected filter = <K extends any>(obj: K, key: keyof K) => true;
	childrenKey?: string;

	setData(data: Data) {
		this.data = data;
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
}

class ListSingleAdapterBuilder<ItemType extends any = any>
	extends BaseAdapterBuilder<AdapterData<ListData<ItemType>>> {

	readonly renderer: _BaseNodeRenderer<ItemType>

	constructor(renderer: _BaseNodeRenderer<ItemType>) {
		super();
		this.renderer = renderer;
		this.treeNodeRenderer = (props: NodeRendererProps<ItemType>) => {
			const _Renderer = this.renderer
			return <div id={props.node.path} onClick={props.node.onClick}>
				<_Renderer item={props.item} node={props.node}/>
			</div>;
		}

	}

	nested() {
		this.childrenKey = "_children";
		this.treeNodeRenderer = (props: NodeRendererProps<ItemType>) => {
			const _Renderer = this.renderer
			return <div id={props.node.path} onClick={props.node.onClick}>
				<_Renderer {...props}/>
			</div>;
		}

		return this as ListSingleAdapterBuilder<NestedListData<ItemType>>;
	}

	build() {
		const adapter = new Adapter(this.data);
		adapter.hideRoot = true;
		adapter.treeNodeRenderer = this.treeNodeRenderer;
		adapter.childrenKey = this.childrenKey;
		adapter.isParent = (obj: any) => obj === this.data
		// @ts-ignore
		adapter.itemRenderer = this.renderer;
		return adapter;
	}
}

class MultiTypeAdapterBuilder<Rm extends TreeRendererMap, DataType>
	extends BaseAdapterBuilder<DataType> {

	readonly rendererMap: Rm
	private hideRoot = true;

	constructor(rendererMap: Rm) {
		super();
		this.rendererMap = rendererMap;
		this.childrenKey = "_children";

		this.treeNodeRenderer = (props: NodeRendererProps<TreeItem<any>>) => {
			if (props.node.propKey === "_children")
				return null;

			const _Renderer: _BaseNodeRenderer<any> = this.rendererMap[props.item.type];
			return <div id={props.node.path} onClick={props.node.onClick}>
				<_Renderer item={props.item.item} node={props.node}/>
			</div>;
		}
	}

	tree() {
		this.treeNodeRenderer = this.defaultTreeNodeRenderer
		this.hideRoot = false;
		return this as unknown as MultiTypeAdapterBuilder<Rm, DataType>;
	}

	noGeneralOnClick(): MultiTypeAdapterBuilder<Rm, DataType> {
		this.treeNodeRenderer = (props: NodeRendererProps<TreeItem<any>>) => {
			if (props.node.propKey === "_children")
				return null;

			const _Renderer: _BaseNodeRenderer<any> = this.rendererMap[props.item.type];
			return <div id={props.node.path}>
				<_Renderer item={props.item.item} node={props.node}/>
			</div>;
		};
		return this as unknown as MultiTypeAdapterBuilder<Rm, DataType>;
	}

	private defaultTreeNodeRenderer = (props: NodeRendererProps) => {
		const renderCollapse = () => {
			let toDisplay;
			if (typeof props.item !== "object")
				toDisplay = "";
			else if (Object.keys(props.item).length === 0)
				toDisplay = "";
			else if (props.node.adapter.isParent(props.item)) {
				if (props.node.expanded)
					toDisplay = "-";
				else
					toDisplay = "+";
			}

			return <div
				className={`clickable`}
				id={props.node.path}
				onClick={props.node.expandToggler}
				style={{width: "15px"}}>
				{toDisplay}
			</div>
		}


		const _Renderer: _BaseNodeRenderer<any> = this.rendererMap[props.item.type];
		return (<div className="ll_h_c">
			{renderCollapse()}
			<div
				id={props.node.path}
				className='clickable'
				onClick={props.node.onClick}
				style={{backgroundColor: props.node.focused ? "red" : "salmon", userSelect: "none"}}>

				<_Renderer item={props.item.item} node={props.node}/>
			</div>
		</div>);
	}

	build() {
		const adapter = new Adapter(this.data);
		adapter.hideRoot = this.hideRoot;
		adapter.treeNodeRenderer = this.treeNodeRenderer;
		adapter.childrenKey = this.childrenKey;
		return adapter;

	}
}

abstract class TreeBaseAdapterBuilder<Data>
	extends BaseAdapterBuilder<Data> {


}

class TreeSingleAdapterBuilder<RenderItemType extends any = any>
	extends TreeBaseAdapterBuilder<AdapterData<TreeData<RenderItemType>>> {

	readonly renderer: _BaseNodeRenderer<RenderItemType>

	constructor(renderer: _BaseNodeRenderer<RenderItemType>) {
		super();
		this.renderer = renderer;
	}

	build() {
		const adapter = new Adapter(this.data);
		adapter.treeNodeRenderer = (props: NodeRendererProps) => {
			const renderCollapse = () => {
				let toDisplay;
				if (typeof props.item !== "object")
					toDisplay = "";
				else if (Object.keys(props.item).length === 0)
					toDisplay = "";
				else if (props.node.expanded)
					toDisplay = "-";
				else
					toDisplay = "+";

				return <div
					className={`clickable`}
					id={props.node.path}
					onClick={props.node.expandToggler}
					style={{width: "15px"}}>
					{toDisplay}
				</div>
			}

			return (<div className="ll_h_c">
				{renderCollapse()}
				<div
					id={props.node.path}
					className='clickable'
					onClick={props.node.onClick}
					style={{backgroundColor: props.node.focused ? "red" : "salmon", userSelect: "none"}}>

					<this.renderer {...props}/>
				</div>
			</div>);
		}
		;
		return adapter;
	}
}

class ListAdapterBuilder {

	singleRender<Item>(renderer: _BaseNodeRenderer<Item>) {
		return new ListSingleAdapterBuilder<Item>(renderer);
	}

	multiRender<Rm extends TreeRendererMap, ItemType extends TreeData_MultiType<Rm> = TreeData_MultiType<Rm>>(rendererMap: Rm) {
		return new MultiTypeAdapterBuilder<Rm, ListData<ItemType>>(rendererMap);
	}
}

class TreeAdapterBuilder {


	singleRender<Item>(renderer: _BaseNodeRenderer<Item>) {
		return new TreeSingleAdapterBuilder<Item>(renderer);
	}

	multiRender<Rm extends TreeRendererMap, ItemType extends TreeItem<Rm> = TreeItem<Rm>>(rendererMap: Rm) {
		return new MultiTypeAdapterBuilder<Rm, TreeData_MultiType<ItemType>>(rendererMap).tree();
	}
}

class MainAdapterBuilder {

	list() {
		return new ListAdapterBuilder();
	}

	tree() {
		return new TreeAdapterBuilder();
	}
}

export function AdapterBuilder() {
	return new MainAdapterBuilder();
}
