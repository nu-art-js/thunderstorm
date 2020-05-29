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
import {
	_keys,
	generateHex
} from "@nu-art/ts-common";
import {RendererMap} from "../types/renderer-map";
import {FixedMenu} from "../modules/menu/FixedMenu";
import {MenuItemWrapper} from "../modules/menu/MenuModule";
import {KeyboardListener} from '../tools/KeyboardListener';

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

export const listStyle: React.CSSProperties = {
	boxSizing: "border-box",
	backgroundColor: "whitesmoke",
	border: "solid 1px",
	borderRadius: 5,
	display: "flex",
	flexFlow: "column",
	alignItems: "stretch",
	maxHeight: defaultListHeight,
	overflowX: "hidden",
	overflowY: "auto",
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

export type ListStyleProps = {
	listClassName?: string
	listStyle?: React.CSSProperties
}

export type ValueProps<ItemType> = {
	selected?: ItemType
	placeholder?: string
}

export type Refs = { [k: string]: React.RefObject<HTMLDivElement> };

type State<ItemType> = {
	filteredOptions: (ItemType | MenuItemWrapper<RendererMap, string>)[]
	open: boolean
	selected?: ItemType
	hover?: ItemType
}

export type DropDown_Node<ItemType> = {
	item: ItemType
	selected: boolean
	hover: boolean
}

export type DropDownItemRenderer<ItemType> = (props: DropDown_Node<ItemType>) => React.ReactNode
export type DropDownRendererMap<ItemType> = RendererMap | { [k: string]: DropDownItemRenderer<ItemType> }

export type SingleRendererAndOptions<ItemType> = {
	options: ItemType[] | (() => ItemType[]),
	itemRenderer: DropDownItemRenderer<ItemType>
}

export type MultipleRenderersAndOptions<ItemType> = {
	options: MenuItemWrapper<RendererMap, string>[] | (() => MenuItemWrapper<RendererMap, string>[]),
	rendererMap: { [key: string]: DropDownItemRenderer<ItemType> },
	avoidActionOnTypes?: string[]
}

export type RenderersAndOptions<ItemType> = SingleRendererAndOptions<ItemType> | MultipleRenderersAndOptions<ItemType>

type StaticProps = { id: string }

type Props<ItemType> = StaticProps & {
	renderersAndOptions: RenderersAndOptions<ItemType>
	onSelected: (selected: ItemType) => void
	selected?: ItemType
	filter?: (item: ItemType | MenuItemWrapper<RendererMap, string>) => string[]
	inputResolver?: (selected?: ItemType) => InputProps
	placeholder?: string

	headerStyleResolver?: HeaderStyleProps
	valueRenderer?: (props: ValueProps<ItemType>) => React.ReactNode
	mainCaret?: React.ReactNode
	closeCaret?: React.ReactNode

	listStyleResolver?: ListStyleProps

}

export class DropDown<ItemType>
	extends React.Component<Props<ItemType>, State<ItemType>> {

	static defaultProps: Partial<StaticProps> = {
		id: generateHex(8),
	};
	private node: any = null;
	private headerStyleResolver: HeaderStyleProps = {headerStyle};
	private listStyleResolver: ListStyleProps = {listStyle};

	constructor(props: Props<ItemType>) {
		super(props);
		const options = this.props.renderersAndOptions.options;
		this.state = {
			filteredOptions: Array.isArray(options) ? options : options(),
			open: false,
			selected: this.props.selected,
		};
	}

	componentDidMount() {
		document.addEventListener('mousedown', this.handleMouseClick);
	}

	componentWillUnmount() {
		document.removeEventListener('mousedown', this.handleMouseClick);
	}

	isSingleRendererAndOptions = (checkedItem: RenderersAndOptions<ItemType>): checkedItem is SingleRendererAndOptions<ItemType> => !!(checkedItem as SingleRendererAndOptions<ItemType>).itemRenderer;

	toggleList = (e: React.MouseEvent) => {
		e.stopPropagation();
		e.preventDefault();

		this.setState(prevState => ({open: !prevState.open}));
		// this.renderMenu();
	};

	onSelected = (e: MouseEvent | React.MouseEvent, item: ItemType) => {
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
			<KeyboardListener onKeyboardEventListener={this.keyEventHandler}>
				<div ref={node => this.node = node} id={this.props.id} style={wrapperStyle}>
					{this.renderHeader()}
					{this.renderTree()}
				</div>
			</KeyboardListener>)
	}

	private keyEventHandler = (node: HTMLDivElement, e: KeyboardEvent) => {
		console.log('lala                 ')
		if (e.code === "Escape")
			return this.setState({open: false});

		if (e.code === "ArrowDown") {
			node.blur();
			return document.getElementById(`${this.props.id}-listener`)?.focus()
		}

	};

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
		const options = this.props.renderersAndOptions.options;
		return (<FilterInput<ItemType | MenuItemWrapper<RendererMap, string>>
			id={this.props.id}
			filter={this.props.filter}
			list={Array.isArray(options) ? () => options : options}
			onChange={(filtered: (ItemType | MenuItemWrapper<RendererMap, string>)[]) => this.setState(() => ({filteredOptions: filtered}))}
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

		if (!this.isSingleRendererAndOptions(this.props.renderersAndOptions)) {
			const options = typeof this.props.renderersAndOptions.options === 'function' ? this.props.renderersAndOptions.options() : this.props.renderersAndOptions.options;
			// @ts-ignore
			const type = options.find(item => item.item === props.selected).type;

			const rm = this.props.renderersAndOptions.rendererMap;
			// @ts-ignore
			const Renderer = rm[Object.keys(rm).find((key: string) => key === type)];

			return Renderer({item: props.selected, selected: true, hover: false});
		}
		return (this.props.renderersAndOptions.itemRenderer)({item: props.selected, selected: true, hover: false})
	};

	private renderValue = () => (
		<div className={'match_width'}>
			{(this.props.valueRenderer || this.valueRenderer)({selected: this.state.selected, placeholder: this.props.placeholder})}
		</div>);


	private renderCaret = () => {
		if (!this.props.mainCaret)
			return <></>;

		const closeCaret = this.props.closeCaret || this.props.mainCaret;
		return this.state.open ? closeCaret : this.props.mainCaret;
	};

	// private renderOptions = () => {
	// 	if (!this.state.open)
	// 		return "";
	//
	// 	const Renderer = this.props.itemRenderer;
	// 	const items = this.state.filteredOptions;
	//
	// 	return <div style={listContainerStyle}>
	// 		<div style={listStyle}>
	// 			{items.length === 0 ?
	// 				<div style={{opacity: 0.5, margin: "auto"}}>No options</div>
	// 				:
	// 				<>{items.map((item, index) => (
	// 					<div key={index}
	// 					     tabIndex={0}
	// 					     onMouseEnter={() => this.setState({hover: item})}
	// 					     onMouseLeave={() => this.setState({hover: undefined})}
	// 					     onMouseDown={(e: React.MouseEvent) => {
	// 						     e.stopPropagation();
	// 						     e.preventDefault();
	// 					     }}
	// 					     onMouseUp={(e: React.MouseEvent) => {
	// 						     e.stopPropagation();
	// 						     e.preventDefault();
	// 						     this.onSelected(e, item);
	// 					     }}
	// 					     className={'clickable match_width'}>
	// 						{Renderer({item: item, selected: item === this.state.selected, hover: this.state.hover === item})}
	// 					</div>
	// 				))}</>
	// 			}
	// 		</div>
	// 	</div>
	// };

	private listElementWrapper = (renderer: React.ReactNode, item: ItemType, allowAction: boolean = true) => <div
		onMouseEnter={() => this.setState({hover: item})}
		onMouseLeave={() => this.setState({hover: undefined})}
		onMouseUp={(e: React.MouseEvent) => allowAction && this.onSelected(e, item)}
		className={`${allowAction ? `clickable` : ''} match_width`}>
		{renderer}</div>;

	private funcCreator = (renderer: DropDownItemRenderer<ItemType>, allowAction: boolean) =>
		(item: DropDown_Node<ItemType>) => this.listElementWrapper(
			renderer({item: item.item, selected: allowAction && item.item === this.state.selected, hover: allowAction && item.item === this.state.hover}),
			item.item,
			allowAction);

	private renderTree = () => {
		if (!this.state.open)
			return "";

		const items = this.state.filteredOptions;
		let rendererMap: DropDownRendererMap<ItemType> | { [key: string]: React.ReactNode };
		let _children: MenuItemWrapper<RendererMap, string>[];

		if (this.isSingleRendererAndOptions(this.props.renderersAndOptions)) {
			rendererMap = {
				normal: (item: DropDown_Node<ItemType>) => this.listElementWrapper(
					((this.props.renderersAndOptions as SingleRendererAndOptions<ItemType>).itemRenderer)(
						{item: item.item, selected: (item.item === this.state.selected), hover: item.item === this.state.hover}), item.item)
			};

			_children = _keys(items).map(item => ({
				item: items[item],
				type: 'normal'
			}));
		} else {
			rendererMap = this.props.renderersAndOptions.rendererMap;
			const allowAction = (el: string, avoidAction: string[] = []): boolean => !avoidAction.includes(el);
			const _avoidAction = this.props.renderersAndOptions.avoidActionOnTypes;
			Object.keys(rendererMap).forEach(
				(el) => rendererMap[el] = this.funcCreator(rendererMap[el] as DropDownItemRenderer<ItemType>, allowAction(el, _avoidAction)));

			_children = items as MenuItemWrapper<RendererMap, string>[];
		}

		const listComplementary = (this.props.listStyleResolver || this.listStyleResolver);

		return <div style={listContainerStyle}>
			<div className={listComplementary.listClassName}>
				{items.length === 0 ?
					<div style={{...listComplementary.listStyle || (!listComplementary.listClassName ? listStyle : {}), alignItems: "center", opacity: 0.5}}>No
						options</div>
					:
					<FixedMenu id={this.props.id}
					           menu={{rendererMap, _children}}
					           childrenContainerStyle={listComplementary.listStyle || (!listComplementary.listClassName ? listStyle : {})}/>
				}
			</div>
		</div>
	}
}