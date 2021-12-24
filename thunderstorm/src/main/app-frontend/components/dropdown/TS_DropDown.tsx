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
import {TS_FilterInput} from "../input/TS_FilterInput";
import {generateHex} from "@nu-art/ts-common";
import {KeyboardListener} from '../../tools/KeyboardListener';
import {stopPropagation} from "../../utils/tools";
import {Adapter,} from "../adapter/Adapter";
import {Stylable} from '../../tools/Stylable';
import {Overlay} from "../Overlay";
import {TS_Tree} from '../tree/TS_Tree';
import {DropDown_headerStyle, DropDown_inputStyle, DropDown_listStyle, InputProps, listContainerStyle, wrapperStyle} from '../DropDown';
import {UIComponent} from "../../core/UIComponent";

type State<ItemType> = {
	id: string
	filteredOptions: ItemType[]
	adapter: Adapter
	open: boolean
	selected?: ItemType
	hover?: ItemType
	filterText?: string
}

type StaticProps = {
	id: string,
	headerStylable: Stylable
	listStylable: Stylable
	inputStylable: InputProps
}

export type Props_DropDown<ItemType> = StaticProps & {
	adapter: Adapter
	placeholder?: string,

	onNoMatchingSelectionForString?: (selected?: string) => void
	onSelected: (selected: ItemType) => void
	selected?: ItemType

	filterMapper?: (item: ItemType) => string[]

	inputEventHandler?: (state: State<ItemType>, e: React.KeyboardEvent) => State<ItemType>
	selectedItemRenderer?: (props?: ItemType) => React.ReactNode
	caret?: {
		open: React.ReactNode,
		close: React.ReactNode,
	},
	autocomplete?: boolean
	disabled?: boolean
}

