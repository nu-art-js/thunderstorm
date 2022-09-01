/*
 * Thunderstorm is a full web app framework!
 *
 * Typescript & Express backend infrastructure that natively runs on firebase function
 * Typescript & React frontend infrastructure
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

import * as React from 'react';
import {ModuleFE_BrowserHistory} from '../../modules/ModuleFE_BrowserHistory';
import {Example_NewProps} from './Example_NewProps';
import {TS_DropDown} from '../TS_Dropdown';
import {SimpleListAdapter} from '../adapter/Adapter';
import {Filter} from '@nu-art/ts-common';
import './TS_Playground.scss';
import {LL_V_L} from '../Layouts';


export type PlaygroundProps = {
	iconClose?: React.ReactNode
	iconOpen?: React.ReactNode
	screens: PlaygroundScreen[]
}

type State = {
	selectedScreen?: PlaygroundScreen;
}

export type PlaygroundScreen<T extends any = any> = {
	name: string
	renderer: React.ComponentType<T>
	data?: T[]
}
const QueryKey_SelectedPlayground = 'playground';

export class TS_Playground
	extends React.Component<PlaygroundProps, State> {

	constructor(props: PlaygroundProps) {
		super(props);
		const queryParam = ModuleFE_BrowserHistory.getQueryParams()[QueryKey_SelectedPlayground];
		const screen = this.props.screens.find(s => s.name === queryParam);
		this.state = {selectedScreen: screen};
	}

	render() {
		return <LL_V_L className="ts-playground">
			<div className="ts-playground__selector">
				<TS_DropDown<PlaygroundScreen>
					caret={{
						close: this.props.iconClose,
						open: this.props.iconOpen
					}}
					filter={new Filter(option => ([option.name]))}
					onSelected={(screen: PlaygroundScreen) => {
						this.setState({selectedScreen: screen});
						ModuleFE_BrowserHistory.addQueryParam(QueryKey_SelectedPlayground, screen.name);
					}}
					selected={this.state.selectedScreen}
					adapter={SimpleListAdapter(this.props.screens, (props) => {
						return <div className="ts-playground__item">{props.item.name}</div>;
					})}/>
			</div>
			<div className="ts-playground__container">{this.renderPlayground()}</div>
		</LL_V_L>;
	}

	private renderPlayground() {
		if (!this.state.selectedScreen)
			return <div>Select a playground</div>;

		const data = this.state.selectedScreen.data;
		if (!data || data.length === 0)
			return <this.state.selectedScreen.renderer/>;

		if (data.length === 1)
			return <this.state.selectedScreen.renderer {...data[0]}/>;

		return <Example_NewProps name={this.state.selectedScreen.name} data={data} renderer={this.state.selectedScreen.renderer}/>;
	}
}
