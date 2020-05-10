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

export type InferItemType<R> = R extends Renderer<infer Item> ? Item : "Make sure the Renderer Renders the correct item type e.g. (props:{item:Item}) => React.ReactNode";

export type Renderer<Item> = React.ElementType<{ item: Item }>

export type RendererMap<T extends any = any> = {
	[k: string]: Renderer<T>
}

export type ItemWrapper<Rm extends RendererMap, K extends keyof Rm = keyof Rm, Item = InferItemType<Rm[K]>> = {
	item: Item
	type: K
}

export type GenericRenderer<Rm extends RendererMap, ItemType extends ItemWrapper<Rm> = ItemWrapper<Rm>> = {
	rendererMap: Rm
	items: ItemType[]
}
