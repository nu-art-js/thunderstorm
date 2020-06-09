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

import * as React from "react";
import {css} from "emotion";
import {
	DropDown,
	DropDown_Node,
	InputProps,
	HeaderStyleProps,
	ValueProps,
	inputStyle,
	headerStyle,
	ListStyleProps,
	listStyle,
	DropDownItemRenderer,
	MenuItemWrapper,
	RendererMap
} from "@nu-art/thunderstorm/frontend";
import {ICONS} from "@res/icons";

// const optionRendererWrapperStyle = css({":hover": {backgroundColor: "lime"}});

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
	});

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

const plaguesWithTitles: MenuItemWrapper<RendererMap, string>[] = [
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

export class Example_DropDown
	extends React.Component<{}, { _selected: string }> {
	constructor(props: {}) {
		super(props);

		this.state = {_selected: ''}
	}

	onSelected = (plague: Plague) => {
		this.setState({_selected: plague.value});
	};


	render() {
		const itemRenderer = (props: DropDown_Node<Plague>) => <div style={props.hover ? {backgroundColor: "lime"} : {}}>
			<div className={optionRendererStyle(props.selected)}>
				<div className={`ll_h_c`} style={{justifyContent: "space-between"}}>
					<div>{props.item.label}</div>
					{props.selected && <div>{ICONS.check(undefined, 14)}</div>}
				</div>
			</div>
		</div>;
		const titleRender = (props: DropDown_Node<Plague>) => <div style={{backgroundColor: "lightgray"}} onClick={() => {
			return
		}}>
			<div className={optionRendererStyle(props.selected)} style={{color: "yellow"}}>
				<div className={`ll_h_c`} style={{justifyContent: "space-between"}}>
					<div>{props.item.label}</div>
				</div>
			</div>
		</div>;
		const rendererMap: { [key: string]: DropDownItemRenderer<Plague> } = {
			normal: itemRenderer,
			title: titleRender
		};

		const valueRenderer = (props: ValueProps<Plague>) => {
			const style: React.CSSProperties = {backgroundColor: "lime", boxSizing: "border-box", height: "100%", width: "100%", padding: "4px 7px"};
			if (props.selected)
				return <div style={{...style, color: "red"}}>{props.selected.label}</div>;
			return <div style={style}>{props.placeholder}</div>
		};

		const inputResolver = (selected?: Plague): InputProps => (
			{
				className: customInputStyle(!!selected),
				inputStyle,
				placeholder: this.state._selected
			}
		);

		const inputResolverWithCustomInlineStyle = (selected?: Plague): InputProps => (
			{
				className: customInputStyle(!!selected),
				inputStyle: {...inputStyle, padding: "0 20px"},
				placeholder: this.state._selected
			}
		);

		const headerResolverClass: HeaderStyleProps = {headerStyle, headerClassName: css({boxShadow: "5px 10px #888888"})};
		const headerResolverStyle: HeaderStyleProps = {headerStyle: {...headerStyle, border: "solid 2px red", borderRadius: "5px 5px 0px 0px"}};
		const listResolverStyle: ListStyleProps = {
			listStyle: {
				...listStyle,
				border: "solid 2px red",
				borderRadius: "0px 0px 5px 5px",
				borderTop: "none",
				top: 0,
				maxHeight: 90
			}
		};

		return <>
			<h1>dropdowns</h1>
			<div className={'ll_h_t match_width'} style={{justifyContent: "space-around", height: 100}}>
				<div>
					<h4>Only defaults</h4>
					<DropDown
						renderersAndOptions={{options: plagues, itemRenderer}}
						onSelected={this.onSelected}
					/>
				</div>
				<div>
					<h4>Filter, 2 carets, placeholder & all renderers</h4>
					<DropDown
						renderersAndOptions={{options: plagues, itemRenderer}}
						onSelected={this.onSelected}
						valueRenderer={valueRenderer}
						inputResolver={inputResolver}
						filter={(item) => [(item as Plague).label.toLowerCase()]}
						mainCaret={<div style={{backgroundColor: "lime", paddingRight: 8}}>{ICONS.arrowOpen(undefined, 14)}</div>}
						closeCaret={<div style={{backgroundColor: "lime", paddingRight: 8}}>{ICONS.arrowClose(undefined, 14)}</div>}
						placeholder={"Choose a plague"}
						headerStyleResolver={headerResolverClass}
					/>
				</div>
				<div>
					<h4>Filter, 1 caret, default value, all renderers & custom inline style</h4>
					<DropDown
						renderersAndOptions={{options: plaguesWithTitles, rendererMap, avoidActionOnTypes: ['title']}}
						onSelected={this.onSelected}
						valueRenderer={valueRenderer}
						inputResolver={inputResolverWithCustomInlineStyle}
						filter={(item) => [(item as MenuItemWrapper<RendererMap, string>).item.label.toLowerCase()]}
						selected={plagues[2]}
						mainCaret={<div style={{backgroundColor: "lime", paddingRight: 8}}>{ICONS.arrowOpen(undefined, 14)}</div>}
						headerStyleResolver={headerResolverStyle}
						listStyleResolver={listResolverStyle}
					/>
				</div>
			</div>
			<h4>{this.state._selected ? `You chose ${this.state._selected}` : "You didn't choose yet"}</h4>
		</>;
	}
}
