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
type BaseRenderer<Item> = React.ComponentType<Item>
export type TreeRenderer<Item> = BaseRenderer<TreeRendererProps<Item>>
export type Renderer<Item> = BaseRenderer<{ item: Item }>

export type InferItemType<R> = R extends Renderer<infer Item> ? Item : "Make sure the Renderer renders the correct item type e.g. (props:{item:Item, node: TreeNode}) => React.ReactNode";

export type RendererMap = {
	[k: string]: BaseRenderer<any>
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
	itemRenderer = SimpleNodeRenderer;

	setTreeNodeRenderer(renderer: any) {
		this.treeNodeRenderer = renderer;
		return this;
	}

	public resolveRenderer(propKey: string): TreeRenderer<I> {
		return this.itemRenderer;
	}
}

// type NodeAdjuster = (obj: any) => { data: any; deltaPath?: string };


class BaseFlatAdapterBuilder<I> {
	data!: AdapterData<I>;

	setData(data: AdapterData<I>) {
		this.data = data;
		return this;
	}

}


class FlatSingleAdapterBuilder<T extends any = any>
	extends BaseFlatAdapterBuilder<T> {

	readonly renderer: Renderer<T>
	readonly treeNodeRenderer = (props: TreeRendererProps<T>) => {
		const _Renderer = this.renderer
		return <div id={props.node.path} onClick={props.node.onClick}>
			<_Renderer item={props.item}/>
		</div>;
	}

	constructor(renderer: Renderer<T>) {
		super();
		this.renderer = renderer;
	}

	build() {
		const adapter = new Adapter(this.data);
		adapter.hideRoot = true;
		adapter.treeNodeRenderer = this.treeNodeRenderer;
		// @ts-ignore
		adapter.itemRenderer = this.renderer;
		return adapter;
	}
}

class FlatMultiAdapterBuilder<Rm extends RendererMap>
	extends BaseFlatAdapterBuilder<FlatItemToRender<Rm>> {

	readonly rendererMap: Rm

	constructor(rendererMap: Rm) {
		super();
		this.rendererMap = rendererMap;
	}

	build() {

	}
}

class FlatAdapterBuilder {

	singleRender<Item>(renderer: Renderer<Item>) {
		return new FlatSingleAdapterBuilder<Item>(renderer);
	}

	multiRender<Rm extends RendererMap>(rendererMap: Rm) {
		return new FlatMultiAdapterBuilder<Rm>(rendererMap);
	}
}

// class NestedAdapterBuilder
// 	extends FlatAdapterBuilder {
//
// 	private hideRoot: boolean = false;
// 	private treeNodeRenderer: BaseRenderer<any> = SimpleTreeNodeRenderer;
// 	private simpleRenderer = SimpleNodeRenderer;
//
// 	asMenu() {
// 		this.adjust = (obj: any): { data: any, deltaPath?: string } => {
// 			return {data: obj, deltaPath: ""};
// 		}
//
// 		return this;
// 	}
// }

class MainAdapterBuilder {

	list() {
		return new FlatAdapterBuilder();
	}

	// tree() {
	// 	return new NestedAdapterBuilder();
	// }
}

export function AdapterBuilder() {
	return new MainAdapterBuilder();
}