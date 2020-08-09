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
import {css} from 'emotion';
import {
	Plague,
	plagues
} from "./Example_DropDowns";
import {AdapterBuilder} from "@nu-art/thunderstorm/app-frontend/components/adapter/Adapter";
import {NodeRendererProps} from "@nu-art/thunderstorm/app-frontend/components/adapter/BaseRenderer";
import {
	DropDown,
	headerStyle,
	inputStyle,
	listStyle,
	Stylable,
} from "@nu-art/thunderstorm/frontend";
import {generateHex} from "@nu-art/ts-common";
import {ICONS} from "@res/icons";

export class OstudioEx
	extends React.Component<{}, { _selected?: Plague }> {

	onSelected = (plague: Plague) => {
		this.setState({_selected: plague});
	};

	render() {
		return <>{AppDropDown(
			{
				options: plagues,
				labelResolver: (plague: Plague) => plague.label,
				onSelected: this.onSelected,
				// error: true
				// selected: plagues[2],
				filter: (plague: Plague) => [plague.label],
				// width: DropdownWidth.Short,
				// width: 444
			})}
			<h4>you chose {this.state?._selected?.value}</h4>
		</>;
	}
}

export enum DropdownWidth {
	Long  = 255,
	Short = 162
}

const optionRendererStyle = (focused: boolean, selected: boolean) => css(
	{
		display: "flex",
		alignItems: "center",
		height: 32,
		width: "100%",
		fontWeight: focused ? "bold" : "inherit",
		backgroundColor: selected ? "#edf2f6" : "inherit",
		fontSize: 14,
		color: "#001636",
		paddingLeft: 14
	});

const listResolverStyle = (width: number = DropdownWidth.Long): Stylable => ({
	style: {
		...listStyle,
		backgroundColor: "#fff",
		border: "unset",
		borderRadius: 2,
		boxShadow: "0 0 7px 0 rgba(0, 0, 0, 0.2)",
		top: 6,
		maxHeight: "unset",
		height: "max-content",
		padding: "5px 0",
		width: width
	}
});

export const inputClassName = css(
	{
		fontSize: 14,
		color: "#001636",
		paddingLeft: 9,
		"::placeholder": {
			color: "#959ca5",
			fontSize: 14,
			fontStyle: "italic",
			// paddingLeft: selected ? 9 : 10
		}
	});

export type DropdownProps<ItemType> = {
	id?: string,
	options: ItemType[],
	labelResolver: (item: ItemType) => string,
	selected?: ItemType,
	onSelected: (selected: ItemType) => void
	filter?: (item: ItemType) => string[]
	placeholder?: string,
	width?: DropdownWidth | number
	error?: boolean
}

export const AppDropDown = <T extends any = any>(props: DropdownProps<T>) => {

	props.id = props.id ? props.id : generateHex(8);

	const optionRenderer = (nodeProps: NodeRendererProps<T>) => (
		<div id={`${props.id}=${nodeProps.node.path}`} className={`ll_h_c clickable ${optionRendererStyle(nodeProps.node.focused, nodeProps.node.selected)}`}>
			{props.labelResolver(nodeProps.item)}
		</div>

	);

	const valueRenderer = (selected?: T) => (
		<div id={`${props.id}-val`} className={`ll_h_c clickable ${optionRendererStyle(false, false)}`}
		     style={selected ? {paddingLeft: 9} : {color: "#959ca5", paddingLeft: 10, fontSize: 11, fontStyle: "italic"}}>
			{selected ? props.labelResolver(selected) : 'choose'}
		</div>
	);

	const headerResolverStyle: Stylable = {
		style: {
			...headerStyle,
			border: `solid 1px ${props.error ? "#de3728" : "#cbd3dd"}`,
			borderRadius: 2,
			height: 32,
			paddingRight: 7,
			width: props.width || DropdownWidth.Long
		}
	};

	const adapter = AdapterBuilder()
		.list()
		.singleRender(optionRenderer)
		.setData(props.options)
		.build();

	const caret = {open: ICONS.arrowheadFullUp("#8392a6"), close: ICONS.arrowheadFullDown("#8392a6")};
	return <DropDown<T>
		id={props.id}
		adapter={adapter}
		selected={props.selected}
		onSelected={props.onSelected}
		filter={props.filter}
		caret={caret}
		inputStylable={{
			style: inputStyle,
			className: inputClassName,
			placeholder: props.selected ? props.labelResolver(props.selected) : props.placeholder || 'choose'
		}}
		selectedItemRenderer={valueRenderer}
		listStylable={listResolverStyle(props.width)}
		headerStylable={headerResolverStyle}
	/>
};