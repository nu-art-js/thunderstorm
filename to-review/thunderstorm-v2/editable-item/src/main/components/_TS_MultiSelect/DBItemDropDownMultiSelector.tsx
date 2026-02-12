import {DBPointer, DBProto, UniqueId} from '@nu-art/ts-common';
import * as React from 'react';
import {MultiSelect_Selector, StaticProps_TS_MultiSelect_V2} from '../TS_MultiSelect/index.js';
import {ComponentSync, GenericDropDown_DBPointer_Item, ModuleFE_BaseApi} from '@nu-art/web-client';
import {TS_Icons} from '@nu-art/ts-styles';

type Props<Proto extends DBProto<any>> = {
	selector: MultiSelect_Selector<string>,
	uiSelector: UISelector<Proto>;
	queryFilter?: (id: UniqueId) => boolean;
};

// ############################ DB Item ############################

type UISelector<Proto extends DBProto<any>> = (props: {
	queryFilter: (item: Proto['dbType']) => boolean
	onSelected: (selected: Proto['dbType']) => void
}) => JSX.Element;


export type MultiSelectDropDownPropsV3<Proto extends DBProto<any>> = {
	module: ModuleFE_BaseApi<Proto>;
	itemRenderer: (item?: Readonly<Proto['dbType']>, onDelete?: () => Promise<void>, disabled?: boolean) => JSX.Element
	uiSelector: UISelector<Proto>
}

export class DBItemDropDownMultiSelector<Proto extends DBProto<any>>
	extends ComponentSync<Props<Proto>> {

	static selector = <Proto_ extends DBProto<any>>(uiSelector: UISelector<Proto_>) => {
		return (selector: MultiSelect_Selector<string>) => <DBItemDropDownMultiSelector
			selector={selector}
			uiSelector={uiSelector}
			queryFilter={selector.queryFilter}
		/>;
	};

	static propsV3 = <Proto_ extends DBProto<any>>(props: MultiSelectDropDownPropsV3<Proto_>): StaticProps_TS_MultiSelect_V2<string> => {
		return {
			itemRenderer: (itemId, onDelete?: () => Promise<void>, disabled?: boolean) => {
				const dbItem = props.module.cache.unique(itemId);
				return props.itemRenderer(dbItem, onDelete, disabled);
			},
			selectionRenderer: DBItemDropDownMultiSelector.selector(props.uiSelector),
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			selectionFilter: (item) => true,
		};
	};

	render() {
		const UISelector = this.props.uiSelector;
		const selector = this.props.selector;

		const filter = (item: Proto['dbType']) => {
			return !selector.existingItems.includes(item._id)
				&& (this.props.queryFilter ? this.props.queryFilter(item._id) : true);
		};

		return <UISelector
			queryFilter={filter}
			onSelected={item => selector.onSelected(item._id)}
		/>;
	}

	protected deriveStateFromProps(nextProps: Props<Proto>, state: Partial<object> | undefined) {
		return {onSelected: nextProps.selector.onSelected};
	}
}

// ############################ DB Pointer ############################

type Props_DBPointer<Proto extends DBProto<any>> = {
	selector: MultiSelect_Selector<DBPointer>,
	uiSelector: UISelector<Proto>;
	queryFilter?: (item: DBPointer) => boolean;
};

type UISelector_DBPointer<Proto extends DBProto<any>> = (props: {
	queryFilter: (item: GenericDropDown_DBPointer_Item<Proto>) => boolean
	onSelected: (selected: GenericDropDown_DBPointer_Item<Proto>) => void
}) => JSX.Element

export type MultiSelectDropDownProps_DBPointer<Proto extends DBProto<any>> = {
	uiSelector: UISelector_DBPointer<Proto>
	pointerProps: {
		[P in Proto as P['dbKey']]: {
			module: ModuleFE_BaseApi<P>;
			mapper: (item: GenericDropDown_DBPointer_Item<P>) => string[];
			renderer: (item?: Readonly<DBPointer>, onDelete?: () => Promise<void>, disabled?: boolean) => React.ReactElement
		}
	}
}

export class DBItemDropDownMultiSelector_DBPointer<Proto extends DBProto<any>>
	extends ComponentSync<Props_DBPointer<Proto>> {

	static selector = <Proto_ extends DBProto<any>>(uiSelector: UISelector_DBPointer<Proto_>) => {
		return (selector: MultiSelect_Selector<DBPointer>) => <DBItemDropDownMultiSelector_DBPointer
			selector={selector}
			uiSelector={uiSelector}
			queryFilter={selector.queryFilter}
		/>;
	};

	static defaultItemRenderer = (onDelete?: () => Promise<void>, disabled?: boolean) => {
		return <>{!disabled && <TS_Icons.x.component onClick={onDelete}/>}{'N/A'}</>;
	};

	static props = <Proto_ extends DBProto<any>>(props: MultiSelectDropDownProps_DBPointer<Proto_>): StaticProps_TS_MultiSelect_V2<DBPointer> => {
		return {
			itemRenderer: (item, onDelete, disabled) => {
				if (!item)
					return DBItemDropDownMultiSelector_DBPointer.defaultItemRenderer(onDelete, disabled);

				const itemRenderer = props.pointerProps[item.dbKey as Proto_['dbKey']].renderer;
				return itemRenderer(item, onDelete, disabled);
			},
			selectionRenderer: DBItemDropDownMultiSelector_DBPointer.selector(props.uiSelector),
			selectionFilter: (item) => true,
		};
	};

	render() {
		const UISelector = this.props.uiSelector;
		const selector = this.props.selector;

		const filter = (item: GenericDropDown_DBPointer_Item<Proto>) => {
			const existing = selector.existingItems.find(existing => existing.id === item.item._id);
			return !existing && (this.props.queryFilter ? this.props.queryFilter(item.item._id) : true);
		};

		return <UISelector
			queryFilter={filter}
			onSelected={item => selector.onSelected({dbKey: item.dbKey, id: item.item._id})}
		/>;
	}

	protected deriveStateFromProps(nextProps: Props_DBPointer<Proto>, state: Partial<{}> | undefined) {
		return {onSelected: nextProps.selector.onSelected};
	}
}