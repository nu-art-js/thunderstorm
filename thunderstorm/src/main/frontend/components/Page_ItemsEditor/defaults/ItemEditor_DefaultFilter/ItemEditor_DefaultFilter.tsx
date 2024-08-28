import * as React from 'react';
import './ItemEditor_DefaultFilter.scss';
import {DBProto, Filter} from '@thunder-storm/common';
import {ItemEditor_FilterType, ItemEditor_MapperType} from '../../types';
import {TS_Input} from '../../../TS_Input';
import {LL_H_C} from '../../../Layouts';
import {TS_Icons} from '@thunder-storm/styles';


export type Props_Filter<Proto extends DBProto<any>> = {
	onFilterChanged: (filter: ItemEditor_FilterType<Proto>) => void
	mapper: ItemEditor_MapperType<Proto>
};

export class ItemEditor_DefaultFilter<Proto extends DBProto<any>>
	extends React.Component<Props_Filter<Proto>, { filter: Filter<Proto['uiType']> }> {

	state = {filter: new Filter(this.props.mapper)};

	render() {
		return <LL_H_C className={'item-editor__default-filter'}>
			<TS_Input
				className={'margin__bottom'} placeholder={'Type to Filter'} type={'text'}
				onChange={value => {
					this.props.onFilterChanged((item) => this.state.filter.filterItem(item, value));
				}}/>
			<TS_Icons.Search.component/>
		</LL_H_C>;
	}
}