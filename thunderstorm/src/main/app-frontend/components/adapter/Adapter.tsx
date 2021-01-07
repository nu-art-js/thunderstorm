/*
 * Thunderstorm is a full web app framework!
 *
 * Typescript & Express backend infrastructure that natively runs on firebase function
 * Typescript & React frontend infrastructure
 *
 * Copyright (C) 2020 Intuition Robotics
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
import {_keys,} from "@intuitionrobotics/ts-common";
import {
	SimpleNodeRenderer,
	SimpleTreeNodeRenderer
} from "../tree/SimpleTreeNodeRenderer";
import {
	_BaseNodeRenderer,
	BaseRendererMap,
	NodeRendererProps,
	TreeRendererMap,
} from "./BaseRenderer";
import {TreeNode} from "../tree/types";


export type InferItemType<R> =
	R extends React.ComponentType<{ item: infer Item1, node: TreeNode }> ? Item1 :
		R extends React.ComponentType<{ item: infer Item }> ? Item : "Make sure the Renderer renders the correct item type e.g. (props:{item:Item, node: TreeNode}) => React.ReactNode";

export type FlatItemToRender<Rm extends BaseRendererMap<any>, K extends keyof Rm = keyof Rm, Item = InferItemType<Rm[K]>> = {
	item: Item
	type: K
}

export type ItemToRender<Rm extends BaseRendererMap<any>, K extends keyof Rm = keyof Rm, Item = InferItemType<Rm[K]>> = FlatItemToRender<Rm, K> & {
	_children?: ItemToRender<Rm>[]
}

export type _GenericRenderer<Rm extends BaseRendererMap<any>, ItemType extends ItemToRender<Rm> = ItemToRender<Rm>> = {
	rendererMap: Rm
	items: ItemType[]
}


export class BaseAdapter<T extends any = any, R extends React.ComponentType<T> = React.ComponentType<T>> {

	data: any;

	constructor(data: any) {
		this.data = data
	}

	setData(data: object) {
		this.data = data;
		return this;
	}

	filter<K>(obj: K, key: keyof K) {
		return true;
	}

	getChildren = <K extends object>(obj: K): (keyof K)[] => _keys(obj);
	isParent = (obj: any) => true;

	getFilteredChildren<K extends any>(obj: K): (keyof K)[] | [] {
		if (obj === undefined || obj === null)
			return [];

		if (typeof obj !== "object" && !Array.isArray(obj))
			return [];

		// @ts-ignore
		return this.getChildren(obj).filter((__key) => this.filter(obj, __key))
	}

	adjust(obj: any): { data: any, deltaPath?: string } {
		return {data: obj, deltaPath: ""};
	}

	clone(baseAdapter: this){
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

// type NodeAdjuster = (obj: any) => { data: any; deltaPath?: string };
type NestedType<T extends any = any> = { item: T, _children: NestedObjectOfType<T>[] };
type NestedObjectOfType<T extends any = any> = T | NestedType<T>;

type ListData<I> = I[];
type AdapterData<D> = D | (() => D);

class BaseAdapterBuilder<I, Data> {
	data!: Data;
	treeNodeRenderer!: ComponentType<NodeRendererProps<I>>;
	getChildrenKeys: (obj: any) => (any[]) = (obj: any) => _keys(obj);
	isParent: (obj: any) => (boolean) = (obj: any) => true;
	adjust: ((obj: any) => { data: any; deltaPath: string }) = (obj: any) => ({data: obj, deltaPath: ""});

	setData(data: Data) {
		this.data = data;
		return this;
	}
}

class ListSingleAdapterBuilder<ItemType extends any = any>
	extends BaseAdapterBuilder<ItemType, AdapterData<ListData<ItemType>>> {

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

		this.isParent = (obj: any) => obj === this.data;
	}

	nested() {
		this.getChildrenKeys = (obj: any) => {
			if (typeof obj !== "object")
				return [];

			if (Array.isArray(obj))
				return _keys(obj);

			if (!obj._children)
				return [];

			return ["_children"];
		}

		this.treeNodeRenderer = (props: NodeRendererProps<ItemType>) => {
			const item: NestedObjectOfType<ItemType> = props.item;
			const _Renderer = this.renderer
			return <div id={props.node.path} onClick={props.node.onClick}>
				<_Renderer item={typeof props.item === "object" ? (item as NestedType<ItemType>).item : props.item} node={props.node}/>
			</div>;
		}

		return this as ListSingleAdapterBuilder<NestedObjectOfType<ItemType>>;
	}

	build() {
		const adapter = new Adapter(this.data);
		adapter.hideRoot = true;
		adapter.treeNodeRenderer = this.treeNodeRenderer;
		adapter.getChildren = this.getChildrenKeys
		adapter.isParent = this.isParent
		adapter.adjust = this.adjust
		// @ts-ignore
		adapter.itemRenderer = this.renderer;
		return adapter;
	}
}

class ListMultiAdapterBuilder<Rm extends TreeRendererMap, ItemType extends FlatItemToRender<Rm> = FlatItemToRender<Rm>>
	extends BaseAdapterBuilder<ItemType, AdapterData<ListData<ItemType>>> {

	readonly rendererMap: Rm

	constructor(rendererMap: Rm) {
		super();
		this.rendererMap = rendererMap;
		this.getChildrenKeys = (obj: any) => {
			if (typeof obj !== "object")
				return [];

			if (Array.isArray(obj))
				return _keys(obj);

			if (!obj._children)
				return [];

			return ["_children"];
		}

		this.treeNodeRenderer = (props: NodeRendererProps<ItemType>) => {
			if (props.node.propKey === "_children")
				return null;

			const _Renderer: _BaseNodeRenderer<any> = this.rendererMap[props.item.type];
			return <div id={props.node.path} onClick={props.node.onClick}>
				<_Renderer item={props.item.item} node={props.node}/>
			</div>;
		}
	}


	nested(): ListMultiAdapterBuilder<Rm, ItemToRender<Rm>> {
		return this as unknown as ListMultiAdapterBuilder<Rm, ItemToRender<Rm>>;
	}

	noGeneralOnClick(): ListMultiAdapterBuilder<Rm, ItemToRender<Rm>>{
		this.treeNodeRenderer = (props: NodeRendererProps<ItemType>) => {
			if (props.node.propKey === "_children")
				return null;

			const _Renderer: _BaseNodeRenderer<any> = this.rendererMap[props.item.type];
			return <div id={props.node.path}>
				<_Renderer item={props.item.item} node={props.node}/>
			</div>;
		};
		return this as unknown as ListMultiAdapterBuilder<Rm, ItemToRender<Rm>>;
	}

	build() {
		const adapter = new Adapter(this.data);
		adapter.hideRoot = true;
		adapter.adjust = this.adjust;
		adapter.treeNodeRenderer = this.treeNodeRenderer;
		adapter.getChildren = this.getChildrenKeys
		return adapter;

	}
}

type NestedTreeData<I> = { [k: string]: I | TreeData<I> }
type TreeData<I> = NestedTreeData<I>

class TreeSingleAdapterBuilder<RenderItemType extends any = any>
	extends BaseAdapterBuilder<RenderItemType, AdapterData<TreeData<RenderItemType>>> {

	readonly renderer: _BaseNodeRenderer<RenderItemType>

	constructor(renderer: _BaseNodeRenderer<RenderItemType>) {
		super();
		this.renderer = renderer;
	}

	treeNodeRenderer = (props: NodeRendererProps<RenderItemType>) => {

		const item: RenderItemType = props.item;
		const _Renderer = this.renderer
		return <div id={props.node.path} onClick={props.node.onClick}>
			<_Renderer item={typeof props.item === "object" ? (item as NestedType<RenderItemType>).item : props.item} node={props.node}/>
		</div>;
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

					<SimpleNodeRenderer {...props}/>
				</div>
			</div>);
		}

		return adapter;
	}
}


class ListAdapterBuilder {

	singleRender<Item>(renderer: _BaseNodeRenderer<Item>) {
		return new ListSingleAdapterBuilder<Item>(renderer);
	}

	multiRender<Rm extends TreeRendererMap>(rendererMap: Rm) {
		return new ListMultiAdapterBuilder<Rm>(rendererMap);
	}
}

class TreeAdapterBuilder {


	singleRender<Item>(renderer: _BaseNodeRenderer<Item>) {
		return new TreeSingleAdapterBuilder<Item>(renderer);
	}

	// multiRender<Rm extends RendererMap>(rendererMap: Rm) {
	// 	return new TreeMultiAdapterBuilder<Rm>(rendererMap);
	// }
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