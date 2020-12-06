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
import {GenericSelect} from "../GenericSelect";
import {BrowserHistoryModule} from "../../modules/HistoryModule";
import {Example_NewProps} from "./Example_NewProps";

const PLAYGROUND = "playground"

export type PlaygroundProps = {
	selectStyle: any
	iconClose: React.ReactNode
	iconOpen: React.ReactNode
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

export class Playground
	extends React.Component<PlaygroundProps, State> {

	constructor(props: PlaygroundProps) {
		super(props);
		const queryParam = BrowserHistoryModule.getQueryParams()[PLAYGROUND];
		const screen = this.props.screens.find(s => s.name === queryParam);
		this.state = {selectedScreen: screen}
	}

	render() {
		return <div className={'match_height match_width'}>
			<div style={{alignSelf: "start", padding: "20px"}}>
				<GenericSelect<PlaygroundScreen>
					iconClose={this.props.iconClose}
					iconOpen={this.props.iconOpen}
					selectedOption={this.state.selectedScreen}
					options={this.props.screens}
					onChange={(screen: PlaygroundScreen) => {
						this.setState({selectedScreen: screen})
						BrowserHistoryModule.addQueryParam(PLAYGROUND, screen.name)
					}}
					styles={this.props.selectStyle}
					presentation={(screen) => screen.name}
				/>
			</div>
			<div style={{borderStyle: "double", display: "inline-block", padding: "12px", margin: "12px"}}>{this.renderPlayground()}</div>
		</div>
	}

	private renderPlayground() {
		if (!this.state.selectedScreen)
			return <div>Select a playground</div>

		const data = this.state.selectedScreen.data;
		if (!data || data.length === 0)
			return <this.state.selectedScreen.renderer/>

		if (data.length === 1)
			return <this.state.selectedScreen.renderer {...data[0]}/>

		return <Example_NewProps name={this.state.selectedScreen.name} data={data} renderer={this.state.selectedScreen.renderer}/>
	}
}
