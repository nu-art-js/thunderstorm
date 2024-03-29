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

import * as React from 'react';
import {Adapter, BaseNodeRenderer, NodeRendererProps, SimpleTreeAdapter, TS_Tree,} from '@nu-art/thunderstorm/frontend';
import {__stringify} from '@nu-art/ts-common';


type State = { focused?: string, actionMessage: string };

class Example_Tree_Basic
	extends React.Component<{}, State> {

	state = {actionMessage: 'No action yet'};
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
			label: 'Forth element',
			other: 'Other element',
		}
	};

	render() {
		const adapter: Adapter = SimpleTreeAdapter(this.elements, (item) => <Example_NodeRenderer {...item}/>);
		adapter.hideRoot = true;


		return <>
			<TS_Tree
				adapter={adapter}
				onNodeFocused={(path: string) => this.setState({actionMessage: `on focused: ${path}`})}
				onNodeClicked={(path: string) => this.setState({actionMessage: `on clicked: ${path}`})}
				// onFocus={() => console.log("Focused")}
				// onBlur={() => console.log("Blurred")}
			/>
			<div className="ts-playground__results">{this.state.actionMessage}</div>
		</>;
	}
}

class ItemRenderer
	extends BaseNodeRenderer<any> {

	constructor(props: NodeRendererProps) {
		super(props);
	}

	renderItem(moreProps: { focusedColor: string }) {
		const value = __stringify(this.props.item);

		return <div
			className="clickable"
			style={{backgroundColor: moreProps.focusedColor, userSelect: 'none'}}>{`${value}`}</div>;

	}
}

class ItemRenderer0
	extends ItemRenderer {

	render() {
		return this.renderItem({focusedColor: 'red'});
	}
}

class ItemRenderer1
	extends ItemRenderer {

	render() {
		return this.renderItem({focusedColor: 'lime'});
	}
}

class ItemRenderer2
	extends ItemRenderer {

	render() {
		return this.renderItem({focusedColor: 'lightblue'});
	}
}

class Example_NodeRenderer
	extends React.Component<NodeRendererProps> {

	constructor(props: NodeRendererProps) {
		super(props);
	}

	render() {
		return (<div className="ll_h_c">
			{this.renderItems()}
		</div>);
	}

	private renderItems() {
		const Renderer = this.getRendererType();

		return <Renderer item={this.props.item} node={this.props.node}/>;
	}

	private getRendererType() {
		if (typeof this.props.item === 'number')
			return ItemRenderer2;

		return this.props.item === 'other' ? ItemRenderer1 : ItemRenderer0;
		// return this.props.node.propKey === 'other' ? ItemRenderer1 : ItemRenderer0;
	}
}

export const Playground_Tree_Basic = {name: 'Tree - Basic', renderer: Example_Tree_Basic};