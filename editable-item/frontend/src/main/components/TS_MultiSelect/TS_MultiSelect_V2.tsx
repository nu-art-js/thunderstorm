/*
 * TS_MultiSelect_V2 — multi-select list with dropdown selector.
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import * as React from 'react';
import {Component, ReactNode} from 'react';
import {SubsetKeys, ThisShouldNotHappenException} from '@nu-art/ts-common';
import {_className} from '@nu-art/thunder-core';
import {LL_H_C, LL_V_L, TS_ListOrganizer, type TS_ListOrganizer_RendererProps} from '@nu-art/thunder-widgets';
import {EditableItem} from '../../core/EditableItem.js';
import './TS_MultiSelect.scss';

type Binder_MultiSelect<EnclosingItem, K extends keyof EnclosingItem, ExpectedType> = EnclosingItem[K] extends ExpectedType[] ? {
	EnclosingItem: EnclosingItem;
	Prop: K;
	InnerType: ExpectedType;
} : never;
export type DynamicProps_TS_MultiSelect_V2<EnclosingItem, Prop extends keyof EnclosingItem> = {
	editable: EditableItem<EnclosingItem>;
	prop: Prop;
	disabled?: boolean;
};
export type StaticProps_TS_MultiSelect_V2<ItemType> = {
	className?: string
	itemsDirection?: 'vertical' | 'horizontal';
	selectionFilter?: (item: ItemType) => boolean; // for the shown list
	itemFilter?: (item: ItemType) => boolean; // for the selection dropdown
	sort?: (items: ItemType[]) => ItemType[];
	// mandatory
	itemRenderer: (item?: ItemType, onDelete?: () => Promise<void>, disabled?: boolean) => ReactNode;
	selectionRenderer: React.ComponentType<MultiSelect_Selector<ItemType>>;
};

export type Props_TS_MultiSelect_V2<Binder extends Binder_MultiSelect<any, any, any>> =
	StaticProps_TS_MultiSelect_V2<Binder['InnerType']>
	& DynamicProps_TS_MultiSelect_V2<Binder['EnclosingItem'], Binder['Prop']>;

export type MultiSelect_Selector<ItemType> = {
	className: string;
	existingItems: ItemType[];
	onSelected: (selected: ItemType) => void | Promise<void>;
	queryFilter?: (item: ItemType) => boolean;
};

export class TS_MultiSelect_V2<Binder extends Binder_MultiSelect<any, any, any>>
	extends Component<Props_TS_MultiSelect_V2<Binder>, any> {

	static prepare<EnclosingItem, K extends keyof EnclosingItem, InnerType>(_props: StaticProps_TS_MultiSelect_V2<InnerType>) {
		return <EnclosingItem_, Prop extends SubsetKeys<keyof EnclosingItem_, EnclosingItem_, InnerType[] | undefined>>(props: DynamicProps_TS_MultiSelect_V2<EnclosingItem_, Prop> & Partial<StaticProps_TS_MultiSelect_V2<InnerType>>) =>
			<TS_MultiSelect_V2<Binder_MultiSelect<EnclosingItem_, Prop, InnerType>> {..._props} {...props}/>;
	}

	render() {
		const editable = this.props.editable;
		const prop = this.props.prop;
		const editableProp = editable.editProp(prop, []);
		const existingItems = editableProp.item as Binder['InnerType'][];
		let itemsToRender = this.props.selectionFilter ? existingItems.filter(this.props.selectionFilter) : existingItems;
		if (this.props.sort)
			itemsToRender = this.props.sort(itemsToRender);
		const addInnerItem = async (item: Binder['InnerType']) => {
			await editableProp.updateArrayAt(item);
			this.forceUpdate();
		};
		const props = this.props;
		const SelectionRenderer = props.selectionRenderer as React.FC<MultiSelect_Selector<Binder['InnerType']>>;
		const direction = this.props.itemsDirection ?? 'horizontal';
		const Wrapper = direction === 'horizontal' ? LL_H_C : LL_V_L;
		const className = _className('ts-multi-select__list', this.props.disabled && 'disabled', this.props.className);
		return <Wrapper className={className}>
			{itemsToRender.map((item, i) => {
				return <LL_H_C className="ts-multi-select__list-value" key={i}>
					{props.itemRenderer(item, async () => {
						const index = existingItems.indexOf(item);
						await editableProp.removeArrayItem(index);
						this.forceUpdate();
					}, this.props.disabled)}
				</LL_H_C>;
			})}
			{!this.props.disabled && SelectionRenderer({
				className: 'ts-multi-select__selector',
				onSelected: addInnerItem,
				existingItems: existingItems,
				queryFilter: this.props.itemFilter
			})}
		</Wrapper>;
	}
}

export class TS_MultiSelect_Sortable<Binder extends Binder_MultiSelect<any, any, any>>
	extends Component<Props_TS_MultiSelect_V2<Binder>> {

	static prepare<EnclosingItem, K extends keyof EnclosingItem, InnerType>(_props: StaticProps_TS_MultiSelect_V2<InnerType>) {
		return <EnclosingItem_, Prop extends SubsetKeys<keyof EnclosingItem_, EnclosingItem_, InnerType[] | undefined>>(props: DynamicProps_TS_MultiSelect_V2<EnclosingItem_, Prop> & Partial<StaticProps_TS_MultiSelect_V2<InnerType>>) =>
			<TS_MultiSelect_Sortable<Binder_MultiSelect<EnclosingItem_, Prop, InnerType>> {..._props} {...props}/>;
	}

	private renderItem = (editable: EditableItem<Binder['InnerType'][]>, props: TS_ListOrganizer_RendererProps<Binder['InnerType']>) => {
		const className = _className('multi-select__item-wrapper', props.dragged && 'dragged');
		return <LL_H_C
			className={className}
			draggable={!this.props.disabled}
			onDragStart={e => {
				if (this.props.disabled)
					return;
				if (!e.dataTransfer)
					throw new ThisShouldNotHappenException('dragstart without dataTransfer');

				e.dataTransfer.effectAllowed = 'move';
				e.dataTransfer.setData('text/plain', 'multi-select');
				e.dataTransfer.setDragImage(e.currentTarget, 150, 30);
				props.onDragStart(e, props.index);
			}}
			onDragEnd={props.onDragEnd}
			onDragOver={e => props.onDragOver(e, props.index)}
			onDragLeave={e => props.onDragLeave(e, props.index)}
		>
			{this.props.itemRenderer(props.item, async () => {
				await editable.removeArrayItem(props.index);
				this.forceUpdate();
			}, this.props.disabled)}
		</LL_H_C>;
	};

	render() {
		const editable = this.props.editable.editProp(this.props.prop, []) as EditableItem<Binder['InnerType'][]>;
		const className = _className('ts-multi-select__sortable', this.props.disabled && 'disabled', this.props.className);
		const SelectionRenderer = this.props.selectionRenderer as React.FC<MultiSelect_Selector<Binder['InnerType']>>;
		return <LL_V_L className={className}>
			<TS_ListOrganizer
				items={editable.item}
				renderer={item => this.renderItem(editable, item)}
				onOrderChanged={async items => {
					await this.props.editable.updateObj({[this.props.prop]: items} as Partial<Binder['EnclosingItem']>);
					this.forceUpdate();
				}}
			/>
			{!this.props.disabled && SelectionRenderer({
				className: 'ts-multi-select__selector',
				existingItems: editable.item,
				queryFilter: this.props.itemFilter,
				onSelected: async (item: Binder['InnerType']) => {
					await editable.updateArrayAt(item);
					this.forceUpdate();
				},
			})}
		</LL_V_L>;
	}
}
