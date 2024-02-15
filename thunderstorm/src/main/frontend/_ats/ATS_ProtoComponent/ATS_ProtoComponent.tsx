import * as React from 'react';
import {AppToolsScreen, ATS_Frontend} from '../../components/TS_AppTools';
import {LL_V_L} from '../../components/Layouts';
import './ATS_ProtoComponent.scss';
import {generateArray} from '@nu-art/ts-common';
import {TS_PropRenderer} from '../../components/TS_PropRenderer';
import {TS_DropDown} from '../../components/TS_Dropdown';
import {SimpleListAdapter} from '../../components/adapter/Adapter';
import {ProtoComponent, ProtoComponent_Props, ProtoComponent_State, ProtoComponentDef} from '../../core/proto-component';

type Keys = 'selectedNumber';

type ComponentDef = ProtoComponentDef<Keys, {
	selectedNumber: number;
}>

type State = {
	selectedNumber: number;
}

export class ATS_ProtoComponent
	extends ProtoComponent<ComponentDef, {}, State> {

	static defaultProps: Partial<ProtoComponent_Props<ComponentDef>> = {
		queryParamsKeys: ['selectedNumber'],
	};

	protected deriveStateFromProps(nextProps: ProtoComponent_Props<ComponentDef>, state: ProtoComponent_State<ComponentDef> & State) {
		state = super.deriveStateFromProps(nextProps, state);
		state.selectedNumber = state.queryParams.selectedNumber.get();
		return state;
	}

	static screen: AppToolsScreen = {
		name: 'ProtoComponent',
		key: 'proto-component',
		renderer: this,
		group: ATS_Frontend,
	};

	private renderNumberDropDown = () => {
		const numbers = generateArray(10);
		const adapter = SimpleListAdapter(numbers, item => <>{item.item}</>);
		return <TS_PropRenderer.Vertical label={'Number Dropdown'}>
			<TS_DropDown
				adapter={adapter}
				selected={this.state.selectedNumber}
				onSelected={number => {
					this.setQueryParam('selectedNumber', number);
				}}
			/>
		</TS_PropRenderer.Vertical>;
	};

	render() {
		return <LL_V_L id={'ats-proto-component'}>
			{this.renderNumberDropDown()}
		</LL_V_L>;
	}
}
