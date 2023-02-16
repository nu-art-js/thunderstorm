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
import {BadImplementationException, cloneArr, Filter} from '@nu-art/ts-common';
import {_className, stopPropagation} from '../../utils/tools';
import {Adapter,} from '../adapter/Adapter';
import {TS_Overlay} from '../TS_Overlay';
import {TS_Tree} from '../TS_Tree';
import {ComponentSync} from '../../core/ComponentSync';
import {TS_Input} from '../TS_Input';
import './TS_DropDown.scss';
import {LL_V_L} from '../Layouts';

type State<ItemType> = {
	open?: boolean
	items: ItemType[];
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

type InputEvent = React.KeyboardEvent | React.MouseEvent;

type DropDownChildrenContainerData = {
	posX: number;
	posY: number;
	maxHeight: number;
	width: number;
}

type Dropdown_Props<ItemType> = Partial<StaticProps> & {
	adapter: Adapter<ItemType> | ((filter?: string) => Adapter<ItemType>)
	placeholder?: string,
	inputValue?: string;

	noOptionsRenderer?: React.ReactNode | (() => React.ReactNode);
	onNoMatchingSelectionForString?: (filterText: string, matchingItems: ItemType[], e: React.KeyboardEvent) => void

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
	renderSearch: (dropDown: TS_DropDown<ItemType>) => React.ReactNode;
	limitItems?: number;
	onContextMenu?: (e: React.MouseEvent<HTMLInputElement, MouseEvent>) => void;
}

type Props_CanUnselect<ItemType> = { canUnselect: true; onSelected: (selected?: ItemType) => void };
type Props_CanNotUnselect<ItemType> = { canUnselect?: false; onSelected: (selected: ItemType) => void };
export type Props_DropDown<ItemType> = (Props_CanUnselect<ItemType> | Props_CanNotUnselect<ItemType>) & Dropdown_Props<ItemType>

export class TS_DropDown<ItemType>
	extends ComponentSync<Props_DropDown<ItemType>, State<ItemType>> {

	// ######################## Static ########################

	private node?: HTMLDivElement;
	static defaultRenderSearch = (dropDown: TS_DropDown<any>) =>
		<TS_Input
			type="text"
			value={dropDown.props.inputValue}
			onChange={(filterText) => dropDown.setState({filterText})}
			focus={true}
			style={{width: '100%'}}
			placeholder={dropDown.props.placeholder || ''}
			// onAccept={(value, ev) => {
			// 	const filterText = dropDown.state.filterText;
			// 	if (filterText) {
			// 		dropDown.setState({open: false}, () => dropDown.props.onNoMatchingSelectionForString?.(filterText, dropDown.state.adapter.data, ev));
			// 	} else
			// 		dropDown.onSelected(dropDown.state.adapter.data[0]);
			// }}
			onCancel={() => dropDown.setState({open: false, filterText: undefined})}
			onKeyDown={dropDown.keyEventHandler}
		/>;

	public static defaultProps = {
		renderSearch: TS_DropDown.defaultRenderSearch,
	};

	// ######################## Life Cycle ########################

	constructor(props: Props_DropDown<ItemType>) {
		super(props);
	}

	shouldComponentUpdate(nextProps: Readonly<Props_DropDown<ItemType>>, nextState: Readonly<State<ItemType>>, nextContext: any): boolean {
		return true;
	}

	protected deriveStateFromProps(nextProps: Props_DropDown<ItemType>): State<ItemType> | undefined {
		const ref = this.props.innerRef || this.state?.dropDownRef || React.createRef<HTMLDivElement>();
		const adapter = typeof nextProps.adapter === 'function' ? nextProps.adapter() : nextProps.adapter;
		return {
			items: adapter.data,
			selected: nextProps.selected,
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

	private closeList = (e?: InputEvent, state: State<ItemType> = {} as State<ItemType>) => {
		if (this.props.disabled)
			return;

		if (e)
			stopPropagation(e);

		this.setState({...state, open: false, filterText: undefined});
	};

	onSelected = (item?: ItemType, e?: InputEvent) => {
		const newState = {} as State<ItemType>;
		if (!this.props.allowManualSelection)
			newState.selected = item;

		this.closeList(e, newState);
		this.props.onSelected(item as (typeof this.props.canUnselect extends true ? ItemType | undefined : ItemType));
	};

	private keyEventHandler = (e: React.KeyboardEvent) => {
		if (this.props.inputEventHandler)
			return this.setState(() => {
				return this.props.inputEventHandler ? this.props.inputEventHandler(this.state, e) : this.state;
			});

		if (e.key === 'Enter') {
			e.persist();
			const filterText = this.state.filterText;
			const adapter = typeof this.props.adapter === 'function' ? this.props.adapter(filterText) : this.props.adapter;
			adapter.data = cloneArr(this.state.items);
			if (filterText) {
				this.closeList(e);
				this.props.onNoMatchingSelectionForString?.(filterText, adapter.data, e);
			} else
				this.onSelected(adapter.data[0], e);
		}

		if (e.key === 'Escape')
			return this.closeList(e);

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
				<TS_Overlay flat={false} showOverlay={!!this.state.open} onClickOverlay={this.closeList}>
					{this.renderTree()}
				</TS_Overlay>
			</div>
		);
	}

	private renderHeader = () => {
		return (
			<div
				className="ts-dropdown__header"
				onClick={(e) => {
					if (this.props.disabled) {
						stopPropagation(e);
						return;
					}

					this.state.open ? this.closeList(e) : this.setState({open: true});
				}}>

				{this.renderSelectedOrFilterInput()}
				{this.state.open && this.props.caret ? this.props.caret?.close : this.props.caret?.open}
			</div>);
	};

	private renderTree = () => {
		if (!this.state.open)
			return '';

		if (this.props.showNothingWithoutFilterText && !this.state.filterText?.length)
			return '';

		let className = 'ts-dropdown__items-container';
		// const treeKeyEventHandler = treeKeyEventHandlerResolver(this.props.id);
		const filter = this.props.filter;
		const adapter = typeof this.props.adapter === 'function' ? this.props.adapter(this.state.filterText) : this.props.adapter;
		adapter.data = cloneArr(this.state.items);
		if (filter && this.state.filterText) {
			try {
				adapter.data = filter.filterSort(adapter.data, this.state.filterText);
			} catch (e: any) {
				this.logError(e);
				throw new BadImplementationException(e);
			}
		}

		if (this.props.limitItems) {
			adapter.data = adapter.data.slice(0, this.props.limitItems);
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

		if ((!filter || !this.props.showNothingWithoutFilterText || this.state.filterText?.length) && adapter.data.length === 0) {
			if (this.props.noOptionsRenderer)
				return <div className="ts-dropdown__empty" style={style}>
					{(typeof this.props.noOptionsRenderer === 'function' ? this.props.noOptionsRenderer() : this.props.noOptionsRenderer)}
				</div>;
			return <div className="ts-dropdown__empty" style={style}>No options</div>;
		}
		return <LL_V_L className={className} style={style}>
			{this.props.canUnselect && <div className={'ts-dropdown__unselect-item'} onClick={() => this.onSelected()}>Unselect</div>}
			<TS_Tree
				adapter={adapter}
				selectedItem={this.state.selected}
				onNodeClicked={(path: string, item: ItemType) => this.onSelected(item)}
				className={'ts-dropdown__items'}
			/>
		</LL_V_L>;
	};

	private renderSelectedItem = (selected?: ItemType) => {
		if (this.props.selectedItemRenderer)
			return this.props.selectedItemRenderer(selected);

		if (selected === undefined)
			return <div className="ts-dropdown__placeholder">{this.props.placeholder || ''}</div>;

		const adapter = typeof this.props.adapter === 'function' ? this.props.adapter(this.state.filterText) : this.props.adapter;
		const Renderer = adapter.treeNodeRenderer;
		const node = {
			propKey: 'string',
			path: 'string',
			item: 'any',
			adapter: adapter,
			expandToggler: (e: React.MouseEvent, expxand?: boolean) => {
			},
			onClick: (e: React.MouseEvent) => {
			},
			expanded: true,
			focused: false,
			selected: true
		};
		return <div className={'ts-dropdown__placeholder'} onContextMenu={this.props.onContextMenu}><Renderer item={selected} node={node}/></div>;
	};

	private renderSelectedOrFilterInput = (): React.ReactNode => {
		if (!this.state.open || !this.props.filter) {
			return this.renderSelectedItem(this.state.selected);
		}

		return this.props.renderSearch(this);
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
