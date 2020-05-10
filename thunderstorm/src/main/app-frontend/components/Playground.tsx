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
import {ReactNode} from "react";
import {GenericSelect} from "./GenericSelect";

export type PlaygroundProps = {
	selectStyle: any,
	iconClose: string,
	iconOpen: string,
	screens: PlaygroundScreen[]
}

type State = {
	selectedScreen?: PlaygroundScreen;
}

export type PlaygroundScreen = {
	name: string
	getNode: () => ReactNode
}

export class Playground extends React.Component<PlaygroundProps, State> {

	constructor(props: PlaygroundProps) {
		super(props);
		this.state = {};
	}

	render() {
		return <div className={'ll_v_c match_height match_width'}>
			<div className='ll_h_c' style={{alignSelf: "start", padding: 20}}>
				<GenericSelect<PlaygroundScreen>
					iconClose={this.props.iconClose}
					iconOpen={this.props.iconOpen}
					selectedOption={this.state.selectedScreen}
					options={this.props.screens}
					onChange={(screen: PlaygroundScreen) => {
						this.setState({selectedScreen: screen});
					}}
					styles={this.props.selectStyle}
					presentation={(screen) => screen.name}
				/>
			</div>
			{this.state.selectedScreen && this.state.selectedScreen.getNode()}
		</div>
	}

}
