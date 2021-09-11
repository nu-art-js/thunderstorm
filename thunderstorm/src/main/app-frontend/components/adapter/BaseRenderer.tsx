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
import {TreeNode} from "../tree/types";


export type ItemRendererProps<Item extends any = any> = { item: Item }
export type _BaseItemRenderer<ItemType> = React.ComponentType<ItemRendererProps<ItemType>>

export abstract class BaseItemRenderer<ItemType, S extends {} = {}>
	extends React.Component<ItemRendererProps<ItemType>, S> {

	render() {
		return this.renderItem(this.props.item);
	}

	protected abstract renderItem(item: ItemType): React.ReactNode;
}

export type NodeRendererProps<Item extends any = any> = { item: Item, node: TreeNode }
export type _BaseNodeRenderer<ItemType> = React.ComponentType<NodeRendererProps<ItemType>>

export abstract class BaseNodeRenderer<ItemType, S extends {} = {}>
	extends React.Component<NodeRendererProps<ItemType>, S> {

	render() {
		return this.renderItem(this.props.item);
	}

	protected abstract renderItem(item: ItemType): React.ReactNode;
}


export type BaseRendererMap<R extends React.ComponentType<any>> = {
	[k: string]: R
}

export type TreeRendererMap = BaseRendererMap<_BaseNodeRenderer<any>>;

