import * as React from 'react';
import {Component, ReactNode} from 'react';
import {AssetValueType, DB_Object, PreDB, removeItemFromArray} from '@nu-art/ts-common';
import {PartialProps_GenericDropDown} from '../GenericDropDown';
import {ModuleFE_BaseApi} from '../../modules/db-api-gen/ModuleFE_BaseApi';
import {PartialProps_DropDown} from '../TS_Dropdown';
import {EditableItem} from '../../utils/EditableItem';
import {LL_H_C} from '../Layouts';
import {_className} from '../../utils/tools';


export type TS_MultiSelect_Renderer<InnerItem extends DB_Object> = {
	className?: string
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
	prop: AssetValueType<EnclosingItem, K, string[] | undefined>
}

export type StaticProps_TS_MultiSelect<InnerItem extends DB_Object> = TS_MultiSelect_Renderer<InnerItem>

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
	static prepare<EnclosingItem, K extends keyof EnclosingItem, InnerItem extends DB_Object>(_props: TS_MultiSelect_Renderer<InnerItem>) {
		return <EnclosingItem, K extends keyof EnclosingItem>(props: DynamicProps_TS_MultiSelect<EnclosingItem, K> & Partial<StaticProps_TS_MultiSelect<InnerItem>>) =>
			<TS_MultiSelect<EnclosingItem, K, InnerItem>
				{..._props}
				{...props}
			/>;
	}

	render() {
		type PropType = EnclosingItem[AssetValueType<EnclosingItem, K, string[] | undefined>];
		const editable: EditableItem<EnclosingItem> = this.props.editable;
		const prop: K = this.props.prop;

		const selectedIdsAsPropType = (editable.item[prop] || (editable.item[prop] = [] as unknown as PropType));
		const selectedIds = selectedIdsAsPropType as unknown as string[];
		let onNoMatchingSelectionForString: undefined | ((filterText: string, matchingItems: InnerItem[], e: React.KeyboardEvent) => Promise<void>) = undefined;

		const addInnerItem = async (dbItem: InnerItem) => {
			const ids = [...selectedIds, dbItem._id] as PropType;
			const values: {} = {[prop]: ids};
			await editable.updateObj(values);
			this.forceUpdate();
		};

		const props = this.props;
		if (props.createNewItemFromLabel)
			onNoMatchingSelectionForString = async (filterText: string, matchingItems: InnerItem[], e: React.KeyboardEvent) => {
				const item = await props.createNewItemFromLabel!(filterText, matchingItems, e);
				const dbItem = await props.module.v1.upsert(item).executeSync();
				await addInnerItem.call(this, dbItem);
			};

		return <LL_H_C className={_className('ts-values-list', this.props.className)}>
			{selectedIds.map(selectedId => {
				const itemToAdd = props.itemResolver?.().find(i => i._id === selectedId) || props.module.cache.unique(selectedId);
				return <LL_H_C className="ts-values-list__value" key={selectedId}>
					{props.itemRenderer(itemToAdd, async () => {
						removeItemFromArray(selectedIds, selectedId);
						const values: {} = {[prop]: selectedIdsAsPropType};
						await editable.updateObj(values);
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


