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
	_RendererMap,
	Adapter,
	BaseComponent,
	Tree,
	TreeNode,
	ItemToRender,
	_Renderer,
    stopPropagation,
} from "@nu-art/thunderstorm/frontend";
import {_keys} from "@nu-art/ts-common";

const menu = {
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

	resolveRenderer(obj: T, propKey: string): _Renderer<any> {
		return this.rendererMap[propKey];
	}
}

export class Example_FakeMenu
	extends BaseComponent<{}> {

	state = {actionMessage: "No action yet"};

	render() {
		const renderMap: _RendererMap<Created> = {
			"number": ItemRenderer_Number,
			"string": ItemRenderer_String,
			"boolean": ItemRenderer_Boolean,
			"array": ItemRenderer_Fallback,
			"object": ItemRenderer_Fallback,
			"submenu": ItemRenderer_Fallback,
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

type Created = TreeNode & { focusedColor: (props: TreeNode) => string };

class ItemRenderer
	extends React.Component<Created> {
	constructor(props: Created) {
		super(props);
	}

	render() {
		let label;
		let item = this.props.item;
		if (typeof item !== "object")
			label = `${item}`;
		else if (Object.keys(item).length === 0)
			label = "{}";
		else
			label = "";


		return <div
			id={this.props.path}
			className='clickable'
			onClick={this.props.onClick}
			style={{backgroundColor: this.props.focusedColor(this.props), userSelect: "none"}}>{label}</div>
	}
}

class ItemRenderer_Boolean
	extends ItemRenderer {

	static defaultProps = {
		focusedColor: (props: TreeNode) => props.focused ? "red" : "salmon"
	}
}

class ItemRenderer_Fallback
	extends ItemRenderer {

	static defaultProps = {
		focusedColor: (props: TreeNode) => props.focused ? "lightgray" : "unset"
	}
}

class ItemRenderer_String
	extends ItemRenderer {

	static defaultProps = {
		focusedColor: (props: TreeNode) => props.focused ? "lime" : "cyan"
	}
}

class ItemRenderer_Number
	extends ItemRenderer {
	static defaultProps = {
		focusedColor: (props: TreeNode) => props.focused ? "lightblue" : "magenta"
	}

}


class Example_NodeRenderer
	extends React.Component<TreeNode> {

	constructor(props: TreeNode) {
		super(props);
	}

	render() {
		const Renderer = this.props.adapter.resolveRenderer(this.props.item.item, this.props.item.type);
		if (!Renderer)
			return "";

		const hasChildren = this.props.item.item.length;

		return (
			<div className="ll_h_c">
				<Renderer {...this.props} item={this.props.item.item}/>
				{hasChildren && <div
					id={this.props.path}
					onMouseDown={stopPropagation}
					onMouseUp={(e) => this.props.expandToggler(e, !this.props.expanded)}
					style={{cursor: "pointer", marginRight: 10}}
				>{this.props.expanded ? "+" : "-"}</div>}
			</div>
		);
	};
}
