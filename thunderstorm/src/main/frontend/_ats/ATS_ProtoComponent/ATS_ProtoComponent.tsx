import * as React from 'react';
import {AppToolsScreen, ATS_Frontend} from '../../components/TS_AppTools';
import {LL_H_C, LL_V_L} from '../../components/Layouts';
import './ATS_ProtoComponent.scss';
import {generateArray, SubsetObjectByKeys, UniqueId} from '@nu-art/ts-common';
import {TS_PropRenderer} from '../../components/TS_PropRenderer';
import {TS_DropDown} from '../../components/TS_Dropdown';
import {SimpleListAdapter} from '../../components/adapter/Adapter';
import {ProtoComponent, ProtoComponentDef} from '../../core/proto-component';
import {TS_Button} from '../../components/TS_Button';
import {ComponentSync} from '../../core/ComponentSync';


type Keys = 'selectedNumber' | 'selectedExampleId';
type Example = {
	id: UniqueId;
	str: string;
	num?: number;
}

const examples: Example[] = [
	{
		id: '111',
		str: 'example 1',
		num: 10
	},
	{
		id: '222',
		str: 'example 2'
	},
	{
		id: '333',
		str: 'example 3',
		num: 30
	}
];

type ComponentDef1 = ProtoComponentDef<Keys, {
	selectedNumber: number;
	selectedExampleId: UniqueId;
}>

type State = {
	selectedNumber?: number;
	selectedExampleId?: UniqueId;
}

export class ATS_ProtoComponent
	extends ProtoComponent<ComponentDef1, {}, State> {

	static defaultProps: Partial<ComponentDef1['props']> = {
		queryParamsKeys: ['selectedNumber', 'selectedExampleId'],
	};

	protected deriveStateFromProps(nextProps: ComponentDef1['props'], state: ComponentDef1['state'] & State) {
		state = super.deriveStateFromProps(nextProps, state);
		state.selectedNumber = state.queryParams.selectedNumber.get();
		state.selectedExampleId = state.queryParams.selectedExampleId.get();
		return state;
	}

	static screen: AppToolsScreen = {
		name: 'ProtoComponent',
		key: 'proto-component',
		renderer: this,
		group: ATS_Frontend,
	};

	private selectRandomData = () => {
		const selectedNumber = Math.floor(Math.random() * 9);
		const selectedExample = examples[Math.floor(Math.random() * (examples.length - 1))];
		this.setQueryParams({
			selectedNumber,
			selectedExampleId: selectedExample.id
		});
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
			<TS_Button onClick={() => this.deleteQueryParam('selectedNumber')}>Clear Selected Number</TS_Button>
		</TS_PropRenderer.Vertical>;
	};

	private renderExampleDropDown = () => {
		const adapter = SimpleListAdapter(examples, i => <>{i.item.str}</>);
		const selected = examples.find(i => i.id === this.state.selectedExampleId);
		return <>
			<TS_PropRenderer.Vertical label={'Example Dropdown'}>
				<TS_DropDown<Example>
					adapter={adapter}
					selected={selected}
					onSelected={selected => {
						this.setQueryParam('selectedExampleId', selected.id);
					}}/>
				<TS_Button onClick={() => this.deleteQueryParam('selectedExampleId')}>Clear Selected Example</TS_Button>
			</TS_PropRenderer.Vertical>
			<TS_PropRenderer.Vertical label={'Selected Example Data'}>
				<div>id: {selected?.id ?? '-'}</div>
				<div>str: {selected?.str ?? '-'}</div>
				<div>num: {selected?.num ?? '-'}</div>
			</TS_PropRenderer.Vertical>
		</>;
	};

	render() {
		return <LL_V_L id={'ats-proto-component'}>
			<TS_Button onClick={this.selectRandomData}>Select Random Data</TS_Button>
			{this.renderNumberDropDown()}
			{this.renderExampleDropDown()}
		</LL_V_L>;
	}
}

export class ATS_ProtoComponentDouble
	extends ComponentSync {

	static screen: AppToolsScreen = {
		name: 'ProtoComponent Double',
		key: 'proto-component-double',
		renderer: this,
		group: ATS_Frontend,
	};

	render() {
		return <LL_H_C>
			<ATS_ProtoComponent/>
			<ATS_ProtoComponent/>
		</LL_H_C>;
	}
}
