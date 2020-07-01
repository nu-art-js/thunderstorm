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
	AdapterBuilder,
	BaseNodeRenderer,
	DropDown
} from "@nu-art/thunderstorm/frontend";
import * as React from "react";
import {
	optionRendererStyle,
	Plague,
	plagues
} from "./Example_DropDowns";
import {ICONS} from "@res/icons";

export class Example_DefaultsDropDown
	extends React.Component<{}, { _selected?: Plague }> {

	onSelected = (plague: Plague) => {
		this.setState({_selected: plague});
	};

	render() {
		const simpleAdapter: Adapter = AdapterBuilder()
			.list()
			.singleRender(ItemRenderer)
			.setData(plagues)
			.build();

		return <div>
			<h4>Only defaults</h4>
			<h4>single renderer</h4>
			<DropDown
				adapter={simpleAdapter}
				onSelected={this.onSelected}
				// listStyleResolver={{listStyle:{backgroundColor:"red", border:'2px solid black'}}}
			/>
			<h4>{this.state?._selected ? `You chose ${this.state._selected.value}` : "You didn't choose yet"}</h4>
		</div>
	}
}


export class ItemRenderer
	extends BaseNodeRenderer<Plague> {

	renderItem(item: Plague) {
		return (
			<div className="ll_h_c clickable"
			     id={this.props.node.path}
			     onClick={(event: React.MouseEvent) => this.props.node.onClick(event)}
			     style={this.props.node.focused ? {backgroundColor: "white"} : {}}>

				<div className={optionRendererStyle(this.props.node.focused)}>
					<div className={`ll_h_c`} style={{justifyContent: "space-between"}}>
						<div>{item.label}</div>
						{this.props.node.focused && <div>{ICONS.check(undefined, 14)}</div>}
					</div>
				</div>
			</div>
		);
	}
}