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
import {_keys,} from "@nu-art/ts-common";
import {TreeNode} from "./types";
import {
	SimpleNodeRenderer,
	SimpleTreeNodeRenderer
} from "./SimpleTreeNodeRenderer";

export type TreeRendererProps<Item extends any = any> = { item: Item, node: TreeNode }
type BaseRenderer<Props> = React.ComponentType<Props>
export type TreeRenderer<Item> = BaseRenderer<TreeRendererProps<Item>>
export type Renderer<Item> = BaseRenderer<{ item: Item }>

export type InferItemType<R> = R extends Renderer<infer Item> ? Item : "Make sure the Renderer renders the correct item type e.g. (props:{item:Item, node: TreeNode}) => React.ReactNode";

export type RendererMap<R extends BaseRenderer<any> = Renderer<any>> = {
	[k: string]: Renderer<any>
}


export type FlatItemToRender<Rm extends RendererMap, K extends keyof Rm = keyof Rm, Item = InferItemType<Rm[K]>> = {
	item: Item
	type: K
}

export type ItemToRender<Rm extends RendererMap, K extends keyof Rm = keyof Rm, Item = InferItemType<Rm[K]>> = FlatItemToRender<Rm, K> & {
	_children?: ItemToRender<Rm>[]
}

export type _GenericRenderer<Rm extends RendererMap, ItemType extends ItemToRender<Rm> = ItemToRender<Rm>> = {
	rendererMap: Rm
	items: ItemType[]
}

type AdapterData<I> = I[] | (() => I[]);

export class BaseAdapter<T extends any = any, R extends BaseRenderer<T> = BaseRenderer<T>> {

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

	getFilteredChildren(obj: any) {
		if (obj === undefined || obj === null)
			return [];

		if (typeof obj !== "object" && !Array.isArray(obj))
			return [];

		return this.getChildren(obj).filter((__key) => this.filter(obj, __key))
	}

	adjust(obj: any): { data: any, deltaPath?: string } {
		return {data: obj, deltaPath: ""};
	}
}

export class Adapter<T extends any = any, I extends TreeRendererProps<T> = TreeRendererProps<T>>
	extends BaseAdapter<I> {

	hideRoot: boolean = false;
	treeNodeRenderer: TreeRenderer<any> = SimpleTreeNodeRenderer;

	setTreeNodeRenderer(renderer: any) {
		this.treeNodeRenderer = renderer;
		return this;
	}

	public resolveRenderer(propKey: string): TreeRenderer<I> {
		return (pah: any) => null;
	}
}

// type NodeAdjuster = (obj: any) => { data: any; deltaPath?: string };
type NestedType<T extends any = any> = { item: T, _children: NestedObjectOfType<T>[] };
type NestedObjectOfType<T extends any = any> = T | NestedType<T>;


class BaseFlatAdapterBuilder<I> {
	data!: AdapterData<I>;
	treeNodeRenderer!: (props: TreeRendererProps<I>) => React.ReactNode;
	getChildrenKeys: (obj: any) => (any[]) = (obj: any) => _keys(obj);
	adjust: ((obj: any) => { data: any; deltaPath: string }) = (obj: any) => ({data: obj, deltaPath: ""});

	setData(data: AdapterData<I>) {
		this.data = data;
		return this;
	}
}


class ListSingleAdapterBuilder<T extends any = any>
	extends BaseFlatAdapterBuilder<T> {

	readonly renderer: Renderer<T>
	treeNodeRenderer = (props: TreeRendererProps<T>) => {
		const _Renderer = this.renderer
		return <div id={props.node.path} onClick={props.node.onClick}>
			<_Renderer item={props.item}/>
		</div>;
	}

	constructor(renderer: Renderer<T>) {
		super();
		this.renderer = renderer;
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

		this.treeNodeRenderer = (props: TreeRendererProps<T>) => {
			const item: NestedObjectOfType<T> = props.item;
			const _Renderer = this.renderer
			return <div id={props.node.path} onClick={props.node.onClick}>
				<_Renderer item={typeof props.item === "object" ? (item as NestedType<T>).item as T : props.item as T}/>
			</div>;
		}

		return this as ListSingleAdapterBuilder<NestedObjectOfType<T>>;
	}

	build() {
		const adapter = new Adapter(this.data);
		adapter.hideRoot = true;
		adapter.treeNodeRenderer = this.treeNodeRenderer;
		adapter.getChildren = this.getChildrenKeys
		adapter.adjust = this.adjust
		// @ts-ignore
		adapter.itemRenderer = this.renderer;
		return adapter;
	}
}

class ListMultiAdapterBuilder<Rm extends RendererMap, I extends FlatItemToRender<Rm> = FlatItemToRender<Rm>>
	extends BaseFlatAdapterBuilder<I> {

	readonly rendererMap: Rm

	treeNodeRenderer = (props: TreeRendererProps<I>) => {
		const _Renderer: Renderer<any> = this.rendererMap[props.item.type]
		return <div id={props.node.path} onClick={props.node.onClick}>
			<_Renderer item={props.item.item}/>
		</div>;
	}

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

	}

	nested(): ListMultiAdapterBuilder<Rm, ItemToRender<Rm>> {
		return this as unknown as ListMultiAdapterBuilder<Rm, ItemToRender<Rm>>;
	}

	build() {
		const adapter = new Adapter(this.data);
		adapter.hideRoot = true;
		adapter.treeNodeRenderer = this.treeNodeRenderer;
		adapter.getChildren = this.getChildrenKeys
		return adapter;

	}
}

class TreeSingleAdapterBuilder<T extends any = any, I = NestedObjectOfType<T>>
	extends BaseFlatAdapterBuilder<I> {

	readonly renderer: Renderer<T>
	treeNodeRenderer = (props: TreeRendererProps<I>) => {

		// @ts-ignore
		const item: NestedObjectOfType<T> = props.item;
		const _Renderer = this.renderer
		return <div id={props.node.path} onClick={props.node.onClick}>
			<_Renderer item={typeof props.item === "object" ? (item as NestedType<T>).item as T : props.item as T}/>
		</div>;
	}

	constructor(renderer: Renderer<T>) {
		super();
		this.renderer = renderer;
	}

	build() {
		const adapter = new Adapter(this.data);
		adapter.treeNodeRenderer = (props: TreeRendererProps) => {
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

	singleRender<Item>(renderer: Renderer<Item>) {
		return new ListSingleAdapterBuilder<Item>(renderer);
	}

	multiRender<Rm extends RendererMap>(rendererMap: Rm) {
		return new ListMultiAdapterBuilder<Rm>(rendererMap);
	}
}

class TreeAdapterBuilder {


	singleRender<Item>(renderer: Renderer<Item>) {
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