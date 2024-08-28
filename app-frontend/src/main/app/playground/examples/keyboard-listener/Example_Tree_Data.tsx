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
import {Adapter, ComponentSync, LL_V_C, NodeRendererProps, TreeNode, TS_Tree,} from '@thunder-storm/core/frontend';


type State = { focused?: string, actionMessage: string };
export type Element = { label: string, action?: () => void }

class Example_Tree_Data
	extends ComponentSync<{}, State> {

	protected deriveStateFromProps(nextProps: {}): State {
		return {actionMessage: 'No action yet'};
	}

	private elements: { [key: string]: Element | object } = {
		dataTypes: {
			number: 42,
			string: 'a string',
			boolTrue: true,
			boolFalse: false,
			array_of_numbers: [0, 1, 2, 3, 4, 5],
			array_of_string: ['string1', 'string2', 'string3'],
			array_of_booleans: [true, true, false],
			_undefined: undefined,
			_null: null,
			object: {
				label: 'label',
				number: 500
			}
		}
	};

	render() {
		const adapter = new Adapter(this.elements).setTreeNodeRenderer(Example_ColorfulNodeRenderer);
		adapter.hideRoot = true;

		return <LL_V_C style={{minWidth: 180}}>
			<TS_Tree
				adapter={adapter}
				onNodeFocused={(path: string) => this.setState({actionMessage: `on focused: ${path}`})}
				onNodeClicked={(path: string) => this.setState({actionMessage: `on clicked: ${path}`})}
			/>
			<div className="ts-playground__results">{this.state.actionMessage}</div>
		</LL_V_C>;
	}
}

const ExpandCollapseComponentSVG = (props: TreeNode) => {
	const children = props.adapter.getFilteredChildren(props.item);

	let toDisplay;
	if (children.length === 0)
		toDisplay = '';
	else if (props.expanded)
		toDisplay = <svg width="15" height="15" viewBox="0 0 15 15" fill="currentColor" style={{color: '#9b59b6', verticalAlign: 'text-top'}}>
			<path d="M0 14l6-6-6-6z"/>
		</svg>;
	else
		toDisplay = <svg width="15" height="15" viewBox="0 0 15 15" fill="currentColor" style={{color: '#3498db', verticalAlign: 'text-top'}}>
			<path d="M0 5l6 6 6-6z"/>
		</svg>;

	return <div className={`clickable`} onClick={props.expandToggler} style={{width: '15px', marginRight: 2}}>{toDisplay}</div>;
};

class Example_ColorfulNodeRenderer
	extends React.Component<NodeRendererProps> {

	constructor(props: NodeRendererProps) {
		super(props);
	}

	render() {
		const valueStyle = (_value: any) => {
			switch (typeof _value) {
				case 'string':
					return {color: '#e67e22'};

				case 'boolean':
					return {color: '#bf95d0'};

				case 'number':
					if (isNaN(_value))
						return {color: '#e0e0e0'};

					return {color: '#2ecc71'};

				case 'undefined' :
					return {color: '#000'};

				case 'object':
					if (_value === null)
						return {color: '#f1c40f'};

				// eslint-disable-next-line no-fallthrough
				default:
					return {color: '#000000'};
			}
		};

		let value: any;
		const item = this.props.item;
		if (typeof item !== 'object')
			value = item;
		else if (Object.keys(item).length === 0)
			value = '{}';
		else
			value = '';

		const nameStyle = {color: '#000000'};

		return (
			<div className="ll_h_c" style={{fontSize: '0.9em', lineHeight: 1.25}}>
				<ExpandCollapseComponentSVG {...this.props.node}/>
				<div className="clickable">
					{/*<span style={nameStyle}>{this.props.node.propKey}</span>*/}
					<span style={nameStyle}>"this.props.node.propKey"</span>
					{value !== '' ? ': ' : ''}
					<span style={valueStyle(value)}>{`${value}`}</span>
				</div>
			</div>
		);
	}
}

export const Playground_Tree_Data = {name:'Tree - Data',renderer:Example_Tree_Data}