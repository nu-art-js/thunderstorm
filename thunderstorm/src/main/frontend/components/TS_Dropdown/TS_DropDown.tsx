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
import {CSSProperties} from 'react';
import {Filter} from '@nu-art/ts-common';
import {_className, stopPropagation} from '../../utils/tools';
import {Adapter,} from '../adapter/Adapter';
import {TS_Overlay} from '../TS_Overlay';
import {TS_Tree} from '../TS_Tree';
import {ComponentSync} from '../../core/ComponentSync';
import {TS_Input} from '../TS_Input';
import './TS_DropDown.scss';


type State<ItemType> = {
	adapter: Adapter<ItemType>
	open: boolean
	selected?: ItemType
	hover?: ItemType
	filterText?: string
	dropDownRef: React.RefObject<HTMLDivElement>;
}

type StaticProps = {
	caret: {
		open: React.ReactNode,
		close: React.ReactNode,
	},
}

type DropDownChildrenContainerData = {
	posX: number;
	posY: number;
	maxHeight: number;
	width: number;
}

export type Props_DropDown<ItemType> = Partial<StaticProps> & {
	adapter: Adapter<ItemType>
	placeholder?: string,
	inputValue?: string,

	noOptionsRenderer?: React.ReactNode | (() => React.ReactNode);
	onNoMatchingSelectionForString?: (filterText: string, matchingItems: ItemType[], e: React.KeyboardEvent) => void
	onSelected: (selected: ItemType) => void
	selected?: ItemType

	filter?: Filter<ItemType>
	tabIndex?: number;
	innerRef?: React.RefObject<any>;

	inputEventHandler?: (state: State<ItemType>, e: React.KeyboardEvent) => State<ItemType>
	selectedItemRenderer?: (props?: ItemType) => React.ReactNode
	showNothingWithoutFilterText?: boolean
	disabled?: boolean
	allowManualSelection?: boolean
	className?: string;
	boundingParentSelector?: string;
}

