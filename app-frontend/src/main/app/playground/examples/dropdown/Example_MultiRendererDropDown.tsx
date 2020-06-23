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
	RendererMap,
	TreeRendererProps
} from "@nu-art/thunderstorm/frontend";
import {
	DropDown,
	headerStyle,
	HeaderStyleProps,
	InputProps,
	inputStyle,
	listStyle,
	ListStyleProps,
	ValueProps
} from "@nu-art/thunderstorm/app-frontend/components/DropDown";
import * as React from "react";
import {
	customInputStyle,
	ItemRenderer,
	optionRendererStyle,
	Plague,
	plagues,
	plaguesWithTitles
} from "./Example_DropDowns";
import {MultiTypeAdapter} from "@nu-art/thunderstorm/frontend";
import {ICONS} from "@res/icons";
import {stopPropagation} from "@nu-art/thunderstorm/app-frontend/utils/tools";

export class Example_MultiRendererDropDown
	extends React.Component<{}, { _selected: string }> {

	state = {_selected: ''};

	onSelected = (plague: Plague) => {
		this.setState({_selected: plague.value});
	};

	render() {
		const rendererMap: RendererMap<TreeRendererProps<Plague>> = {
			normal: ItemRenderer,
			title: TitleRender
		};
		const adapter = new MultiTypeAdapter(plaguesWithTitles, rendererMap).setTreeNodeRenderer(Example_NodeRenderer_HoverToExpand);
		const inputResolverWithCustomInlineStyle = (selected?: Plague): InputProps => (
			{
				className: customInputStyle(!!selected),
				inputStyle: {...inputStyle, padding: "0 20px"},
				placeholder: this.state._selected
			}
		);
		const valueRenderer = (props: ValueProps<Plague>) => {
			const style: React.CSSProperties = {backgroundColor: "lime", boxSizing: "border-box", height: "100%", width: "100%", padding: "4px 7px"};
			if (props.selected)
				return <div style={{...style, color: "red"}}>{props.selected.label}</div>;
			return <div style={style}>{props.placeholder}</div>
		};
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
		return <div>
			<h4>Filter, 1 caret, default value,</h4>
			<h4>all renderers & custom inline style</h4>
			<h4>multiple renderers</h4>
			<DropDown
				adapter={adapter}
				// renderersAndOptions={{options: plaguesWithTitles, rendererMap, avoidActionOnTypes: ['title']}}
				onSelected={this.onSelected}
				valueRenderer={valueRenderer}
				inputResolver={inputResolverWithCustomInlineStyle}
				// filter={(item) => [(item as ItemToRender<RendererMap, string>).item.label.toLowerCase()]}
				selected={plagues[2]}
				mainCaret={<div style={{backgroundColor: "lime", paddingRight: 8}}>{ICONS.arrowOpen(undefined, 14)}</div>}
				headerStyleResolver={headerResolverStyle}
				listStyleResolver={listResolverStyle}
			/>
		</div>
	}
}

class TitleRender
	extends React.Component<TreeRendererProps<Plague>> {

	render() {
		return (
			<div style={{backgroundColor: "lightgray"}} onClick={() => console.log("pah")}>
				<div className={optionRendererStyle(this.props.node.focused)} style={{color: "yellow"}}>
					<div className={`ll_h_c`} style={{justifyContent: "space-between"}}>
						<div>{this.props.item.label}</div>
					</div>
				</div>
			</div>
		);
	}
}

class Example_NodeRenderer_HoverToExpand
	extends React.Component<TreeRendererProps> {

	constructor(props: TreeRendererProps) {
		super(props);
	}

	render() {
		const item = this.props.item.item;
		const Renderer = this.props.node.adapter.resolveRenderer(this.props.item.type);
		if (!Renderer)
			return "";

		const hasChildren = Array.isArray(this.props.item) && this.props.item.length > 0;

		return (
			<div
				className="ll_h_c clickable"
				id={this.props.node.path}
				onMouseEnter={(e) => this.props.node.expandToggler(e, true)}
				onMouseLeave={(e) => this.props.node.expandToggler(e, false)}
				onMouseDown={stopPropagation}
				onMouseUp={(e) => this.props.node.onClick(e)}>

				<Renderer node={this.props.node} item={item}/>
				{hasChildren && <div>{">"}</div>}
			</div>
		);
	};
}
