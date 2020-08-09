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
	AdapterBuilder,
	BaseNodeRenderer,
	FlatItemToRender,
	NodeRendererProps,
	TreeRendererMap,
} from "@nu-art/thunderstorm/frontend";
import {
	DropDown,
	headerStyle,
	inputStyle,
	listStyle,
} from "@nu-art/thunderstorm/app-frontend/components/DropDown";
import * as React from "react";
import {
	optionRendererStyle,
	Plague,
} from "./Example_DropDowns";
import {ICONS} from "@res/icons";
import {css} from "emotion";

export class FlatItemRenderer
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

export class FlatTitleRender
	extends React.Component<NodeRendererProps<Plague>> {

	render() {
		return (
			<div style={{backgroundColor: "lightgray"}}>
				<div className={optionRendererStyle(false)} style={{color: "yellow"}}>
					<div className={`ll_h_c`} style={{justifyContent: "space-between"}}>
						<div>{this.props.item.label}</div>
					</div>
				</div>
			</div>
		);
	}
}


export const flatRendererMap: TreeRendererMap = {
	normal: FlatItemRenderer,
	title: FlatTitleRender
};

export const flatPlaguesWithTitles: FlatItemToRender<TreeRendererMap>[] = [
	{
		item: {label: 'Phisical', value: 'title'},
		type: "title"
	},
	{
		item: {label: 'Spanish Flu', value: 'spanishFlu'},
		type: "normal"
	},
	{
		item: {label: 'Smallpox', value: 'smallpox'},
		type: "normal"
	},
	{
		item: {label: 'Black Plague', value: 'blackPlague'},
		type: "normal"
	},
	{
		item: {label: 'Coronavirus', value: 'COVID-19'},
		type: "normal"
	},
	{
		item: {label: 'Virtual', value: 'title'},
		type: "title"
	},
	{
		item: {label: 'Facebook', value: 'facebook'},
		type: "normal"
	},
	{
		item: {label: 'Tik tok', value: 'tiktok'},
		type: "normal"
	},
];

export class Example_MultiRendererDropDown
	extends React.Component<{}, { _selected?: Plague }> {

	state = {_selected: flatPlaguesWithTitles[2].item};

	onSelected = (plague: { item: Plague, type: any }) => {
		this.setState({_selected: plague.item});
	};

	render() {

		const adapter = AdapterBuilder()
			.list()
			.multiRender(flatRendererMap)
			.setData(flatPlaguesWithTitles)
			.noGeneralOnClick()
			.build();

		const inputStylable = {
			className: css(
				{
					backgroundColor: "lime",
					fontSize: 13,
					"::placeholder": {
						color: "red",
					}
				}),
			style:{...inputStyle, padding: "0 20px"},
			placeholder:this.state?._selected?.label
		}

		const valueRenderer = (selected: FlatItemToRender<TreeRendererMap>["item"]) => {
			const style: React.CSSProperties = {backgroundColor: "lime", boxSizing: "border-box", height: "100%", width: "100%", padding: "4px 7px"};
			if (selected)
				return <div style={{...style, color: "red"}}>{selected?.item?.label}</div>;
			return <div style={style}>CHOOSE</div>
		};
		const headerStylable = {style: {...headerStyle, border: "solid 2px red", borderRadius: "5px 5px 0px 0px"}};
		const listStylable = {
			style: {
				...listStyle,
				border: "solid 2px red",
				borderRadius: "0px 0px 5px 5px",
				borderTop: "none",
				top: 0,
				maxHeight: 90
			}
		};
		let caretItem = <div style={{backgroundColor: "lime", paddingRight: 8}}>
			<div style={{marginTop: 3}}>{ICONS.arrowOpen(undefined, 11)}</div>
		</div>;
		const caret = {open: caretItem, close: caretItem}
		return <div>
			<h4>Filter, 1 caret, default value,</h4>
			<h4>all renderers & custom inline style</h4>
			<h4>multiple renderers, flat list</h4>
			<DropDown
				adapter={adapter}
				onSelected={this.onSelected}
				selectedItemRenderer={valueRenderer}
				inputStylable={inputStylable}
				inputEventHandler={(_state, e) => {
					if (e.code === "Enter") {
						const newOption = _state.filteredOptions ? _state.filteredOptions[1] : _state.selected
						_state.selected = newOption;
						_state.open = false;
						newOption && this.onSelected(newOption)
					}
					return _state;
				}}
				filter={(item) => [(item as FlatItemToRender<TreeRendererMap>).item.label.toLowerCase()]}
				selected={flatPlaguesWithTitles[2]}
				caret={caret}
				headerStylable={headerStylable}
				listStylable={listStylable}
			/>
			<h4>{this.state?._selected ? `You chose ${this.state._selected.value}` : "You didn't choose yet"}</h4>
		</div>
	}
}