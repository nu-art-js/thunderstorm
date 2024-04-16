import {DB_Object, DBProto, PreDB, UniqueId} from '@nu-art/ts-common';
import * as React from 'react';
import {PartialProps_GenericDropDown} from '../GenericDropDown';
import {MultiSelect_Selector, StaticProps_TS_MultiSelect_V2} from '../TS_MultiSelect';
import {ModuleFE_BaseApi} from '../../modules/db-api-gen/ModuleFE_BaseApi';
import {ModuleFE_v3_BaseApi} from '../../modules/db-api-gen/ModuleFE_v3_BaseApi';
import {ComponentSync} from '../../core/ComponentSync';


type Props<DBType extends DB_Object> = {
	selector: MultiSelect_Selector<string>,
	uiSelector: ((props: PartialProps_GenericDropDown<DBType>) => JSX.Element);
	queryFilter?: (id: UniqueId) => boolean;
};

export type MultiSelectDropDownProps<DBType extends DB_Object, Ks extends keyof PreDB<DBType>> = {
	module: ModuleFE_BaseApi<DBType, Ks>;
	itemRenderer: (item?: Readonly<DBType>, onDelete?: () => Promise<void>) => JSX.Element
	uiSelector: (props: PartialProps_GenericDropDown<DBType>) => JSX.Element
}

export type MultiSelectDropDownPropsV3<Proto extends DBProto<any>> = {
	module: ModuleFE_v3_BaseApi<Proto>;
	itemRenderer: (item?: Readonly<Proto['dbType']>, onDelete?: () => Promise<void>) => JSX.Element
	uiSelector: (props: PartialProps_GenericDropDown<Proto['dbType']>) => JSX.Element
}

export class DBItemDropDownMultiSelector<DBType extends DB_Object>
	extends ComponentSync<Props<DBType>> {
	static selector = <DBType extends DB_Object>(uiSelector: (props: PartialProps_GenericDropDown<DBType>) => JSX.Element) => {
		return (selector: MultiSelect_Selector<string>) => <DBItemDropDownMultiSelector
			selector={selector}
			uiSelector={uiSelector}
			queryFilter={selector.queryFilter}
		/>;
	};

	static props = <DBType extends DB_Object, Ks extends keyof PreDB<DBType>>(props: MultiSelectDropDownProps<DBType, Ks>): StaticProps_TS_MultiSelect_V2<string> => {
		return {
			itemRenderer: (itemId, onDelete?: () => Promise<void>) => {
				const dbItem = props.module.cache.unique(itemId);
				return props.itemRenderer(dbItem, onDelete);
			},
			selectionRenderer: DBItemDropDownMultiSelector.selector(props.uiSelector),
			selectionFilter: (item) => true,
		};
	};
	static propsV3 = <Proto extends DBProto<any>>(props: MultiSelectDropDownPropsV3<Proto>): StaticProps_TS_MultiSelect_V2<string> => {
		return {
			itemRenderer: (itemId, onDelete?: () => Promise<void>) => {
				const dbItem = props.module.cache.unique(itemId);
				return props.itemRenderer(dbItem, onDelete);
			},
			selectionRenderer: DBItemDropDownMultiSelector.selector(props.uiSelector),
			selectionFilter: (item) => true,
		};
	};

	render() {
		const UISelector = this.props.uiSelector;
		const selector = this.props.selector;

		const filter = (item: DBType) => {
			return !selector.existingItems.includes(item._id)
				&& (this.props.queryFilter ? this.props.queryFilter(item._id) : true);
		};

		return <UISelector
			queryFilter={filter}
			onSelected={item => selector.onSelected(item._id)}
		/>;
	}

	protected deriveStateFromProps(nextProps: Props<DBType>, state: Partial<{}> | undefined) {
		return {onSelected: nextProps.selector.onSelected};
	}
}
