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
import {MultiTypeAdapter} from "./MultiTypeTreeRenderer";
import {generateHex} from "@nu-art/ts-common";
import {
	_Menu,
	_RendererMap,
	BaseComponent,
	stopPropagation,
	Tree,
	TreeRendererProps
} from "@nu-art/thunderstorm/frontend";

type Props = {
	menu: _Menu<_RendererMap>
	childrenContainerStyle?: any
	id?: string
}

export class SimpleMenu
	extends BaseComponent<Props> {
	private id: string = generateHex(8);

	render() {
		const adapter = new MultiTypeAdapter(this.props.menu.rendererMap);

		adapter.getTreeNodeRenderer = () => NodeRenderer;

		adapter.data = this.props.menu.items;
		return <Tree
			id={this.props.id || this.id}
			adapter={adapter}
			onNodeFocused={(path: string) => this.setState({actionMessage: `on focused: ${path}`})}
			onNodeClicked={(path: string) => this.setState({actionMessage: `on clicked: ${path}`})}
			onFocus={() => console.log("Focused")}
			onBlur={() => console.log("Blurred")}
		/>
	}
}

class NodeRenderer
	extends React.Component<TreeRendererProps> {

	constructor(props: TreeRendererProps) {
		super(props);
	}

	render() {
		const item = this.props.item.item;
		const Renderer = this.props.node.adapter.resolveRenderer(this.props.item.type);
		if (!Renderer)
			return "";

		const hasChildren = Array.isArray(this.props.item) && this.props.item.length > 0;

		return (
			<div
				className="ll_h_c clickable"
				id={this.props.node.path}
				onClick={this.props.node.onClick}
			>
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

