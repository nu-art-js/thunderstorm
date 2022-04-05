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
import {Filter, generateHex} from '@nu-art/ts-common';
import {KeyboardListener} from '../../tools/KeyboardListener';
import {stopPropagation} from '../../utils/tools';
import {Adapter,} from '../adapter/Adapter';
import {Stylable} from '../../tools/Stylable';
import {Overlay} from '../Overlay';
import {TS_Tree} from '../tree/TS_Tree';
import {BaseComponent} from '../../core/BaseComponent';
import {TS_Input} from '../input/TS_Input';

const defaultTitleHeight = '28px';
const defaultListHeight = '150px';

// export enum OnEnterOptions {
//     SelectFirstOption= (e:)
// }

export const DropDown_wrapperStyle: React.CSSProperties = {
	display: 'inline-block',
	width: '100%',
	position: 'relative',
	boxSizing: 'border-box',
	borderRadius: 2,
	border: 'solid 1px',
};

export const DropDown_headerStyle: React.CSSProperties = {
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'space-between',
	position: 'relative',
	color: 'black',
	margin: 3,
	backgroundColor: 'white',
	height: defaultTitleHeight,
};

export const DropDown_inputStyle: React.CSSProperties = {
	border: 'unset',
	boxSizing: 'border-box',
	outline: 'none',
	// padding: "0 5px",
};

export const listContainerStyle: React.CSSProperties = {
	display: 'inline-block',
	position: 'absolute',
	zIndex: 10,
};

export const DropDown_listStyle: React.CSSProperties = {
	boxSizing: 'border-box',
	backgroundColor: 'whitesmoke',
	border: 'solid 1px',
	borderRadius: 5,
	display: 'flex',
	flexFlow: 'column',
	alignItems: 'stretch',
	maxHeight: defaultListHeight,
	overflowX: 'hidden',
	overflowY: 'auto',
	position: 'relative',
	top: 1,
};

export type InputProps = Stylable & {
	placeholder?: string
}

type State<ItemType> = {
	adapter: Adapter<ItemType>
	open: boolean
	selected?: ItemType
	hover?: ItemType
	filterText?: string
}

type StaticProps = {
	id?: string,
	headerStylable: Stylable
	wrapperStylable: Stylable
	listStylable: Stylable
	inputStylable: InputProps
}

export type Props_DropDown<ItemType> = Partial<StaticProps> & {
	adapter: Adapter<ItemType>
	placeholder?: string,
	inputValue?: string,

	onNoMatchingSelectionForString?: (filterText: string, matchingItems: ItemType[], e: React.KeyboardEvent) => void
	onSelected: (selected: ItemType) => void
	selected?: ItemType

	filter?: Filter<ItemType>

	inputEventHandler?: (state: State<ItemType>, e: React.KeyboardEvent) => State<ItemType>
	selectedItemRenderer?: (props?: ItemType) => React.ReactNode
	caret?: {
		open: React.ReactNode,
		close: React.ReactNode,
	},
	showNothingWithoutFilterText?: boolean
	disabled?: boolean
}

export class TS_DropDown<ItemType>
	extends BaseComponent<Props_DropDown<ItemType>, State<ItemType>> {

	static defaultProps: Partial<StaticProps> = {
		id: generateHex(8),
		wrapperStylable: {style: DropDown_wrapperStyle},
		headerStylable: {style: DropDown_headerStyle},
		listStylable: {style: DropDown_listStyle},
		inputStylable: {style: DropDown_inputStyle}
	};

	constructor(props: Props_DropDown<ItemType>) {
		super(props);
	}

	protected deriveStateFromProps(nextProps: Props_DropDown<ItemType>): State<ItemType> | undefined {
		return {
			adapter: nextProps.adapter.clone(new Adapter<ItemType>([])),
			selected: nextProps.selected,
			open: this.state?.open || false,
			filterText:nextProps.inputValue
		};
	}

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
				<KeyboardListener onKeyboardEventListener={this.keyEventHandler} {...this.props.wrapperStylable}>
					{this.renderHeader()}
					{this.renderTree()}
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

		if (this.props.showNothingWithoutFilterText && !this.state.filterText?.length)
			return;


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

		if (e.key === 'Enter') {
			e.persist();
			const filterText = this.state.filterText;
			if (filterText) {
				this.setState({open: false}, () => this.props.onNoMatchingSelectionForString?.(filterText, this.state.adapter.data, e));
			} else
				this.onSelected(this.state.adapter.data[0]);
		}

		if (e.key === 'Escape')
			return this.setState({open: false});

		if (e.key === 'ArrowDown') {
			return document.getElementById(`${this.props.id}-tree-listener`)?.focus();
		}
	};

	private renderSelectedItem = (selected?: ItemType) => {
		if (this.props.selectedItemRenderer)
			return this.props.selectedItemRenderer(selected);

		if (selected === undefined)
			return <div id={'place holder'}>{this.props.inputStylable?.placeholder || ''}</div>;

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
		return <div id={'renderer'}><Renderer item={selected} node={node}/></div>;
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
		const filter = this.props.filter;
		if (filter) {
			this.state.adapter.data = filter.filter(this.props.adapter.data, this.state.filterText || '');
		}

		if ((!filter || !this.props.showNothingWithoutFilterText || this.state.filterText?.length) && this.state.adapter.data.length === 0)
			return <div style={{textAlign: 'center', opacity: 0.5}}>No options</div>;

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

	private renderSelectedOrFilterInput = () => {
		if (!this.state.open || !this.props.filter) {
			return this.renderSelectedItem(this.state.selected);
		}

		return <TS_Input
			type="text"
			autocomplete={false}
			id={this.props.id || generateHex(16)}
			value={this.props.inputValue}
			onChange={(filterText) => this.setState({filterText})}
			focus={true}
			style={{width: '100%'}}
			placeholder={this.props.placeholder}
			handleKeyEvent={this.keyEventHandler}
			{...this.props.inputStylable}
		/>;
	};
}


// const treeKeyEventHandlerResolver = (id: string) => {
// 	return (e: React.KeyboardEvent, node?: HTMLDivElement) => {
// 		if (!["Escape", "ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Enter"].includes(e.key))
// 			document.getElementById(`${id}-input`)?.focus();
// 	};
// };