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
import {generateHex} from "@nu-art/ts-common";
import {KeyboardListener} from '../tools/KeyboardListener';
import {stopPropagation} from "../utils/tools";
import {Adapter,} from "./adapter/Adapter";
import {Tree} from "./tree/Tree";

const defaultWidth = "222px";
const defaultTitleHeight = "28px";
const defaultListHeight = "150px";

// export enum OnEnterOptions {
//     SelectFirstOption= (e:)
// }

const wrapperStyle: React.CSSProperties = {
	display: "inline-block"
};

export const headerStyle: React.CSSProperties = {
	display: "flex",
	alignItems: "center",
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
	// padding: "0 5px",
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

export type State<ItemType> = {
	filteredOptions: ItemType[]
	adapter: Adapter
	open: boolean
	selected?: ItemType
	hover?: ItemType
	filterTextLength?: number
}

type StaticProps = { id: string }

type Props<ItemType> = StaticProps & {
	adapter: Adapter
	onSelected: (selected: ItemType) => void
	selected?: ItemType
	filter?: (item: ItemType) => string[]
	onFilter?: (list?: ItemType[]) => void
	inputResolver?: (selected?: ItemType) => InputProps
	inputEventHandler?: (state: State<ItemType>, e: KeyboardEvent) => State<ItemType>
	placeholder?: string

	headerStyleResolver?: HeaderStyleProps
	valueRenderer?: (props: ValueProps<ItemType>) => React.ReactNode
	mainCaret?: React.ReactNode
	closeCaret?: React.ReactNode

	listStyleResolver?: ListStyleProps

	autocomplete?: boolean
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

		this.state = {
			filteredOptions: this.props.adapter.data,
			adapter: DropDown.cloneAdapter(this.props),
			open: false,
			selected: this.props.selected,
		};
	}

	static getDerivedStateFromProps(nextProps: Props<any>, prevState: State<any>): Partial<State<any>> | null {
		console.log('deriving state', nextProps, prevState);
		if (prevState.adapter.data === nextProps.adapter.data)
			return null;

		const adapter = DropDown.cloneAdapter(nextProps);
		adapter.data = prevState.adapter.data;
		return {adapter}
	}

	private static cloneAdapter = (nextProps: Props<any>) => {
		return nextProps.adapter.clone(new Adapter(nextProps.autocomplete && nextProps.filter ? [] : nextProps.adapter.data));
	};

	componentDidMount() {
		document.addEventListener('mousedown', this.handleMouseClick);
	}

	componentWillUnmount() {
		document.removeEventListener('mousedown', this.handleMouseClick);
	}

	toggleList = (e: React.MouseEvent) => {
		stopPropagation(e);

		this.setState(prevState => ({open: !prevState.open}));
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
		if (this.props.inputEventHandler)
			return this.setState(() => {
				const state = this.props.inputEventHandler ? this.props.inputEventHandler(this.state, e) : this.state;
				return state;
			})

		if (e.code === "Enter" && this.state.filteredOptions)
			return this.onSelected(this.state.filteredOptions[0])

		if (e.code === "Escape")
			return this.setState({open: false});

		if (e.code === "ArrowDown") {
			return document.getElementById(`${this.props.id}-tree-listener`)?.focus()
		}

	};

	private renderHeader = () => {
		const headerComplementary = (this.props.headerStyleResolver || this.headerStyleResolver);
		return (
			<div
				id={`${this.props.id}-header`}
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
		return <FilterInput<ItemType>
			id={`${this.props.id}-input`}
			filter={this.props.filter}
			list={this.props.adapter.data}
			onChange={(filteredOptions: ItemType[], filterTextLength) => {
				this.setState(state => {
					state.adapter.data = this.props.autocomplete && this.props.filter && !filterTextLength ? [] : filteredOptions;

					return {
						adapter: state.adapter,
						filterTextLength
					}
				}, () => this.props.onFilter && this.props.onFilter(this.state.filteredOptions));
			}}
			handleKeyEvent={(e) => {
				return
			}}
			focus={true}
			className={inputComplementary.className}
			inputStyle={inputComplementary.inputStyle || (!inputComplementary.className ? inputStyle : {})}
			placeholder={inputComplementary.placeholder || this.props.placeholder}
		/>;
	};

	private inputResolver = (selected?: ItemType): InputProps => ({inputStyle, placeholder: this.props.placeholder});

	private handleMouseClick = (e: MouseEvent) => {
		if (this.node && this.node.contains(e.target)) {
			return;
		}
		this.setState({open: false});
	};

	private defaultValueRenderer: (props: ValueProps<ItemType>) => React.ReactNode = (props: ValueProps<ItemType>) => {
		if (!props.selected)
			return <div>{this.props.placeholder}</div>;

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
			focused: false,
			selected: true
		};
		return <Renderer item={props.selected} node={node}/>
	};

	private renderValue = () => {
		const value = {
			selected: this.state.selected,
			placeholder: this.props.placeholder
		};
		const valueRenderer = this.props.valueRenderer || this.defaultValueRenderer;
		return <div className={'match_width'}>
			{valueRenderer(value)}
		</div>;
	};


	private renderCaret = () => {
		if (!this.props.mainCaret)
			return;

		const closeCaret = this.props.closeCaret || this.props.mainCaret;
		return this.state.open ? closeCaret : this.props.mainCaret;
	};

	private renderTree = () => {
		if (!this.state.open)
			return null;

		const items = this.state.filteredOptions;
		this.props.adapter.data = items;

		const listComplementary = (this.props.listStyleResolver || this.listStyleResolver);

		if (this.props.autocomplete && !this.state.filterTextLength)
			return null;

		return <div style={listContainerStyle}>
			<div className={listComplementary.listClassName} style={listComplementary.listStyle}>
				{this.renderTreeImpl()}
			</div>
		</div>
	}

	private renderTreeImpl = () => {
		const treeKeyEventHandler = treeKeyEventHandlerResolver(this.props.id);
		const id = `${this.props.id}-tree`;
		if ((!this.props.filter || !this.props.autocomplete || this.state.filterTextLength) && this.state.adapter.data.length === 0)
			return <div style={{textAlign: "center", opacity: 0.5}}>No options</div>;

		return <Tree
			id={id}
			key={id}
			adapter={this.state.adapter}
			indentPx={0}
			callBackState={(key: string, value: any, level: number) => key === '/'}
			selectedItem={this.state.selected}
			onNodeClicked={(path: string, item: ItemType) => this.onSelected(item)}
			unMountFromOutside={() => this.setState({open: false})}
			keyEventHandler={treeKeyEventHandler}
		/>
	};
}

const treeKeyEventHandlerResolver = (id: string) => {
	return (node: HTMLDivElement, e: KeyboardEvent) => {
		if (!["Escape", "ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Enter"].includes(e.code))
			document.getElementById(`${id}-input`)?.focus();
	}
};