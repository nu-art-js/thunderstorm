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
	BaseComponent,
	Tree,
	Adapter,
	TreeNode,
} from "@nu-art/thunderstorm/frontend";

type State = { focused?: string, actionMessage: string };
export type Element = { label: string, action?: () => void }

export class Example_VerySimpleTree
	extends BaseComponent<{}, State> {

	state = {actionMessage: "No action yet"};
	private elements: { [key: string]: Element | object } = {
		First: {
			label: 'First element',
			other: 'Other element',
		},
		Second: {
			data: {
				label: 'Second element',
				other: 'Other element',
			}
		},
		Third: {
			label: 8,
			other: 'Other element',
		},
		Forth: {
			label: "Forth element",
			other: 'Other element',
		}
	};

	render() {
		const adapter = new Adapter();
		adapter.hideRoot = true;
		adapter.adjust = (data: object) => {
			if (Object.keys(data).find(key => key === "data")) {
				// @ts-ignore
				return {data: data['data'], deltaPath: "data"}
			}

			return {data, deltaPath: ""};
		}

		adapter.getTreeNodeRenderer = () => Example_NodeRenderer

		adapter.data = this.elements;
		return <>
			<h1>Very Simple Tree</h1>
			<Tree
				id={"VerySimpleTree"}
				adapter={adapter}
				onNodeFocused={(path: string) => this.setState({actionMessage: `on focused: ${path}`})}
				onNodeClicked={(path: string) => this.setState({actionMessage: `on clicked: ${path}`})}
				onFocus={() => console.log("Focused")}
				onBlur={() => console.log("Blurred")}
			/>
			<h4>{this.state.actionMessage}</h4>
		</>
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
			label = ` : ${item}`;
		else if (Object.keys(item).length === 0)
			label = " : {}";
		else
			label = "";


		return <div
			id={this.props.path}
			className='clickable'
			onClick={this.props.onClick}
			style={{backgroundColor: this.props.focusedColor(this.props), userSelect: "none"}}>{this.props.propKey || "root"} {label}</div>
	}
}

class ItemRenderer0
	extends ItemRenderer {

	static defaultProps = {
		focusedColor: (props: TreeNode) => props.focused ? "red" : "salmon"
	}
}

class ItemRenderer1
	extends ItemRenderer {

	static defaultProps = {
		focusedColor: (props: TreeNode) => props.focused ? "lime" : "cyan"
	}
}

class ItemRenderer2
	extends ItemRenderer {
	static defaultProps = {
		focusedColor: (props: TreeNode) => props.focused ? "lightblue" : "magenta"
	}

}

const ExpandCollapseComponent = (props: TreeNode) => {
	const children = props.adapter.getFilteredChildren(props.item);

	let toDisplay;
	if (children.length === 0)
		toDisplay = "";
	else if (props.expanded)
		toDisplay = "-";
	else
		toDisplay = "+";

	return <div className={`clickable`} id={props.path} onClick={props.expandToggler} style={{width: "15px"}}>{toDisplay}</div>

}

class Example_NodeRenderer
	extends React.Component<TreeNode> {

	constructor(props: TreeNode) {
		super(props);
	}

	render() {
		return (<div className="ll_h_c">
			<ExpandCollapseComponent {...this.props}/>
			{this.renderItems()}
		</div>);
	};

	private renderItems() {
		const Renderer = this.getRendererType();

		return <Renderer {...this.props}/>
	}

	private getRendererType() {
		if (typeof this.props.item === "number")
			return ItemRenderer2;

		return this.props.propKey === "other" ? ItemRenderer1 : ItemRenderer0;
	}
}
