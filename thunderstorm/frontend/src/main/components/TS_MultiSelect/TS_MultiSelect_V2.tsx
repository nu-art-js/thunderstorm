import * as React from 'react';
import { Component, ReactNode } from 'react';
import { SubsetKeys } from '@nu-art/ts-common';
import './TS_MultiSelect.scss';
import { LL_H_C, LL_V_L } from '../Layouts/index.js';
import { _className } from '../../utils/tools.js';
import { EditableItem } from '../../utils/EditableItem.js';


type Binder_MultiSelect<EnclosingItem, K extends keyof EnclosingItem, ExpectedType> = EnclosingItem[K] extends ExpectedType[]
	? {
		EnclosingItem: EnclosingItem,
		Prop: K,
		InnerType: ExpectedType
	}
	: never

export type DynamicProps_TS_MultiSelect_V2<EnclosingItem, Prop extends keyof EnclosingItem> = {
	editable: EditableItem<EnclosingItem>,
	prop: Prop
	disabled?: boolean;
}

export type StaticProps_TS_MultiSelect_V2<ItemType> = {
	className?: string
	itemsDirection?: 'vertical' | 'horizontal';
	selectionFilter?: (item: ItemType) => boolean; // for the shown list
	itemFilter?: (item: ItemType) => boolean; // for the selection dropdown
	sort?: (items: ItemType[]) => ItemType[];
	getItemKey?: (item: ItemType, indexInList: number) => string | number;
	// mandatory
	itemRenderer: (item: ItemType, onDelete: () => Promise<void>, disabled: boolean, rowIndex: number, listEditable: EditableItem<ItemType[]>) => ReactNode
	selectionRenderer: React.ComponentType<MultiSelect_Selector<ItemType>>,
}

export type Props_TS_MultiSelect_V2<Binder extends Binder_MultiSelect<any, any, any>> =
	StaticProps_TS_MultiSelect_V2<Binder['InnerType']>
	& DynamicProps_TS_MultiSelect_V2<Binder['EnclosingItem'], Binder['Prop']>

export type MultiSelect_Selector<ItemType> = {
	className: string
	existingItems: ItemType[],
	onSelected: (selected: ItemType) => void | Promise<void>,
	queryFilter?: (item: ItemType) => boolean;
};

export class TS_MultiSelect_V2<Binder extends Binder_MultiSelect<any, any, any>>
	extends Component<Props_TS_MultiSelect_V2<Binder>, any> {

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	static prepare<EnclosingItem, K extends keyof EnclosingItem, InnerType>(_props: StaticProps_TS_MultiSelect_V2<InnerType>) {
		return <EnclosingItem_, Prop extends SubsetKeys<keyof EnclosingItem_, EnclosingItem_, InnerType[] | undefined>>(props: DynamicProps_TS_MultiSelect_V2<EnclosingItem_, Prop> & Partial<StaticProps_TS_MultiSelect_V2<InnerType>>) =>
			<TS_MultiSelect_V2<Binder_MultiSelect<EnclosingItem_, Prop, InnerType>>
				{..._props}
				{...props}
			/>;
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
		const className = _className(
			'ts-multi-select__list',
			this.props.disabled && 'disabled',
			this.props.className
		);

		return <Wrapper className={className}>
			{/*selected items list*/}
			{itemsToRender.map((item, i) => {
				const key = props.getItemKey?.(item, i) ?? i
				return <LL_H_C className="ts-multi-select__list-value" key={key}>
					{props.itemRenderer(
						item,
						async () => {
							const index = existingItems.indexOf(item);
							if (index < 0)
								return;
							await editableProp.removeArrayItem(index);
							this.forceUpdate();
						},
						this.props.disabled ?? false,
						i,
						editableProp
					)}
				</LL_H_C>;
			})}
			{/*dropdown - only render if not disabled*/}
			{!this.props.disabled && SelectionRenderer({
				className: 'ts-multi-select__selector',
				onSelected: addInnerItem,
				existingItems: existingItems,
				queryFilter: this.props.itemFilter
			})}
		</Wrapper>;
	}
}