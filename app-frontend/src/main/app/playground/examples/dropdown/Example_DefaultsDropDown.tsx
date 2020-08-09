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
	DropDown,
	TreeRendererMap,
} from "@nu-art/thunderstorm/frontend";
import * as React from "react";
import {
	optionRendererStyle,
	Plague,
	plagues,
	PlagueWithTitle
} from "./Example_DropDowns";
import {
	FlatItemRenderer,
	flatPlaguesWithTitles,
	FlatTitleRender,
} from "./Example_MultiRendererDropDown";

export const flatRendererMap: TreeRendererMap = {
	normal: FlatItemRenderer,
	title: FlatTitleRender
};

export class Example_DefaultsDropDown
	extends React.Component<{}, { _selected?: Plague, simpleAdapter: boolean }> {

	constructor(props: {}) {
		super(props);
		this.state = {
			simpleAdapter: false
		}
	}

	// onSelected = (plague: Plague) => {
	// 	this.setState({_selected: plague});
	// };
	private plagues = plagues;

	addPlague = () => {
		this.plagues = [...this.plagues, plagues[0]]
		// this.plagues.push(plagues[0]);
		this.forceUpdate()
	};

	switchAdapter = () => {
		this.setState(state => ({simpleAdapter: !state.simpleAdapter}))
	};


	render() {
		const simpleAdapter: Adapter = AdapterBuilder()
			.list()
			.singleRender(ItemRenderer)
			.setData(plagues)
			.build();

		const adapter = AdapterBuilder()
			.list()
			.multiRender(flatRendererMap)
			.setData(flatPlaguesWithTitles)
			.noGeneralOnClick()
			.build();

		const realAdapter = this.state.simpleAdapter ? simpleAdapter : adapter;

		return <div>
			<h4>Only defaults</h4>
			<h4>single renderer, flat list</h4>
			<div onClick={this.addPlague} style={{cursor: "pointer"}}>Add Plague</div>
			<div onClick={this.switchAdapter} style={{cursor: "pointer"}}>Switch Adapter</div>
			<DropDown<Plague | PlagueWithTitle>
				// key={this.state.simpleAdapter ? 'simple' : 'complex'}
				adapter={realAdapter}
				onSelected={() => {
				}}
				// onSelected={this.onSelected}
				filter={this.filter}
				selectedItemRenderer={this.valueRenderer}
			/>
			{console.log(this.state?._selected?.value)}
			{/*<h4>{this.state?._selected ? `You chose ${this.state._selected.value}` : "You didn't choose yet"}</h4>*/}
		</div>
	}

	private valueRenderer = (selected?: PlagueWithTitle | Plague) => {
		if(!selected)
			return <div>{"BLAH BLAH"}</div>

		return <div>{this.isSimple(selected) ? selected.label : selected.item?.label}</div>;
	};

	private filter = (item: PlagueWithTitle | Plague) => {
		if (this.isSimple(item))
			return [item.label];

		return [item.item.label]
	};

	private isSimple(item: PlagueWithTitle | Plague): item is Plague {
		return this.state.simpleAdapter;
	}
}


export class ItemRenderer
	extends BaseNodeRenderer<Plague> {

	renderItem(item: Plague) {
		return (
			<div className="ll_h_c clickable match_width"
			     id={this.props.node.path}
			     onClick={(event: React.MouseEvent) => this.props.node.onClick(event)}
			     style={(this.props.node.focused || this.props.node.selected) ? {backgroundColor: "white"} : {}}>

				<div className={optionRendererStyle(this.props.node.selected)}>
					<div className={`ll_h_c match_width`} style={{justifyContent: "space-between"}}>
						<div style={this.props.node.focused ? {fontWeight: "bold"} : {}}>{item.label}</div>
						{this.props.node.selected && <img src={require('@res/icons/icon__check.svg')} width={12}/>}
					</div>
				</div>
			</div>
		);
	}
}