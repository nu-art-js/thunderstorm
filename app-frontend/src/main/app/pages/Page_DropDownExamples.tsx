/*
 * A typescript & react boilerplate with api call example
 *
 * Copyright (C) 2018  Adam van der Kruk aka TacB0sS
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
	DropDown,
	NodeProps,
	TitleProps,
	InputProps,
	FilterInput
} from "@nu-art/thunderstorm/frontend";

const optionRendererWrapperStyle = css({":hover": {backgroundColor: "rgba(156, 156, 205, 0.3)"}});

const optionRendererStyle = (selected: boolean) => css(
	{
		fontSize: "13px",
		fontWeight: selected ? 500 : 200,
		color: selected ? "#00b5ff" : "#2f304f",
		margin: "0 5px",
		padding: "5px 0",
		borderBottom: "solid 1px #d8d8d880",
	});

const customInputStyle = (selected: boolean) => css(
	{
		backgroundColor: "lime",
		fontSize: 13,
		"::placeholder": {
			color: selected ? "red" : "black",
		}
	}
);

type Plague = {
	label: string,
	value: string
}

const plagues: Plague[] = [
	{label: 'Spanish Flu', value: 'spanishFlu'},
	{label: 'Smallpox', value: 'smallpox'},
	{label: 'Black Plague', value: 'blackPlague'},
	{label: 'Coronavirus', value: 'COVID-19'},
	{label: 'Internet', value: 'internet'},
];

export class Page_DropDownExamples
	extends React.Component<{}, { _selected: string }> {
	constructor(props: {}) {
		super(props);

		this.state = {_selected: ''}
	}

	onSelected = (plague: Plague) => {
		this.setState({_selected: plague.value});
	};


	render() {
		const itemRenderer = (props: NodeProps<Plague>) => <div className={optionRendererWrapperStyle}>
			<div className={optionRendererStyle(props.selected)}>
				<div className={`ll_h_c`} style={{justifyContent: "space-between"}}>
					<div>{props.item.label}</div>
					{props.selected && <div><img src={require('@res/images/icn-check.svg')}/></div>}
				</div>
			</div>
		</div>;

		const titleRenderer = (props: TitleProps<Plague>) => {
			const style: React.CSSProperties = {backgroundColor: "lime", boxSizing: "border-box", height: "100%", width: "100%", padding: "4px 7px"};
			if (props.selectedItem)
				return <div style={{...style, color: "red"}}>{props.selectedItem.label}</div>;
			return <div style={style}>{props.placeholder}</div>
		};

		const inputRenderer = (props: InputProps<Plague>) => (
			<FilterInput
				id={`comboInput`}
				filter={props.filter}
				list={props.list}
				onChange={props.onChange}
				focus={true}
				inputClassName={customInputStyle(!!this.state._selected)}
				inputStyle={props.inputStyle}
				placeholder={this.state._selected || props.placeholder}
			/>
		);

		return <>
			<h1>dropdowns</h1>
			<div className={'ll_h_t match_width'} style={{justifyContent: "space-around", height: 100}}>
				<div>
					<h4>Only defaults</h4>
					<DropDown
						options={plagues}
						itemRenderer={itemRenderer}
						onSelected={this.onSelected}
					/>
				</div>
				<div>
					<h4>With filter, 2 carets, placeholder & all renderers</h4>
					<DropDown
						options={plagues}
						itemRenderer={itemRenderer}
						onSelected={this.onSelected}
						titleRenderer={titleRenderer}
						inputRenderer={inputRenderer}
						filter={(item) => [item.label.toLowerCase()]}
						mainCaret={<div style={{backgroundColor: "lime", paddingRight: 8}}><img src={require('@res/images/icon__arrowOpen.svg')}/></div>}
						closeCaret={<div style={{backgroundColor: "lime", paddingRight: 8}}><img src={require('@res/images/icon__arrowClose.svg')}/></div>}
						placeholder={"Choose a plague"}
					/>
				</div>
				<div>
					<h4>With filter, 1 caret, default value & all renderers</h4>
					<DropDown
						options={plagues}
						itemRenderer={itemRenderer}
						onSelected={this.onSelected}
						titleRenderer={titleRenderer}
						inputRenderer={inputRenderer}
						filter={(item) => [item.label.toLowerCase()]}
						defaultSelect={{label: 'Black Plague', value: 'blackPlague'}}
						mainCaret={<div style={{backgroundColor: "lime", paddingRight: 8}}><img src={require('@res/images/icon__arrowOpen.svg')}/></div>}
					/>
				</div>
			</div>
			<h4>{this.state._selected ? `You chose ${this.state._selected}` : "You didn't choose yet"}</h4>
		</>;
	}
}