export class TS_DropDown<ItemType>
	extends ComponentSync<Props_DropDown<ItemType>, State<ItemType>> {

	// ######################## Static ########################

	private node?: HTMLDivElement;

	// ######################## Life Cycle ########################

	constructor(props: Props_DropDown<ItemType>) {
		super(props);
	}

	shouldComponentUpdate(nextProps: Readonly<Props_DropDown<ItemType>>, nextState: Readonly<State<ItemType>>, nextContext: any): boolean {
		return true;
	}

	protected deriveStateFromProps(nextProps: Props_DropDown<ItemType>): State<ItemType> | undefined {
		const ref = this.props.innerRef || this.state?.dropDownRef || React.createRef<HTMLDivElement>();
		return {
			adapter: nextProps.adapter.clone(new Adapter<ItemType>([])),
			selected: nextProps.selected,
			open: this.state?.open || false,
			filterText: nextProps.inputValue,
			dropDownRef: ref
		};
	}

	// ######################## Logic ########################

	private getBoundingParent() {
		if (!this.props.boundingParentSelector)
			return undefined;

		return this.state.dropDownRef.current?.closest(this.props.boundingParentSelector);
	}

	toggleList = (e: React.MouseEvent) => {
		if (this.props.disabled)
			return;

		stopPropagation(e);

		this.setState(prevState => ({open: !prevState.open}));
	};

	onSelected = (item: ItemType) => {
		const newState: State<ItemType> = {...this.state, open: false};
		if (!this.props.allowManualSelection)
			newState.selected = item;

		this.setState({...newState}, () => this.props.onSelected(item));
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
				this.setState({open: false}, () => {
					this.props.onNoMatchingSelectionForString?.(filterText, this.state.adapter.data, e);
				});
			} else
				this.onSelected(this.state.adapter.data[0]);
		}

		if (e.key === 'Escape')
			return this.setState({open: false, filterText: undefined});

		// if (e.key === 'ArrowDown') {
		// 	return document.getElementById(`${this.props.id}-tree-listener`)?.focus();
		// }
	};

	private getChildrenContainerMaxHeight = (dropdownRef: React.RefObject<HTMLDivElement>, dir: 'top' | 'bottom'): number => {
		const rect = dropdownRef.current?.getBoundingClientRect()!;
		const boundingParent = this.getBoundingParent();
		if (boundingParent) {
			const boundingRect = boundingParent.getBoundingClientRect();
			return (dir === 'bottom' ? (boundingRect.bottom - rect.bottom - 20) : (rect.top - boundingRect.top - 20));
		}
		return (dir === 'bottom' ? (window.innerHeight - rect.bottom - 20) : (rect.top - 20));
	};

	private getChildrenContainerPosX = (dropdownRef: React.RefObject<HTMLDivElement>): number => {
		const rect = dropdownRef.current!.getBoundingClientRect();
		return rect.x;
	};

	private getChildrenContainerPosY = (dropdownRef: React.RefObject<HTMLDivElement>, dir: 'top' | 'bottom'): number => {
		const rect = dropdownRef.current!.getBoundingClientRect();
		if (dir === 'bottom') {
			return rect.bottom;
		}
		return window.innerHeight - rect.top;
	};

	private getChildrenContainerWidth = (dropdownRef: React.RefObject<HTMLDivElement>): number => {
		const rect = dropdownRef.current!.getBoundingClientRect();
		return rect.right - rect.left;
	};

	// ######################## Render ########################

	render() {
		const className = _className(
			'ts-dropdown',
			this.props.className,
			this.state.open ? 'open' : undefined,
			this.props.disabled ? 'disabled' : undefined,
		);
		return (
			<div className={className}
					 ref={this.state.dropDownRef}
					 tabIndex={this.props.tabIndex}
					 onFocus={this.addKeyboardListener}
					 onBlur={this.removeKeyboardListener}
			>
				{this.renderHeader()}
				<TS_Overlay flat={false} showOverlay={this.state.open} onClickOverlay={() => this.setState({open: false, filterText: undefined})}>
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

		let className = 'ts-dropdown__items';
		// const treeKeyEventHandler = treeKeyEventHandlerResolver(this.props.id);
		const filter = this.props.filter;
		if (filter) {
			try {
				this.state.adapter.data = filter.filterSort(this.props.adapter.data, this.state.filterText || '');
			} catch (e) {
				this.state.adapter.data = this.props.adapter.data;
			}
		}

		const style: CSSProperties = {};
		if (this.state?.dropDownRef.current) {
			//Get container data
			const containerData: DropDownChildrenContainerData = {
				posX: this.getChildrenContainerPosX(this.state.dropDownRef),
				posY: this.getChildrenContainerPosY(this.state.dropDownRef, 'bottom'),
				width: this.getChildrenContainerWidth(this.state.dropDownRef),
				maxHeight: this.getChildrenContainerMaxHeight(this.state.dropDownRef, 'bottom'),
			};

			//Set initial top
			style.top = containerData.posY;

			//If not enough space at the bottom, re-calculate for top display
			if (containerData.maxHeight < 100) {
				containerData.maxHeight = this.getChildrenContainerMaxHeight(this.state.dropDownRef, 'top');
				containerData.posY = this.getChildrenContainerPosY(this.state.dropDownRef, 'top');
				className += ' inverted';
				delete style.top;
				style.bottom = containerData.posY;
			}

			//Set style attributes
			style.position = 'absolute';
			style.left = containerData.posX;
			style.maxHeight = containerData.maxHeight;
			style.width = containerData.width;
		}

		if ((!filter || !this.props.showNothingWithoutFilterText || this.state.filterText?.length) && this.state.adapter.data.length === 0) {
			if (this.props.noOptionsRenderer)
				return <div className="ts-dropdown__empty" style={style}>
					{(typeof this.props.noOptionsRenderer === 'function' ? this.props.noOptionsRenderer() : this.props.noOptionsRenderer)}
				</div>;
			return <div className="ts-dropdown__empty" style={style}>No options</div>;
		}

		return <TS_Tree
			adapter={this.state.adapter}
			selectedItem={this.state.selected}
			onNodeClicked={(path: string, item: ItemType) => this.onSelected(item)}
			className={className}
			treeContainerStyle={style}
			// keyEventHandler={treeKeyEventHandler}
		/>;
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
			value={this.props.inputValue}
			onChange={(filterText) => this.setState({filterText})}
			focus={true}
			style={{width: '100%'}}
			placeholder={this.props.placeholder || ''}
			// onAccept={(value, ev) => {
			// 	const filterText = this.state.filterText;
			// 	if (filterText) {
			// 		this.setState({open: false}, () => this.props.onNoMatchingSelectionForString?.(filterText, this.state.adapter.data, ev));
			// 	} else
			// 		this.onSelected(this.state.adapter.data[0]);
			// }}
			onCancel={() => this.setState({open: false, filterText: undefined})}
			onKeyDown={this.keyEventHandler}
		/>;
	};

	// ######################## To Remove ########################
	// TODO: THIS IS ALL DUPLICATE SHIT... DELETE ONCE TREE CAN PROPAGATE THE KEYBOARD EVENTS

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