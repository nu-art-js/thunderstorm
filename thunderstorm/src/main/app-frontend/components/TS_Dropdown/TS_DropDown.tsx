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
import {Filter} from '@nu-art/ts-common';
import {stopPropagation} from '../../utils/tools';
import {Adapter,} from '../adapter/Adapter';
import {TS_Overlay} from '../TS_Overlay';
import {TS_Tree} from '../TS_Tree';
import {ComponentSync} from '../../core/ComponentSync';
import {TS_Input} from '../TS_Input';
import './TS_DropDown.scss';


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

export type InputProps = {
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
	caret: {
		open: React.ReactNode,
		close: React.ReactNode,
	},
}

export type Props_DropDown<ItemType> = Partial<StaticProps> & {
	adapter: Adapter<ItemType>
	placeholder?: string,
	inputValue?: string,

	onNoMatchingSelectionForString?: (filterText: string, matchingItems: ItemType[], e: React.KeyboardEvent) => void
	onSelected: (selected: ItemType) => void
	selected?: ItemType

	filter?: Filter<ItemType>
	tabIndex?: number;
	innerRef?: React.RefObject<any>

	inputEventHandler?: (state: State<ItemType>, e: React.KeyboardEvent) => State<ItemType>
	selectedItemRenderer?: (props?: ItemType) => React.ReactNode
	showNothingWithoutFilterText?: boolean
	disabled?: boolean
}

export class TS_DropDown<ItemType>
	extends ComponentSync<Props_DropDown<ItemType>, State<ItemType>> {

	constructor(props: Props_DropDown<ItemType>) {
		super(props);
	}

	protected deriveStateFromProps(nextProps: Props_DropDown<ItemType>): State<ItemType> | undefined {
		return {
			adapter: nextProps.adapter.clone(new Adapter<ItemType>([])),
			selected: nextProps.selected,
			open: this.state?.open || false,
			filterText: nextProps.inputValue
		};
	}

	toggleList = (e: React.MouseEvent) => {
		if (this.props.disabled)
			return;

		stopPropagation(e);

		this.setState(prevState => ({open: !prevState.open}));
	};

	onSelected = (item: ItemType) => {
		console.log(item);
		this.setState({
			open: false,
			selected: item
		}, () => this.props.onSelected(item));
	};

	render() {
		return (
			<div className="ts-dropdown"
				// ref={(node: HTMLDivElement) => {
				//  if (this.node)
				// 	 return;
				//
				//  this.node = node;
				//  this.forceUpdate();
				//
				// }}
					 ref={this.props.innerRef}
					 tabIndex={this.props.tabIndex}
					 onFocus={this.addKeyboardListener}
					 onBlur={this.removeKeyboardListener}
			>
				{this.renderHeader()}
				<TS_Overlay flat={true} showOverlay={this.state.open} onClickOverlay={() => this.setState({open: false})}>
					{this.renderTree()}
				</TS_Overlay>
			</div>
		);
	}

	private renderHeader = () => {
		return (
			<div
				className="ts-dropdown__header"
				onClick={this.toggleList}>

				{this.renderSelectedOrFilterInput()}
				{this.state.open && this.props.caret ? this.props.caret?.close : this.props.caret?.open}
			</div>);
	};

	private renderTree = () => {
		if (!this.state.open)
			return '';

		if (this.props.showNothingWithoutFilterText && !this.state.filterText?.length)
			return '';

		// const treeKeyEventHandler = treeKeyEventHandlerResolver(this.props.id);
		const filter = this.props.filter;
		if (filter) {
			this.state.adapter.data = filter.filter(this.props.adapter.data, this.state.filterText || '');
		}

		if ((!filter || !this.props.showNothingWithoutFilterText || this.state.filterText?.length) && this.state.adapter.data.length === 0)
			return <div className="ts-dropdown__empty" style={{textAlign: 'center', opacity: 0.5}}>No options</div>;

		return <TS_Tree
			adapter={this.state.adapter}
			selectedItem={this.state.selected}
			onNodeClicked={(path: string, item: ItemType) => this.onSelected(item)}
			// keyEventHandler={treeKeyEventHandler}
		/>;
	};

	private keyEventHandler = (e: React.KeyboardEvent) => {
		if (this.props.inputEventHandler)
			return this.setState(() => {
				return this.props.inputEventHandler ? this.props.inputEventHandler(this.state, e) : this.state;
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

		// if (e.key === 'ArrowDown') {
		// 	return document.getElementById(`${this.props.id}-tree-listener`)?.focus();
		// }
	};

	private renderSelectedItem = (selected?: ItemType) => {
		if (this.props.selectedItemRenderer)
			return this.props.selectedItemRenderer(selected);

		if (selected === undefined)
			return <div className="ts-dropdown__placeholder">{this.props.placeholder || ''}</div>;

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
			expanded: true,
			focused: false,
			selected: true
		};
		return <div className={'ts-dropdown__placeholder'}><Renderer item={selected} node={node}/></div>;
	};

	private renderSelectedOrFilterInput = () => {
		if (!this.state.open || !this.props.filter) {
			return this.renderSelectedItem(this.state.selected);
		}

		return <TS_Input
			type="text"
			autocomplete={false}
			value={this.props.inputValue}
			onChange={(filterText) => this.setState({filterText})}
			focus={true}
			style={{width: '100%'}}
			placeholder={'Search'}//{this.props.placeholder}
			handleKeyEvent={this.keyEventHandler}
		/>;
	};

	// TODO: THIS IS ALL DUPLICATE SHIT... DELETE ONCE TREE CAN PROPAGATE THE KEYBOARD EVENTS
	private node?: HTMLDivElement;

	private addKeyboardListener = () => {
		const onKeyboardEventListener = this.keyEventHandler;
		if (!onKeyboardEventListener)
			return;

		this.node?.addEventListener('keydown', this.keyboardEventHandler);
	};

	private removeKeyboardListener = () => {
		const onKeyboardEventListener = this.keyEventHandler;
		if (!onKeyboardEventListener)
			return;

		this.node?.removeEventListener('keydown', this.keyboardEventHandler);
	};

	keyboardEventHandler = (e: KeyboardEvent) => this.node && this.keyEventHandler(e as unknown as React.KeyboardEvent);
}