export class TS_DropDown<ItemType>
	extends UIComponent<Props_DropDown<ItemType>, State<ItemType>> {

	static defaultProps: Partial<StaticProps> = {
		id: generateHex(8),
		headerStylable: {style: DropDown_headerStyle},
		listStylable: {style: DropDown_listStyle},
		inputStylable: {style: DropDown_inputStyle}
	};

	private filteredOptions: ItemType[] = [];


	constructor(props: Props_DropDown<ItemType>) {
		super(props);
	}

	protected deriveStateFromProps(nextProps: Props_DropDown<ItemType>): State<ItemType> | undefined {
		const newAdapter = TS_DropDown.cloneAdapter(nextProps);
		return {
			id: nextProps.id,
			adapter: newAdapter,
			filteredOptions: newAdapter.data,
			selected: nextProps.selected,
			open: this.state?.open || false
		};
	}

	private static cloneAdapter = (nextProps: Props_DropDown<any>) => {
		return nextProps.adapter.clone(new Adapter(nextProps.autocomplete && nextProps.filterMapper ? [] : nextProps.adapter.data));
	};

	toggleList = (e: React.MouseEvent) => {
		if (this.props.disabled)
			return;

		stopPropagation(e);

		this.setState(prevState => ({open: !prevState.open}));
	};

	onSelected = (item: ItemType) => {
		this.setState({
			open: false,
			selected: item
		}, () => this.props.onSelected(item));
	};

	render() {
		return (
			<Overlay showOverlay={this.state.open} onClickOverlay={() => this.setState({open: false})}>
				<KeyboardListener onKeyboardEventListener={this.keyEventHandler}>
					<div id={this.props.id} style={wrapperStyle}>
						{this.renderHeader()}
						{this.renderTree()}
					</div>
				</KeyboardListener>
			</Overlay>
		);
	}

	private renderHeader = () => {
		return (
			<div
				id={`${this.props.id}-header`}
				onClick={this.toggleList}
				{...this.props.headerStylable}>

				{this.renderSelectedOrFilterInput()}
				{this.renderCaret()}
			</div>);
	};


	private renderTree = () => {
		if (!this.state.open)
			return;

		if (this.props.autocomplete && !this.state.filterText?.length)
			return;

		this.props.adapter.data = this.state.filteredOptions;

		return <div style={listContainerStyle}>
			<div {...this.props.listStylable}>
				{this.renderTreeImpl()}
			</div>
		</div>;
	};

	private keyEventHandler = (e: React.KeyboardEvent) => {
		if (this.props.inputEventHandler)
			return this.setState(() => {
				const state = this.props.inputEventHandler ? this.props.inputEventHandler(this.state, e) : this.state;
				return state;
			});

		if (e.key === "Enter")
			if (this.state.filterText)
				return this.props.onNoMatchingSelectionForString?.(this.state.filterText)
			else
				return this.onSelected(this.filteredOptions[0]);

		if (e.key === "Escape")
			return this.setState({open: false});

		if (e.key === "ArrowDown") {
			return document.getElementById(`${this.props.id}-tree-listener`)?.focus();
		}
	};

	private renderSelectedOrFilterInput = () => {
		if (!this.state.open || !this.props.filterMapper) {
			return (
				<div className={'match_width'}>
					{this.renderSelectedItem(this.state.selected)}
				</div>);
		}

		return <TS_FilterInput<ItemType>
			key={this.state.id}
			placeholder={this.props.placeholder}
			id={`${this.props.id}-input`}
			mapper={this.props.filterMapper}
			list={this.props.adapter.data}
			onChange={(filteredOptions: ItemType[], filterBy) => {
				this.setState(state => {
					state.adapter.data = this.props.autocomplete && this.props.filterMapper && !filterBy.length ? [] : filteredOptions;

					// console.log(`filter: ${this.props.id} (${filterBy}) -> ${__stringify(filteredOptions)}`);
					// console.log(`state.adapter.data: ${__stringify(state.adapter.data)}`);
					this.filteredOptions = filteredOptions;
					return {
						adapter: state.adapter,
						filterText: filterBy,
					};
				});
			}}
			handleKeyEvent={this.keyEventHandler}
			focus={true}
			{...this.props.inputStylable}
		/>;
	};

	private renderSelectedItem = (selected?: ItemType) => {
		if (this.props.selectedItemRenderer)
			return this.props.selectedItemRenderer(selected);

		if (selected === undefined)
			return <div>{this.props.inputStylable.placeholder}</div>;

		const Renderer = this.props.adapter.treeNodeRenderer;
		const node = {
			propKey: 'string',
			path: 'string',
			item: 'any',
			adapter: this.props.adapter,
			expandToggler: (e: React.MouseEvent, expxand?: boolean) => {
			},
			onClick: (e: React.MouseEvent) => {
			},
			onFocus: (e: React.MouseEvent) => {
			},
			expanded: true,
			focused: false,
			selected: true
		};
		return <Renderer item={selected} node={node}/>;
	};


	private renderCaret = () => {
		const caret = this.props.caret;
		if (!caret)
			return;

		return this.state.open ? caret.close : caret.open;
	};


	private renderTreeImpl = () => {
		// const treeKeyEventHandler = treeKeyEventHandlerResolver(this.props.id);
		const id = `${this.props.id}-tree`;
		if ((!this.props.filterMapper || !this.props.autocomplete || this.state.filterText?.length) && this.state.adapter.data.length === 0)
			return <div style={{textAlign: "center", opacity: 0.5}}>No options</div>;

		return <TS_Tree
			id={id}
			key={id}
			adapter={this.state.adapter}
			indentPx={0}
			selectedItem={this.state.selected}
			onNodeClicked={(path: string, item: ItemType) => this.onSelected(item)}
			// keyEventHandler={treeKeyEventHandler}
		/>;
	};
}

// const treeKeyEventHandlerResolver = (id: string) => {
// 	return (e: React.KeyboardEvent, node?: HTMLDivElement) => {
// 		if (!["Escape", "ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Enter"].includes(e.key))
// 			document.getElementById(`${id}-input`)?.focus();
// 	};
// };