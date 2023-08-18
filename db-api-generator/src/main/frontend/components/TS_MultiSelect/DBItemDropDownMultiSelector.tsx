import {DB_Object} from '@nu-art/ts-common';
import {MultiSelect_Selector} from '@nu-art/thunderstorm/frontend/components/TS_MultiSelect';
import {ComponentSync} from '@nu-art/thunderstorm/frontend';
import * as React from 'react';
import {PartialProps_GenericDropDown} from '../GenericDropDown';


type Props<DBType extends DB_Object> = {
	selector: MultiSelect_Selector<string>,
	uiSelector: ((props: PartialProps_GenericDropDown<DBType>) => JSX.Element)
};

export class DBItemDropDownMultiSelector<DBType extends DB_Object>
	extends ComponentSync<Props<DBType>> {
	static selector = <DBType extends DB_Object>(uiSelector: (props: PartialProps_GenericDropDown<DBType>) => JSX.Element) => {
		return (selector: MultiSelect_Selector<string>) => <DBItemDropDownMultiSelector selector={selector} uiSelector={uiSelector}/>;
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
