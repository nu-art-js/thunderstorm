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
import {AdapterBuilder, BaseNodeRenderer, NodeRendererProps, TreeNode, TS_Tree,} from "@nu-art/thunderstorm/frontend";
import {__stringify} from "@nu-art/ts-common";
import {PlaygroundExample_ResultStyle} from "../consts";
import {PG_Example} from "../_core/PG_Example";

type State = { focused?: string, actionMessage: string };

class Example_Tree_Basic
	extends React.Component<{}, State> {

	state = {actionMessage: "No action yet"};
	private elements = {
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
		const adapter = AdapterBuilder()
			.tree()
			.singleRender(Example_NodeRenderer)
			.setData(this.elements)
			.build();

		adapter.hideRoot = true;


		return <>
			<TS_Tree
				id={"VerySimpleTree"}
				adapter={adapter}
				onNodeFocused={(path: string) => this.setState({actionMessage: `on focused: ${path}`})}
				onNodeClicked={(path: string) => this.setState({actionMessage: `on clicked: ${path}`})}
				// onFocus={() => console.log("Focused")}
				// onBlur={() => console.log("Blurred")}
			/>
			<div {...PlaygroundExample_ResultStyle}>{this.state.actionMessage}</div>
		</>
	}
}

class ItemRenderer
	extends BaseNodeRenderer<any>{

	constructor(props: NodeRendererProps) {
		super(props);
	}

	renderItem(moreProps: { focusedColor: string }) {
		const value = __stringify(this.props.item);

		return <div
			id={this.props.node.path}
			className='clickable'
			onClick={this.props.node.onClick}
			style={{backgroundColor: moreProps.focusedColor, userSelect: "none"}}>{`${value}`}</div>

	}
}

class ItemRenderer0
	extends ItemRenderer {

	render() {
		return this.renderItem({focusedColor: this.props.node.focused ? "red" : "salmon"});
	}
}

class ItemRenderer1
	extends ItemRenderer {

	render() {
		return this.renderItem({focusedColor: this.props.node.focused ? "lime" : "cyan"});
	}
}

class ItemRenderer2
	extends ItemRenderer {

	render() {
		return this.renderItem({focusedColor: this.props.node.focused ? "lightblue" : "magenta"});
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
	extends React.Component<NodeRendererProps> {

	constructor(props: NodeRendererProps) {
		super(props);
	}

	render() {
		return (<div className="ll_h_c">
			<ExpandCollapseComponent {...this.props.node}/>
			{this.renderItems()}
		</div>);
	};

	private renderItems() {
		const Renderer = this.getRendererType();

		return <Renderer item={this.props.item} node={this.props.node}/>
	}

	private getRendererType() {
		if (typeof this.props.item === "number")
			return ItemRenderer2;

		return this.props.node.propKey === "other" ? ItemRenderer1 : ItemRenderer0;
	}
}

const name = "Tree - Basic";

export function Playground_Tree_Basic() {
	return {
		renderer: ()=><PG_Example name={name}> <Example_Tree_Basic/> </PG_Example>,
		name
	};
}