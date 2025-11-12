import * as React from 'react';
import {LL_H_C, TS_Input} from '@nu-art/thunderstorm/frontend';
import {SearchAddOn} from '../../../_core';
import {Component_SearchAddOn} from '../../components/Component_SearchAddOn';
import {AddOn_SearchTerm, AddOnDef_SearchTerm} from './types';
import './Component_AddOn_SearchTerm.scss';
import {TS_Icons} from '@nu-art/ts-styles';

export class Component_AddOn_SearchTerm
	extends Component_SearchAddOn<AddOnDef_SearchTerm> {

	public addOn: SearchAddOn<AddOnDef_SearchTerm> = AddOn_SearchTerm;

	render() {
		return <LL_H_C className={'search-add-on__search-term'}>
			<TS_Input
				type={'text'}
				value={this.state.value}
				onChange={val => this.setValue(val)}
			/>
			<TS_Icons.Search.component/>
		</LL_H_C>;
	}
}