/*
 * Thunderstorm is a full web app framework!
 *
 * Typescript & Express backend infrastructure that natively runs on firebase function
 * Typescript & React frontend infrastructure
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

import * as React from 'react';
import {FilterInput} from "./FilterInput";
import {_keys} from "@nu-art/ts-common";
import {MenuBuilder} from "../modules/menu/MenuModule";

const defaultWidth = "222px";
const defaultTitleHeight = "28px";
const defaultListHeight = "150px";

const wrapperStyle: React.CSSProperties = {
	display: "inline-block"
};

export const headerStyle: React.CSSProperties = {
	display: "flex",
	boxSizing: "border-box",
	position: "relative",
	border: "solid 1px",
	borderRadius: 2,
	color: "black",
	backgroundColor: "white",
	width: defaultWidth,
	height: defaultTitleHeight,
};

export const inputStyle: React.CSSProperties = {
	border: "unset",
	boxSizing: "border-box",
	outline: "none",
	padding: "0 5px",
	width: "100%",
};

const listContainerStyle: React.CSSProperties = {
	display: "inline-block",
	position: "absolute",
	zIndex: 10,
};

const listStyle: React.CSSProperties = {
	boxSizing: "border-box",
	backgroundColor: "whitesmoke",
	border: "solid 1px",
	borderRadius: 5,
	display: "flex",
	flexFlow: "column",
	alignItems: "flex-start",
	maxHeight: defaultListHeight,
	position: "relative",
	top: 5,
	width: defaultWidth,
};

export type HeaderStyleProps = {
	headerClassName?: string
	headerStyle?: React.CSSProperties
}

export type InputProps = {
	inputClassName?: string
	inputStyle?: React.CSSProperties
	placeholder?: string
}

export type ValueProps<ItemType> = {
	selected?: ItemType
	placeholder?: string
}

type State<ItemType> = {
	filteredOptions: ItemType[]
	open: boolean
	selected?: ItemType
	hover?: ItemType
}

export type DropDown_Node<ItemType> = {
	item: ItemType
	selected: boolean
	hover: boolean
}

export type DropDownRendererMap<ItemType> = { [key: string]: (props: DropDown_Node<ItemType>) => React.ReactNode }

type Props<ItemType> = {
	id?: string
	options: ItemType[] | (() => ItemType[])
	onSelected: (selected: ItemType) => void
	selected?: ItemType
	itemRenderer: (props: DropDown_Node<ItemType>) => React.ReactNode

	filter?: (item: ItemType) => string[]
	inputResolver?: (selected?: ItemType) => InputProps
	placeholder?: string

	headerStyleResolver?: HeaderStyleProps
	valueRenderer?: (props: ValueProps<ItemType>) => React.ReactNode
	mainCaret?: React.ReactNode
	closeCaret?: React.ReactNode

}

export class DropDown<ItemType>
	extends React.Component<Props<ItemType>, State<ItemType>> {

	private node: any = null;
	private headerStyleResolver: HeaderStyleProps = {headerStyle};

	constructor(props: Props<ItemType>) {
		super(props);
		const options = this.props.options;
		this.state = {
			filteredOptions: Array.isArray(options) ? options : options(),
			open: false,
			selected: props.selected,
		};
	}

	componentDidMount() {
		document.addEventListener('mousedown', this.handleMouseClick);
	}

	componentWillUnmount() {
		document.removeEventListener('mousedown', this.handleMouseClick);
	}

	toggleList = (e: React.MouseEvent) => {
		e.stopPropagation();
		e.preventDefault();


		this.renderMenu();
		// this.setState(prevState => ({open: !prevState.open}));
	};

	onSelected = (e: React.MouseEvent, item: ItemType) => {
		e.stopPropagation();
		e.preventDefault();

		this.setState(prevState => ({
			open: !prevState.open,
			selected: item
		}));

		this.props.onSelected(item);
	};

	render() {
		return (
			<div ref={node => this.node = node} id={this.props.id} style={wrapperStyle}>
				{this.renderHeader()}
				{this.renderOptions()}
			</div>)
	}

	private renderHeader = () => {
		const headerComplementary = (this.props.headerStyleResolver || this.headerStyleResolver);
		return (
			<div
				className={headerComplementary.headerClassName}
				style={headerComplementary.headerStyle || (!headerComplementary.headerClassName ? headerStyle : {})}
				onClick={this.toggleList}>
				{this.renderField()}
				{this.renderCaret()}
			</div>);
	};

	private renderField = () => {
		if (!this.state.open || !this.props.filter)
			return this.renderValue();

		const inputComplementary = (this.props.inputResolver || this.inputResolver)(this.state.selected);
		const options = this.props.options;
		return (<FilterInput
			id={this.props.id}
			filter={this.props.filter}
			list={Array.isArray(options) ? () => options : options}
			onChange={(filtered: ItemType[]) => this.setState(() => ({filteredOptions: filtered}))}
			focus={true}
			inputClassName={inputComplementary.inputClassName}
			inputStyle={inputComplementary.inputStyle || (!inputComplementary.inputClassName ? inputStyle : {})}
			placeholder={inputComplementary.placeholder || this.props.placeholder}
		/>);
	};

	private inputResolver = (selected?: ItemType): InputProps => ({inputStyle, placeholder: this.props.placeholder});

	private handleMouseClick = (e: MouseEvent) => {
		if (this.node && this.node.contains(e.target)) {
			return;
		}
		this.setState({open: false});
	};

	private valueRenderer: (props: ValueProps<ItemType>) => React.ReactNode = (props: ValueProps<ItemType>) => {
		if (!props.selected)
			return <div>{this.props.placeholder}</div>

		return this.props.itemRenderer({item: props.selected, selected: true, hover: false})
	};

	private renderValue = () => (
		<div style={{width: "100%"}}>
			{(this.props.valueRenderer || this.valueRenderer)({selected: this.state.selected, placeholder: this.props.placeholder})}
		</div>);


	private renderCaret = () => {
		if (!this.props.mainCaret)
			return <></>;

		const closeCaret = this.props.closeCaret || this.props.mainCaret;
		return this.state.open ? closeCaret : this.props.mainCaret;
	};

	private renderOptions = () => {
		if (!this.state.open)
			return "";

		const Renderer = this.props.itemRenderer;
		const items = this.state.filteredOptions;

		return <div style={listContainerStyle}>
			<div style={listStyle}>
				{items.length === 0 ?
					<div style={{opacity: 0.5, margin: "auto"}}>No options</div>
					:
					<>{items.map((item, index) => (
						<div key={index}
						     tabIndex={0}
						     onMouseEnter={() => this.setState({hover: item})}
						     onMouseLeave={() => this.setState({hover: undefined})}
						     onMouseDown={(e: React.MouseEvent) => {
							     e.stopPropagation();
							     e.preventDefault();
						     }}
						     onMouseUp={(e: React.MouseEvent) => {
							     e.stopPropagation();
							     e.preventDefault();
							     this.onSelected(e, item);
						     }}
						     className={'clickable match_width'}>
							{Renderer({item: item, selected: item === this.state.selected, hover: this.state.hover === item})}
						</div>
					))}</>
				}
			</div>
		</div>
	};

	private renderMenu = () => {

		const Renderer = this.props.itemRenderer;
		const items = this.state.filteredOptions;

		const rendererMap: DropDownRendererMap<ItemType> = {
			normal: (el: DropDown_Node<ItemType>) => Renderer(el)
		};
		const _children = _keys(items).map(item => ({
				item: items[item],
				type: 'normal'
			}));

		new MenuBuilder({rendererMap, _children})
		.setId(this.props.id || '')
		.show()
	}


}