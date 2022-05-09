/*
 * Permissions management system, define access level for each of
 * your server apis, and restrict users by giving them access levels
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
import {ICONS} from '@res/icons';
import {BaseNodeRenderer,} from '@nu-art/thunderstorm/frontend';
import {optionRendererStyle, Plague} from './consts';
import {Playground_DropdownSingleAndMulti} from './Example_Dropdown_SingleAndMulti';
import {Playground_DropdownMultiType} from './Example_Dropdown_MultiType';
import {Playground_DropdownSingleType} from './Example_Dropdown_SingleType';


export type Node = {
	path: string
	focused: boolean,
	selected?: boolean,
}

export type Props = {
	item: Plague,
	node: Node
}

export class Example_AllDropDowns_Renderer
	extends React.Component<{}, { _selected: string }> {
	constructor(props: {}) {
		super(props);

		this.state = {_selected: ''};
	}

	render() {
		return <>
			<h1>dropdowns</h1>
			<div className={'ll_h_t match_width'} style={{justifyContent: 'space-around', height: 100}}>
				{Playground_DropdownSingleAndMulti.renderer}
				{Playground_DropdownSingleType.renderer}
				{Playground_DropdownMultiType.renderer}
			</div>
		</>;
	}
}

export const Example_AllDropDowns = {renderer: Example_AllDropDowns_Renderer, name: 'ALL DropDown Examples'}

export class _ItemRenderer
	extends React.Component<Props> {
	render() {
		if (typeof this.props.item !== 'object')
			return null;

		return (
			<div className="ll_h_c clickable"
					 id={this.props.node.path}
				// onClick={(event: React.MouseEvent) => this.props.node.onClick(event)}
					 style={this.props.node.focused ? {backgroundColor: 'lime'} : {}}>

				<div className={optionRendererStyle(this.props.node.focused)}>
					<div className={`ll_h_c`} style={{justifyContent: 'space-between'}}>
						<div>{this.props.item.label}</div>
						{this.props.node.selected && <div>{ICONS.check(undefined, 14)}</div>}
					</div>
				</div>
			</div>
		);
	}
}

export class ItemRenderer
	extends BaseNodeRenderer<Plague> {

	renderItem(item: Plague) {
		return (
			<div className="ll_h_c clickable">

				<div>
					<div className={`ll_h_c`} style={{justifyContent: 'space-between'}}>
						<div>{this.props.item.label}</div>
						{/*{this.props.node.selected && <div>{ICONS.check(undefined, 14)}</div>}*/}
					</div>
				</div>
			</div>
		);
	}
}
