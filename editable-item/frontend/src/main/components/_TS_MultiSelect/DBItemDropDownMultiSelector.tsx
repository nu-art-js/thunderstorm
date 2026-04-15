/*
 * DBItemDropDownMultiSelector — multiselect that uses a GenericDropDown as UI selector.
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {DB_Prototype} from '@nu-art/db-api-shared';
import {ModuleFE_BaseApi} from '@nu-art/db-api-frontend';
import {ComponentSync} from '@nu-art/thunder-widgets';
import {MultiSelect_Selector, StaticProps_TS_MultiSelect_V2} from '../TS_MultiSelect/TS_MultiSelect_V2.js';

type Props<Proto extends DB_Prototype<any>> = {
	selector: MultiSelect_Selector<string>;
	uiSelector: UISelector<Proto>;
	queryFilter?: (id: string) => boolean;
};

type UISelector<Proto extends DB_Prototype<any>> = (props: {
	queryFilter: (item: Proto['dbType']) => boolean;
	onSelected: (selected: Proto['dbType']) => void;
}) => JSX.Element;

export type MultiSelectDropDownPropsV3<Proto extends DB_Prototype<any>> = {
	module: ModuleFE_BaseApi<Proto>;
	itemRenderer: (item?: Readonly<Proto['dbType']>, onDelete?: () => Promise<void>, disabled?: boolean) => JSX.Element;
	uiSelector: UISelector<Proto>;
};

export class DBItemDropDownMultiSelector<Proto extends DB_Prototype<any>>
	extends ComponentSync<Props<Proto>> {

	static selector = <Proto_ extends DB_Prototype<any>>(uiSelector: UISelector<Proto_>) => {
		return (selector: MultiSelect_Selector<string>) => <DBItemDropDownMultiSelector
			selector={selector}
			uiSelector={uiSelector}
			queryFilter={selector.queryFilter}
		/>;
	};

	static propsV3 = <Proto_ extends DB_Prototype<any>>(props: MultiSelectDropDownPropsV3<Proto_>): StaticProps_TS_MultiSelect_V2<string> => {
		return {
			itemRenderer: (itemId, onDelete?: () => Promise<void>, disabled?: boolean) => {
				const dbItem = props.module.cache.unique(itemId);
				return props.itemRenderer(dbItem, onDelete, disabled);
			},
			selectionRenderer: DBItemDropDownMultiSelector.selector(props.uiSelector),
			selectionFilter: () => true,
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

	protected deriveStateFromProps(nextProps: Props<Proto>, _state: Partial<object> | undefined) {
		return {onSelected: nextProps.selector.onSelected};
	}
}
