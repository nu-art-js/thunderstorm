import * as React from 'react';
import {ProtoComponent, ProtoComponentDef} from '../../core/ProtoComponent';
import {AppToolsScreen, ATS_Frontend} from '../../components/TS_AppTools';
import {TS_Button} from '../../components/TS_Button';
import {LL_V_L} from '../../components/Layouts';
import './ATS_ProtoComponent.scss';
import {generateHex} from '@nu-art/ts-common';

type Props = {}
type State = {}

type ComponentDef = ProtoComponentDef<{}, Props, State, 'value1' | 'value2', {
	'value1': number,
	'value2': string
}>

export class ATS_ProtoComponent
	extends ProtoComponent<ComponentDef> {

	static defaultProps = {
		queryParamsKeys: ['value1', 'value2'],
	};

	static screen: AppToolsScreen = {
		name: 'ProtoComponent',
		key: 'proto-component',
		renderer: this,
		group: ATS_Frontend,
	};

	private setRandomValue1 = () => {
		this.setQueryParam('value1', Math.random() * 100);
		this.forceUpdate();
	};

	private setRandomValue2 = () => {
		this.setQueryParam('value2', generateHex(10));
		this.forceUpdate();
	};

	render() {
		return <LL_V_L id={'ats-proto-component'}>
			<TS_Button onClick={this.setRandomValue1}>Set Random Number</TS_Button>
			<div>Number read from query param: {this.getQueryParam('value1')}</div>
			<TS_Button onClick={this.setRandomValue2}>Set Random String</TS_Button>
			<div>String read from query param: {this.getQueryParam('value2')}</div>
		</LL_V_L>;
	}
}