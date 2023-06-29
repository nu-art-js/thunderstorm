import * as React from 'react';
import {Component, ReactNode} from 'react';
import {EditableItem, LL_H_C, PartialProps_DropDown, TS_PropRenderer} from '@nu-art/thunderstorm/frontend';
import './TS_MultiSelect.scss';
import {AssetValueType, DB_Object, PreDB, removeItemFromArray} from '@nu-art/ts-common';
import {PartialProps_GenericDropDown} from '../GenericDropDown';
import {ModuleFE_BaseApi} from '../../modules/ModuleFE_BaseApi';


export type TS_MultiSelect_Renderer<InnerItem extends DB_Object> = {
	label: string,
	module: ModuleFE_BaseApi<InnerItem>,
	itemRenderer: (item?: InnerItem, onDelete?: () => Promise<void>) => ReactNode
	placeholder: string
	noOptionsRenderer: string
	createNewItemFromLabel?: (filterText: string, matchingItems: InnerItem[], e: React.KeyboardEvent) => Promise<PreDB<InnerItem>>;
	selectionRenderer: React.ComponentType<PartialProps_GenericDropDown<InnerItem> | PartialProps_DropDown<InnerItem>>,
	itemResolver?: () => InnerItem[]
};

export type DynamicProps_TS_MultiSelect<EnclosingItem, K extends keyof EnclosingItem> = {
	editable: EditableItem<EnclosingItem>,
	prop: AssetValueType<EnclosingItem, K, string[]>
}

export type StaticProps_TS_MultiSelect<InnerItem extends DB_Object> = {
	props: TS_MultiSelect_Renderer<InnerItem>
}

export type Props_TS_MultiSelect<EnclosingItem, K extends keyof EnclosingItem, InnerItem extends DB_Object> =
	StaticProps_TS_MultiSelect<InnerItem> & DynamicProps_TS_MultiSelect<EnclosingItem, K>

type SelectorRenderer<InnerItem extends DB_Object> = {
	selectionRenderer: React.ComponentType<PartialProps_GenericDropDown<InnerItem> | PartialProps_DropDown<InnerItem>>
	placeholder: string
	noOptionsRenderer: string
	selectedIds: string[],
	onSelected: (selected: InnerItem) => void | Promise<void>,
	onNoMatchingSelectionForString?: (filterText: string, matchingItems: InnerItem[], e: React.KeyboardEvent) => any;
	itemResolver?: () => InnerItem[];
};

export class TS_MultiSelect<EnclosingItem, K extends keyof EnclosingItem, InnerItem extends DB_Object>
	extends Component<Props_TS_MultiSelect<EnclosingItem, K, InnerItem>, any> {

	render() {
		type PropType = EnclosingItem[AssetValueType<EnclosingItem, K, string[]>];
		const editable: EditableItem<EnclosingItem> = this.props.editable;
		const prop: K = this.props.prop;

		const selectedIdsAsPropType = (editable.item[prop] || (editable.item[prop] = [] as unknown as PropType));
		const selectedIds = selectedIdsAsPropType as unknown as string[];
		let onNoMatchingSelectionForString: undefined | ((filterText: string, matchingItems: InnerItem[], e: React.KeyboardEvent) => Promise<void>) = undefined;

		const addInnerItem = async (dbItem: InnerItem) => {
			const ids = [...selectedIds, dbItem._id];
			await editable.update(prop, ids as unknown as PropType);
			this.forceUpdate();
		};

		const props = this.props.props;
		if (props.createNewItemFromLabel)
			onNoMatchingSelectionForString = async (filterText: string, matchingItems: InnerItem[], e: React.KeyboardEvent) => {
				const item = await props.createNewItemFromLabel!(filterText, matchingItems, e);
				const dbItem = await props.module.v1.upsert(item).executeSync();
				await addInnerItem.call(this, dbItem);
			};

		return <TS_PropRenderer.Vertical label={props.label}>
			<LL_H_C className="ts-values-list">
				{selectedIds.map(selectedId => {
					const itemToAdd = props.itemResolver?.().find(i => i._id === selectedId) || props.module.cache.unique(selectedId);
					return <LL_H_C className="ts-values-list__value" key={selectedId}>
						{props.itemRenderer(itemToAdd, async () => {
							removeItemFromArray(selectedIds, selectedId);
							await editable.update(prop, selectedIdsAsPropType);
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
			</LL_H_C>
		</TS_PropRenderer.Vertical>;
	}

	private renderSelector<InnerItem extends DB_Object>(props: SelectorRenderer<InnerItem>) {
		const SelectionRenderer = props.selectionRenderer;
		return <SelectionRenderer
			queryFilter={item => !props.selectedIds.includes(item._id)}
			selected={undefined}
			onSelected={props.onSelected}
			placeholder={props.placeholder}
			noOptionsRenderer={props.noOptionsRenderer}
			onNoMatchingSelectionForString={props.onNoMatchingSelectionForString}
			itemResolver={props.itemResolver}
		/>;
	}
}
