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

import * as React from "react";
import {css} from "emotion";
import {
	ItemToRender,
	RendererMap,
	TreeRendererProps
} from "@nu-art/thunderstorm/frontend";
import {ICONS} from "@res/icons";
import {Example_DefaultsDropDown} from "./Example_DefaultsDropDown";
import {Example_SingleRendererDropDown} from "./Example_SingleRendererDropDown";
// import {Example_MultiRendererDropDown} from "./Example_MultiRendererDropDown";

// const optionRendererWrapperStyle = css({":hover": {backgroundColor: "lime"}});

export const optionRendererStyle = (selected: boolean) => css(
	{
		fontSize: "13px",
		fontWeight: selected ? 500 : 200,
		color: selected ? "#00b5ff" : "#2f304f",
		margin: "0 5px",
		padding: "5px 0",
		borderBottom: "solid 1px #d8d8d880",
	});

export const customInputStyle = (selected: boolean) => css(
	{
		backgroundColor: "lime",
		fontSize: 13,
		"::placeholder": {
			color: selected ? "red" : "black",
		}
	});

export type Plague = {
	label: string,
	value: string
}

export const plagues: Plague[] = [
	{label: 'Spanish Flu', value: 'spanishFlu'},
	{label: 'Smallpox', value: 'smallpox'},
	{label: 'Black Plague', value: 'blackPlague'},
	{label: 'Coronavirus', value: 'COVID-19'},
	{label: 'Internet', value: 'internet'},
];

export const plaguesWithTitles: ItemToRender<RendererMap, string>[] = [
	{
		item: {label: 'Phisical', value: 'title'},
		_children: [
			{
				item: {label: 'kaki', value: 'kaka'},
				type: "title"
			},
			{
				item: {label: 'zevel', value: 'pah'},
				type: "normal"
			},
		],
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

export class Example_DropDowns
	extends React.Component<{}, { _selected: string }> {
	constructor(props: {}) {
		super(props);

		this.state = {_selected: ''}
	}

	onSelected = (plague: Plague) => {
		this.setState({_selected: plague.value});
	};


	render() {
		return <>
			<h1>dropdowns</h1>
			<div className={'ll_h_t match_width'} style={{justifyContent: "space-around", height: 100}}>
				<Example_DefaultsDropDown/>
				<Example_SingleRendererDropDown/>
				{/*<Example_MultiRendererDropDown/>*/}
			</div>
			{/*<h4>{this.state._selected ? `You chose ${this.state._selected}` : "You didn't choose yet"}</h4>*/}
		</>;
	}
}

export class ItemRenderer
	extends React.Component<TreeRendererProps> {

	render() {
		if (typeof this.props.item !== "object")
			return null;

		return (
			<div className="ll_h_c clickable"
			     id={this.props.node.path}
			     onClick={(event: React.MouseEvent) => this.props.node.onClick(event)}
			     style={this.props.node.focused ? {backgroundColor: "lime"} : {}}>

				<div className={optionRendererStyle(this.props.node.focused)}>
					<div className={`ll_h_c`} style={{justifyContent: "space-between"}}>
						<div>{this.props.item.label}</div>
						{this.props.node.focused && <div>{ICONS.check(undefined, 14)}</div>}
					</div>
				</div>
			</div>
		);
	}
}