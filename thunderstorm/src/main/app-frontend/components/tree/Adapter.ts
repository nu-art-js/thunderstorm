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

export type RendererMap<T extends any = any> = {
	[k: string]: BaseRenderer<T>
}

export type ItemToRender<Rm extends RendererMap, K extends keyof Rm = keyof Rm, Item = InferItemType<Rm[K]>> = {
	_children?: ItemToRender<Rm>[]
	item: Item
	type: K
}

export type _GenericRenderer<Rm extends RendererMap, ItemType extends ItemToRender<Rm> = ItemToRender<Rm>> = {
	rendererMap: Rm
	items: ItemType[]
}

export class Adapter<T extends any = any, R extends BaseRenderer<T> = BaseRenderer<T>> {

	data: any;
	hideRoot: boolean = false
	protected treeNodeRenderer!: R;
	protected simpleRenderer!: R;

	constructor(data: any){
		this.data = data
	}

	setData(data: object) {
		this.data = data;
		return this;
	}

	filter<K>(obj: K, key: keyof K) {
		return true;
	}

	setTreeNodeRenderer(renderer: R) {
		this.treeNodeRenderer = renderer;
		return this;
	}

	getTreeNodeRenderer(): R {
		return this.treeNodeRenderer;
	}

	public resolveRenderer(propKey: string): R {
		return this.simpleRenderer;
	}

	getChildren = <K>(obj: K): (keyof K)[] => _keys(obj);

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

export class TreeAdapter<T extends any = any>
	extends Adapter<{ item: T, node: TreeNode }> {

	hideRoot: boolean = false;
	treeNodeRenderer = SimpleTreeNodeRenderer;
	simpleRenderer = SimpleNodeRenderer;
}