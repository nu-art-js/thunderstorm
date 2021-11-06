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

import {AdapterBuilder, TreeItem} from "@nu-art/thunderstorm/frontend";
import {DropDown, DropDown_headerStyle, DropDown_inputStyle, DropDown_listStyle,} from "@nu-art/thunderstorm/app-frontend/components/DropDown";
import * as React from "react";
import {ICONS} from "@res/icons";
import {css} from "emotion";
import {flatPlaguesWithTitles, Plague, RendererMap_Plague} from "./consts";
import {PlaygroundExample_BodyStyle, PlaygroundExample_HeaderStyle} from "../consts";
import {PG_Example} from "../_core/PG_Example";


export class Example_Dropdown_MultiType
	extends React.Component<{}, { _selected?: Plague }> {

	state = {_selected: flatPlaguesWithTitles[2].item};

	onSelected = (plague: { item: Plague, type: any }) => {
		this.setState({_selected: plague.item});
	};

	render() {

		const adapter = AdapterBuilder()
			.list()
			.multiRender(RendererMap_Plague)
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
			style: {...DropDown_inputStyle, padding: "0 20px"},
			placeholder: this.state?._selected?.label
		}

		const valueRenderer = (selected?: TreeItem<Plague>) => {
			const style: React.CSSProperties = {backgroundColor: "lime", boxSizing: "border-box", height: "100%", width: "100%", padding: "4px 7px"};
			if (selected)
				return <div style={{...style, color: "red"}}>{selected?.item.label}</div>;
			return <div style={style}>CHOOSE</div>
		};
		const headerStylable = {style: {...DropDown_headerStyle, border: "solid 2px red", borderRadius: "5px 5px 0px 0px"}};
		const listStylable = {
			style: {
				...DropDown_listStyle,
				border: "solid 2px red",
				borderRadius: "0px 0px 5px 5px",
				borderTop: "none",
				top: 0,
				maxHeight: 90
			}
		};
		const caretItem = <div style={{backgroundColor: "lime", paddingRight: 8}}>
			<div style={{marginTop: 3}}>{ICONS.arrowOpen(undefined, 11)}</div>
		</div>;
		const caret = {open: caretItem, close: caretItem}
		return <div {...PlaygroundExample_BodyStyle}>
			<div {...PlaygroundExample_HeaderStyle}>Multiple renderers, flat list</div>
			<h4>Filter, 1 caret, default value,</h4>
			<h4>all renderers & custom inline style</h4>
			<h4>multiple renderers, flat list</h4>
			<DropDown
				adapter={adapter}
				onSelected={this.onSelected}
				selectedItemRenderer={valueRenderer}
				inputStylable={inputStylable}
				inputEventHandler={(_state, e) => {
					if (e.key === "Enter") {
						const newOption = _state.filteredOptions ? _state.filteredOptions[1] : _state.selected
						_state.selected = newOption;
						_state.open = false;
						newOption && this.onSelected(newOption)
					}
					return _state;
				}}
				filter={(item) => [(item as TreeItem<Plague>).item.label.toLowerCase()]}
				selected={flatPlaguesWithTitles[2]}
				caret={caret}
				headerStylable={headerStylable}
				listStylable={listStylable}
			/>
			<h4>{this.state?._selected ? `You chose ${this.state._selected.value}` : "You didn't choose yet"}</h4>
		</div>
	}
}


const name = "Dropdown - Multi Type";

export function Playground_DropdownMultiType() {
	return {
		renderer: () => <PG_Example name={name}> <Example_Dropdown_MultiType/> </PG_Example>,
		name
	};
}