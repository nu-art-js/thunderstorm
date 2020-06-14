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
import {MenuItemWrapper} from "../../modules/menu/MenuModule";
import {TreeNode} from "./types";
import {SimpleTreeNodeRenderer} from "./DefaultTreeRenderer";

export type _Renderer<Item> = React.ComponentType<Item>

export type _RendererMap<T extends any = any> = {
	[k: string]: _Renderer<T>
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

	resolveItemType(obj: T, key: string): number | string {
		return 0;
	}

	getTreeNodeRenderer(): _Renderer<TreeNode> {
		return SimpleTreeNodeRenderer;
	}

	getChildren(obj: any) {
		return _keys(obj);
	}

	getFilteredChildren(obj: any) {
		if (obj === undefined || obj == null)
			return [];

		if (typeof obj !== "object" && !Array.isArray(obj))
			return [];

		return this.getChildren(obj).filter((__key) => this.filter(obj, __key as keyof T))
	}

	adjust(obj: T) {
		return {data: obj, deltaPath: ""};
	}
}

export class MultiTypeAdapter
	extends Adapter {


	constructor() {
		super();
		this.hideRoot = true;
	}

	filter(obj: any, key: keyof any): boolean {
		return key !== "item" && key !== 'type';
	}

	adjust(obj: any): { data: any; deltaPath: string } {
		if (!_keys(obj).find(key => key === "_children"))
			return {data: obj, deltaPath: ""};

		// @ts-ignore
		const objElement = obj['_children'];
		// @ts-ignore
		objElement.type = obj.type;
		// @ts-ignore
		objElement.item = obj.item;

		// @ts-ignore
		return {data: objElement, deltaPath: '_children'};

	}

	resolveItemType(obj: any): number | string {
		const itemWrapper = obj as MenuItemWrapper<any, any>;
		return itemWrapper.type;
	}
}
