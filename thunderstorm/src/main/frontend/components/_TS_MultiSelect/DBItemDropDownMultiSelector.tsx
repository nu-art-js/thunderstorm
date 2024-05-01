import {DBProto, UniqueId} from '@nu-art/ts-common';
import * as React from 'react';
import {MultiSelect_Selector, StaticProps_TS_MultiSelect_V2} from '../TS_MultiSelect';
import {ModuleFE_v3_BaseApi} from '../../modules/db-api-gen/ModuleFE_v3_BaseApi';
import {ComponentSync} from '../../core/ComponentSync';


type UISelector<Proto extends DBProto<any>> = (props: {
	queryFilter: (item: Proto['dbType']) => boolean
	onSelected: (selected: Proto['dbType']) => void
}) => JSX.Element;

type Props<Proto extends DBProto<any>> = {
	selector: MultiSelect_Selector<string>,
	uiSelector: UISelector<Proto>;
	queryFilter?: (id: UniqueId) => boolean;
};

export type MultiSelectDropDownPropsV3<Proto extends DBProto<any>> = {
	module: ModuleFE_v3_BaseApi<Proto>;
	itemRenderer: (item?: Readonly<Proto['dbType']>, onDelete?: () => Promise<void>) => JSX.Element
	uiSelector: UISelector<Proto>
}

export class DBItemDropDownMultiSelector<Proto extends DBProto<any>>
	extends ComponentSync<Props<Proto>> {

	static selector = <Proto extends DBProto<any>>(uiSelector: UISelector<Proto>) => {
		return (selector: MultiSelect_Selector<string>) => <DBItemDropDownMultiSelector
			selector={selector}
			uiSelector={uiSelector}
			queryFilter={selector.queryFilter}
		/>;
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

		const filter = (item: Proto['dbType']) => {
			return !selector.existingItems.includes(item._id)
				&& (this.props.queryFilter ? this.props.queryFilter(item._id) : true);
		};

		return <UISelector
			queryFilter={filter}
			onSelected={item => selector.onSelected(item._id)}
		/>;
	}

	protected deriveStateFromProps(nextProps: Props<Proto>, state: Partial<{}> | undefined) {
		return {onSelected: nextProps.selector.onSelected};
	}
}
