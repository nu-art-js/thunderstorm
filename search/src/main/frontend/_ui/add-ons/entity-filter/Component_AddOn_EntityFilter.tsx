import * as React from 'react';
import {SearchAddOn, SearchItem} from '../../../_core';
import {Component_SearchAddOn} from '../../components/Component_SearchAddOn';
import {AddOn_EntityFilter, AddOnDef_EntityFilter} from './types';
import {TS_PropRenderer} from '@nu-art/thunderstorm/frontend';
import {InferProps, InferState} from '@nu-art/thunderstorm/frontend/utils/types';

type Props = { label?: string };

type State = {
	label: string;
	activeSearchItems: SearchItem<any, any>[];
}

export class Component_AddOn_EntityFilter
	extends Component_SearchAddOn<AddOnDef_EntityFilter, Props, State> {

	public addOn: SearchAddOn<AddOnDef_EntityFilter> = AddOn_EntityFilter;

	protected deriveStateFromProps(nextProps: InferProps<this>, state: InferState<this>) {
		state.label = nextProps.label ?? 'By Entity';
		state.activeSearchItems = nextProps.context.getActiveSearchItems();
		return state;
	}

	render() {
		return <TS_PropRenderer.Vertical label={this.state.label}>

		</TS_PropRenderer.Vertical>;
	}
}