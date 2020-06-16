/*
 * A typescript & react boilerplate with api call example
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
import {
	_Renderer,
	_RendererMap,
	Adapter,
	BaseComponent,
	ItemToRender,
	stopPropagation,
	Tree,
    TreeRendererProps,
} from "@nu-art/thunderstorm/frontend";
import {
	__stringify,
	_keys
} from "@nu-art/ts-common";


type InferRenderingType<Rm> = Rm extends _RendererMap<infer I> ? I : never;

export type _GenericRenderer<Rm extends _RendererMap, ItemType extends ItemToRender<Rm> = ItemToRender<Rm>> = {
	rendererMap: Rm
	items: ItemType[]
}

class MultiTypeAdapter<Rm extends _RendererMap, T = InferRenderingType<Rm>>
	extends Adapter {

	private readonly rendererMap: Rm;

	constructor(rendererMap: Rm) {
		super();
		this.hideRoot = true;
		this.rendererMap = rendererMap;
	}


	filter(obj: any, key: keyof any): boolean {
		return key !== "item" && key !== 'type';
	}

	adjust(obj: any): { data: any; deltaPath: string } {
		console.log(`adjust: ${JSON.stringify(obj)}`)
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

	// getChildren(obj: any) {
	// 	return obj["_children"] || [];
	// }

	// getFilteredChildren(obj: any) {
	// 	if (obj === undefined || obj === null)
	// 		return [];
	//
	// 	// if (typeof obj === "object" && !Array.isArray(obj))
	// 	// 	return [];
	//
	// 	return this.getChildren(obj);//.filter((__key: any) => this.filter(obj, __key as keyof T))
	// }

	resolveRenderer(obj: T, propKey: string): _Renderer<TreeRendererProps> {
		return this.rendererMap[propKey];
	}
}

export class Example_FakeMenu
	extends BaseComponent<{}> {

	state = {actionMessage: "No action yet"};

	render() {

		const renderMap: _RendererMap<any> = {
			"number": ItemRenderer_Number,
			"string": ItemRenderer_String,
			"boolean": ItemRenderer_Boolean,
			"array": ItemRenderer_Fallback,
			"object": ItemRenderer_Fallback,
			"submenu": ItemRenderer_Fallback,
		}

		const menu: ItemToRender<_RendererMap<any>> = {
			_children: [
				{
					item: 42,
					type: "number"
				},
				{
					item: "a string",
					type: "string"
				},
				{
					item: true,
					type: "boolean"
				},
				{
					item: "Sub Menu",
					type: "submenu",
					_children: [
						{
							item: [10, 20, 30, 40, 100],
							type: "array"
						},
						{
							item: {key: "value"},
							type: "object"
						},
					],
				},
			]
		}

		const adapter = new MultiTypeAdapter(renderMap);

		adapter.getTreeNodeRenderer = () => Example_NodeRenderer

		adapter.data = menu;
		return <div>
			<h1>Fake Menu</h1>
			<Tree
				id={"FakeMenu"}
				adapter={adapter}
				onNodeFocused={(path: string) => this.setState({actionMessage: `on focused: ${path}`})}
				onNodeClicked={(path: string) => this.setState({actionMessage: `on clicked: ${path}`})}
				onFocus={() => console.log("Focused")}
				onBlur={() => console.log("Blurred")}
			/>
			<h4>{this.state.actionMessage}</h4>
		</div>
	}
}

class ItemRenderer<Type>
	extends React.Component<TreeRendererProps<Type>> {
	constructor(props: TreeRendererProps<Type>) {
		super(props);
	}

	renderItem(moreProps: { focusedColor: string }) {
		let value = __stringify(this.props.item);

		return <div
			id={this.props.node.path}
			className='clickable'
			onClick={this.props.node.onClick}
			style={{backgroundColor: moreProps.focusedColor, userSelect: "none"}}>{`${value}`}</div>
	}
}

class ItemRenderer_Boolean
	extends ItemRenderer<boolean> {

	render() {
		return this.renderItem({focusedColor: this.props.node.focused ? "red" : "salmon"})
	}
}

class ItemRenderer_Fallback
	extends ItemRenderer<any> {

	render() {
		return this.renderItem({focusedColor: this.props.node.focused ? "lightgray" : "unset"})
	}
}

class ItemRenderer_String
	extends ItemRenderer<string> {

	render() {
		return this.renderItem({focusedColor: this.props.node.focused ? "lime" : "cyan"})
	}
}

class ItemRenderer_Number
	extends ItemRenderer<number> {

	render() {
		return this.renderItem({focusedColor: this.props.node.focused ? "lightblue" : "magenta"})
	}

}


class Example_NodeRenderer
	extends React.Component<TreeRendererProps> {

	constructor(props: TreeRendererProps) {
		super(props);
	}

	render() {
		let item = this.props.item.item;
		const Renderer = this.props.node.adapter.resolveRenderer(item, this.props.item.type);
		if (!Renderer)
			return "";

		const hasChildren = Array.isArray(this.props.item) && this.props.item.length > 0;

		return (
			<div className="ll_h_c">
				<Renderer node={this.props.node} item={item}/>
				{hasChildren && <div
					id={this.props.node.path}
					onMouseDown={stopPropagation}
					onMouseUp={(e) => this.props.node.expandToggler(e, !this.props.node.expanded)}
					style={{cursor: "pointer", marginRight: 10}}
				>{this.props.node.expanded ? "+" : "-"}</div>}
			</div>
		);
	};
}
