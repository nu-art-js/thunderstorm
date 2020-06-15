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
} from "./DefaultTreeRenderer";
import {
	InferItemType,
	RendererMap
} from "../../types/renderer-map";

export type _Renderer<Item> = React.ComponentType<Item>

export type _RendererMap<T extends any = any> = {
	[k: string]: _Renderer<T>
}

export type ItemToRender<Rm extends RendererMap, K extends keyof Rm = keyof Rm, Item = InferItemType<Rm[K]>> = {
	item: Item
	type: K
}

export type _GenericRenderer<Rm extends RendererMap, ItemType extends ItemToRender<Rm> = ItemToRender<Rm>> = {
	rendererMap: Rm
	items: ItemType[]
}

export class Adapter<T extends any = any> {

	data!: object;
	hideRoot: boolean = false

	setData(data: object) {
		this.data = data;
	}

	filter(obj: T, key: keyof T) {
		return true;
	}

	getTreeNodeRenderer(): _Renderer<TreeNode> {
		return SimpleTreeNodeRenderer;
	}

	resolveRenderer(obj: T, propKey: string): _Renderer<any> {
		return SimpleNodeRenderer;
	}

	getChildren(obj: any) {
		return _keys(obj);
	}

	getFilteredChildren(obj: any) {
		if (obj === undefined || obj === null)
			return [];

		if (typeof obj !== "object" && !Array.isArray(obj))
			return [];

		return this.getChildren(obj).filter((__key) => this.filter(obj, __key as keyof T))
	}

	adjust(obj: T) {
		return {data: obj, deltaPath: ""};
	}
}