import {DB_Object, PreDB} from '@nu-art/ts-common';
import {MultiSelect_Selector, StaticProps_TS_MultiSelect_V2} from '@nu-art/thunderstorm/frontend/components/TS_MultiSelect';
import {ComponentSync} from '@nu-art/thunderstorm/frontend';
import * as React from 'react';
import {PartialProps_GenericDropDown} from '../GenericDropDown';
import {ModuleFE_BaseApi} from '../../modules/ModuleFE_BaseApi';


type Props<DBType extends DB_Object> = {
	selector: MultiSelect_Selector<string>,
	uiSelector: ((props: PartialProps_GenericDropDown<DBType>) => JSX.Element)
};

export type MultiSelectDropDownProps<DBType extends DB_Object, Ks extends keyof PreDB<DBType>> = {
	module: ModuleFE_BaseApi<DBType, Ks>;
	itemRenderer: (item?: Readonly<DBType>, onDelete?: () => Promise<void>) => JSX.Element
	uiSelector: (props: PartialProps_GenericDropDown<DBType>) => JSX.Element
}

export class DBItemDropDownMultiSelector<DBType extends DB_Object>
	extends ComponentSync<Props<DBType>> {
	static selector = <DBType extends DB_Object>(uiSelector: (props: PartialProps_GenericDropDown<DBType>) => JSX.Element) => {
		return (selector: MultiSelect_Selector<string>) => <DBItemDropDownMultiSelector selector={selector} uiSelector={uiSelector}/>;
	};

	static props = <DBType extends DB_Object, Ks extends keyof PreDB<DBType>>(props: MultiSelectDropDownProps<DBType, Ks>): StaticProps_TS_MultiSelect_V2<string> => {
		return {
			itemRenderer: (itemId, onDelete?: () => Promise<void>) => {
				const dbItem = props.module.cache.unique(itemId);
				return props.itemRenderer(dbItem, onDelete);
			},
			selectionRenderer: DBItemDropDownMultiSelector.selector(props.uiSelector)
		};
	};

	render() {
		const UISelector = this.props.uiSelector;
		const selector = this.props.selector;

		return <UISelector
			queryFilter={item => !selector.existingItems.includes(item._id)}
			onSelected={item => selector.onSelected(item._id)}
		/>;
	}

	protected deriveStateFromProps(nextProps: Props<DBType>, state: Partial<{}> | undefined) {
		return {onSelected: nextProps.selector.onSelected};
	}
}
