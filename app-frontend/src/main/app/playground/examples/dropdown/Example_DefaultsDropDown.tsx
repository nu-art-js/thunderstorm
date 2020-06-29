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

import {
	Adapter,
	AdapterBuilder
} from "@nu-art/thunderstorm/app-frontend/components/tree/Adapter";
import {DropDown} from "@nu-art/thunderstorm/app-frontend/components/DropDown";
import * as React from "react";
import {
	optionRendererStyle,
	Plague,
	plagues,
	Props
} from "./Example_DropDowns";
import {ICONS} from "@res/icons";

export class Example_DefaultsDropDown
	extends React.Component<{}, { _selected: string }> {

	state = {_selected: ''};

	onSelected = (plague: Plague) => {
		this.setState({_selected: plague.value});
	};

	render() {
		// const simpleAdapter = new Adapter(plagues).setTreeNodeRenderer(ItemRenderer);
		const simpleAdapter: Adapter = AdapterBuilder()
			.list()
			.multiRender({reg: (props: { item: Plague }) => <_ItemRenderer item={props.item} node={{path:`/${props.item.value}`, focused: true, selected: props.item.value === this.state._selected}}/>})
			.setData( plagues.map(plague => (
				{type: "reg", item: plague}
			)))
			.build();
		// simpleAdapter.hideRoot = true;
		return <div>
			<h4>Only defaults, single renderer</h4>
			<h4>single renderer</h4>
			<DropDown
				adapter={simpleAdapter}
				onSelected={this.onSelected}
				// listStyleResolver={{listStyle:{backgroundColor:"red", border:'2px solid black'}}}
			/>
			<h4>{this.state._selected ? `You chose ${this.state._selected}` : "You didn't choose yet"}</h4>
		</div>
	}
}
class _ItemRenderer
	extends React.Component<Props> {
	render() {
		if (typeof this.props.item !== "object")
			return null;

		return (
			<div className="ll_h_c clickable"
			     id={this.props.node.path}
				// onClick={(event: React.MouseEvent) => this.props.node.onClick(event)}
				   style={this.props.node.focused ? {backgroundColor: "lime"} : {}}>

				<div className={optionRendererStyle(this.props.node.focused)}>
					<div className={`ll_h_c`} style={{justifyContent: "space-between"}}>
						<div>{this.props.item.label}</div>
						{this.props.node.selected && <div>{ICONS.check(undefined, 14)}</div>}
					</div>
				</div>
			</div>
		);
	}
}