import * as React from 'react';
import './ItemEditor_DefaultFilter.scss';
import {Filter} from '@nu-art/ts-common';
import type {Props_Filter} from '@nu-art/editable-item';
import {TS_Icons} from '@nu-art/ts-styles';
import {LL_H_C, TS_Input} from '@nu-art/thunder-widgets/v3';
import type {DB_Prototype} from '@nu-art/db-api-shared';

export class ItemEditor_DefaultFilter<Proto extends DB_Prototype<any>>
	extends React.Component<Props_Filter<Proto>, {
		filter: Filter<Proto['uiType']>;
	}> {
	state = {filter: new Filter(this.props.mapper).setRegexp(false)};

	render() {
		return <LL_H_C className={'item-editor__default-filter'}>
			<TS_Input placeholder={'Type to Filter'} type={'text'} onChange={value => {
				this.props.onFilterChanged((item) => this.state.filter.filterItem(item, value));
			}}/>
			<TS_Icons.Search.component/>
		</LL_H_C>;
	}
}
