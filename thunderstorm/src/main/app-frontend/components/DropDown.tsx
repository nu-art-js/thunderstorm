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
import {KeyboardListener} from '../tools/KeyboardListener';
import {stopPropagation} from "../utils/tools";
import {Adapter,} from "./adapter/Adapter";
import {Tree} from "./tree/Tree";

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
	className?: string
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

type State<ItemType> = {
	filteredOptions: (ItemType)[]
	open: boolean
	selected?: ItemType
	hover?: ItemType
}

// export type DropDown_Node<ItemType> = {
// 	item: ItemType
// 	selected: boolean
// 	hover: boolean
// }
//
// export type DropDownItemRenderer<ItemType> = (props: DropDown_Node<ItemType>) => React.ReactNode
// export type DropDownRendererMap<ItemType> = _RendererMap | { [k: string]: DropDownItemRenderer<ItemType> }

// export type SingleRendererAndOptions<ItemType> = {
// 	options: ItemType[] | (() => ItemType[]),
// 	itemRenderer: DropDownItemRenderer<ItemType>
// }

// export type MultipleRenderersAndOptions<ItemType> = {
// 	options: ItemToRender<_RendererMap, string>[] | (() => ItemToRender<_RendererMap, string>[]),
// 	rendererMap: _RendererMap<ItemType>,
// 	avoidActionOnTypes?: string[]
// }

// export type RenderersAndOptions<ItemType> = SingleRendererAndOptions<ItemType> | MultipleRenderersAndOptions<ItemType>

type StaticProps = { id: string }

// export type ItemType = {
// 	label: (string | number | symbol),
// 	value: ItemType | ItemType[]
// }

type Props<ItemType> = StaticProps & {
	adapter: Adapter
	// renderersAndOptions: RenderersAndOptions<ItemType>
	onSelected: (selected: ItemType) => void
	selected?: ItemType
	filter?: (item: ItemType) => string[]
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
		const options = this.props.adapter.data as ItemType[];
		// const options = this.props.renderersAndOptions.options;
		this.state = {
			filteredOptions: options,
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

	toggleList = (e: React.MouseEvent) => {
		stopPropagation(e);

		this.setState(prevState => ({open: !prevState.open}));
		// this.renderMenu();
	};

	onSelected = (item: ItemType) => {
		this.setState({
			              open: false,
			              selected: item
		              });

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
		console.log('lala');
		if (e.code === "Escape")
			return this.setState({open: false});

		if (e.code === "ArrowDown") {
			// node.blur();
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
		const options = this.props.adapter.data as ItemType[];

		// const options = this.props.renderersAndOptions.options;
		return (<FilterInput<ItemType>
			id={this.props.id}
			filter={this.props.filter}
			list={options}
			onChange={(filtered: (ItemType)[]) => this.setState({filteredOptions: filtered})}
			focus={true}
			className={inputComplementary.className}
			inputStyle={inputComplementary.inputStyle || (!inputComplementary.className ? inputStyle : {})}
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

		const Renderer = this.props.adapter.treeNodeRenderer;
		const node = {
			propKey: 'string',
			path: 'string',
			item: 'any',
			adapter: this.props.adapter,
			expandToggler: (e: React.MouseEvent, expand?: boolean) => {
			},
			onClick: (e: React.MouseEvent) => {
			},
			onFocus: (e: React.MouseEvent) => {
			},
			expanded: true,
			focused: true
		};
		return <Renderer item={props.selected} node={node}/>
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

	// private listElementWrapper = (renderer: React.ReactNode, item: ItemType, allowAction: boolean = true) => <div
	// 	onMouseEnter={() => this.setState({hover: item})}
	// 	onMouseLeave={() => this.setState({hover: undefined})}
	// 	onMouseUp={(e: React.MouseEvent) => allowAction && this.onSelected(e, item)}
	// 	className={`${allowAction ? `clickable` : ''} match_width`}>
	// 	{renderer}</div>;

	// private funcCreator = (renderer: DropDownItemRenderer<ItemType>, allowAction: boolean) =>
	// 	(item: DropDown_Node<ItemType>) => this.listElementWrapper(
	// 		renderer({item: item.item, selected: allowAction && item.item === this.state.selected, hover: allowAction && item.item === this.state.hover}),
	// 		item.item,
	// 		allowAction);

	private renderTree = () => {
		if (!this.state.open)
			return null;

		const items = this.state.filteredOptions;
		// let adapter: Adapter;
		// // let rendererMap: DropDownRendererMap<ItemType> | { [key: string]: React.ReactNode };
		// // // @ts-ignore
		// // let _children: ItemToRender<_RendererMap, string>[];
		//
		// if (this.isSingleRendererAndOptions(this.props.renderersAndOptions)) {
		// 	adapter = new Adapter().setData(items);
		// 	adapter.getTreeNodeRenderer = () => SimpleDropdownRenderer
		// } else {
		// 	adapter = new MultiTypeAdapter(this.props.renderersAndOptions.rendererMap).setData(items);
		// 	adapter.getTreeNodeRenderer = () => SimpleDropdownRenderer;
		//
		//
		// 	// rendererMap = this.props.renderersAndOptions.rendererMap;
		// 	// const allowAction = (el: string, avoidAction: string[] = []): boolean => !avoidAction.includes(el);
		// 	// const _avoidAction = this.props.renderersAndOptions.avoidActionOnTypes;
		// 	// Object.keys(rendererMap).forEach(
		// 	// 	(el) => rendererMap[el] = this.funcCreator(rendererMap[el] as DropDownItemRenderer<ItemType>, allowAction(el, _avoidAction)));
		// 	//
		// 	// _children = items as ItemToRender<_RendererMap, string>[];
		// }

		const listComplementary = (this.props.listStyleResolver || this.listStyleResolver);
		// const a = new TreeAdapter(this.props.adapter);
		// console.log(a, this.props.adapter)
		// a.data = this.state.filteredOptions
		return <div style={listContainerStyle}>
			<div className={listComplementary.listClassName} style={listComplementary.listStyle}>
				{items.length === 0 ?
					<div
						style={{...listComplementary.listStyle || (!listComplementary.listClassName ? listStyle : {}), alignItems: "center", opacity: 0.5}}>
						No options
					</div>
					:
					<Tree
						id={this.props.id}
						adapter={this.props.adapter}
						indentPx={0}
						callBackState={(key: string, value: any, level: number) => key === '/'}
						onNodeClicked={(path: string, item: ItemType) => this.onSelected(item)}
						unMountFromOutside={() => this.setState({open: false})}
					/>
				}
			</div>
		</div>
	}
}