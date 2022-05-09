/*
 * Permissions management system, define access level for each of
 * your server apis, and restrict users by giving them access levels
 *
 * Copyright (C) 2020 Adam van der Kruk aka TacB0sS
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {AdapterBuilder, Example_NewProps, Props_DropDown, SimpleListAdapter, TS_DropDown,} from '@nu-art/thunderstorm/frontend';
import * as React from 'react';
import {flatPlaguesWithTitles, ItemRenderer_Plague, Plague, plagues, PlagueWithTitle, RendererMap_Plague} from './consts';
import {Filter} from '@nu-art/ts-common';

export type TestType = {
	prop1?: Plague | PlagueWithTitle,
	prop2?: Plague | PlagueWithTitle,
	prop3?: Plague | PlagueWithTitle,
	prop4?: Plague | PlagueWithTitle,
}

class Example_Dropdown_SingleAndMulti
	extends React.Component<{}, { instance: TestType }> {

	constructor(props: {}) {
		super(props);
		this.state = {instance: {}};
	}

	private plagues = plagues;

	addPlague = () => {
		this.plagues = [...this.plagues, plagues[0]];
		this.forceUpdate();
	};

	render() {
		const props1 = this.simpleAdapterProps();
		const props2 = this.complexAdapterProps();
		return <Example_NewProps renderer={TS_DropDown} data={[props1, props2]}/>;
	}

	private simpleAdapterProps() {
		return {
			id: 'simple',
			key: 'simple',
			adapter: SimpleListAdapter(plagues, (item) => <ItemRenderer_Plague {...item}/>),
			selected: this.state.instance['prop1'],
			onSelected: (item: Plague) => {
				console.log(`Simple Selected: ${item.label}`);
				this.setState(state => ({
					instance: {...state.instance, ['prop1']: item}
				}));
			},
			filter: new Filter((item: Plague) => [item.label]),
			selectedItemRenderer: (selected?: Plague) => {
				if (!selected)
					return <div>{'Simple SHIT'}</div>;

				return <div>{selected.label}</div>;
			},
		} as Props_DropDown<any> & { key: string };
	}

	private complexAdapterProps() {
		return {
			id: 'complex',
			key: 'complex',
			adapter: AdapterBuilder()
				.list()
				.multiRender(RendererMap_Plague)
				.setData(flatPlaguesWithTitles)
				.build(),
			selected: this.state.instance['prop2'],
			onSelected: (item: PlagueWithTitle) => {
				console.log(`Complex Selected: ${item.item.label}`);
				this.setState(state => ({
					instance: {...state.instance, ['prop2']: item}
				}));
			},
			filter: new Filter((item: PlagueWithTitle) => [item.item.label]),
			selectedItemRenderer: (selected?: PlagueWithTitle) => {
				if (!selected)
					return <div>{'Complex SHIT'}</div>;

				return <div>{selected.item.label}</div>;
			},
		} as Props_DropDown<any> & { key: string };
	}
}

export const Playground_DropdownSingleAndMulti = {name:'Dropdown - Single & Multi',renderer: Example_Dropdown_SingleAndMulti}