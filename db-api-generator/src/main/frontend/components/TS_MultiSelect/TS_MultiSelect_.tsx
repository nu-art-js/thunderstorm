import * as React from 'react';
import {Component, ReactNode} from 'react';
import {_className, EditableItem, LL_H_C, PartialProps_DropDown} from '@nu-art/thunderstorm/frontend';
import {AssetValueType, removeItemFromArray} from '@nu-art/ts-common';
import {PartialProps_GenericDropDown} from '../GenericDropDown';


export type TS_MultiSelect_Renderer_<InnerItem> = {
	className?: string
	itemRenderer: (item?: InnerItem, onDelete?: () => Promise<void>) => ReactNode
	placeholder: string
	noOptionsRenderer: string
	createNewItemFromLabel?: (filterText: string, matchingItems: InnerItem[], e: React.KeyboardEvent) => Promise<InnerItem>;
	selectionRenderer: React.ComponentType<PartialProps_GenericDropDown<InnerItem> | PartialProps_DropDown<InnerItem>>,
	itemResolver?: () => InnerItem[]
};

export type DynamicProps_TS_MultiSelect_<EnclosingItem, K extends keyof EnclosingItem, > = {
	editable: EditableItem<EnclosingItem>,
	prop: AssetValueType<EnclosingItem, K, any[]>
}

export type StaticProps_TS_MultiSelect_<InnerItem> = TS_MultiSelect_Renderer_<InnerItem>

export type Props_TS_MultiSelect_<EnclosingItem, K extends keyof EnclosingItem, InnerItem> =
	StaticProps_TS_MultiSelect_<InnerItem> & DynamicProps_TS_MultiSelect_<EnclosingItem, K>

type SelectorRenderer<InnerItem> = {
	selectionRenderer: React.ComponentType<PartialProps_GenericDropDown<InnerItem> | PartialProps_DropDown<InnerItem>>
	placeholder: string
	noOptionsRenderer: string
	selectedIds: InnerItem[],
	onSelected: (selected: InnerItem) => void | Promise<void>,
	onNoMatchingSelectionForString?: (filterText: string, matchingItems: InnerItem[], e: React.KeyboardEvent) => any;
	itemResolver?: () => InnerItem[];
};

export class TS_MultiSelect_<EnclosingItem, K extends keyof EnclosingItem, InnerItem>
	extends Component<Props_TS_MultiSelect_<EnclosingItem, K, InnerItem>, any> {
	static prepare<EnclosingItem, K extends keyof EnclosingItem, InnerItem>(_props: TS_MultiSelect_Renderer_<InnerItem>) {
		return <EnclosingItem, K extends keyof EnclosingItem>(props: DynamicProps_TS_MultiSelect_<EnclosingItem, K> & Partial<StaticProps_TS_MultiSelect_<InnerItem>>) =>
			<TS_MultiSelect_<EnclosingItem, K, InnerItem>
				{..._props}
				{...props}
			/>;
	}

	render() {
		type PropType = EnclosingItem[K];
		const editable: EditableItem<EnclosingItem> = this.props.editable;
		const prop: K = this.props.prop;

		const existingItems = (editable.item[prop] || (editable.item[prop] = [] as unknown as PropType));
		const selectedIds = existingItems as InnerItem[];
		let onNoMatchingSelectionForString: undefined | ((filterText: string, matchingItems: InnerItem[], e: React.KeyboardEvent) => Promise<void>) = undefined;

		const addInnerItem = async (item: InnerItem) => {
			const ids = [...selectedIds, item];
			await editable.update(prop, ids as unknown as PropType);
			this.forceUpdate();
		};

		const props = this.props;
		if (props.createNewItemFromLabel)
			onNoMatchingSelectionForString = async (filterText: string, matchingItems: InnerItem[], e: React.KeyboardEvent) => {
				const item = await props.createNewItemFromLabel!(filterText, matchingItems, e);
				await addInnerItem.call(this, item);
			};

		return <LL_H_C className={_className('ts-values-list', this.props.className)}>
			{selectedIds.map((selectedId, i) => {
				const itemToAdd = props.itemResolver?.().find(i => i === selectedId);
				return <LL_H_C className="ts-values-list__value" key={i}>
					{props.itemRenderer(itemToAdd, async () => {
						removeItemFromArray(selectedIds, selectedId);
						await editable.update(prop, existingItems);
					})}
				</LL_H_C>;
			})}
			{this.renderSelector({
				selectionRenderer: props.selectionRenderer,
				placeholder: props.placeholder,
				noOptionsRenderer: props.noOptionsRenderer,
				selectedIds,
				onNoMatchingSelectionForString: onNoMatchingSelectionForString,
				onSelected: addInnerItem,
				itemResolver: props.itemResolver
			})}
		</LL_H_C>;
	}

	private renderSelector<InnerItem>(props: SelectorRenderer<InnerItem>) {
		const SelectionRenderer = props.selectionRenderer;
		return <SelectionRenderer
			queryFilter={item => !props.selectedIds.includes(item)}
			selected={undefined}
			onSelected={props.onSelected}
			placeholder={props.placeholder}
			noOptionsRenderer={props.noOptionsRenderer}
			onNoMatchingSelectionForString={props.onNoMatchingSelectionForString}
			itemResolver={props.itemResolver}
		/>;
	}
}


