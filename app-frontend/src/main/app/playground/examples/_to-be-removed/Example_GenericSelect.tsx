/*
 * A typescript & react boilerplate with api call example
 *
 * Copyright (C) 2020 Intuition Robotics
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

import * as React from "react";
import {GenericSelect} from "@intuitionrobotics/thunderstorm/app-frontend/components/GenericSelect";
import {ICONS} from "@res/icons";
import {selectStyles} from "../../Page_Playground";

type State = {
	selectedOption?: Option
}

type Option = {
	title: string
	value: number
}

const options: Option[] = [
	{
		title: "one",
		value: 1
	},
	{
		title: "two",
		value: 2
	}
];

export class Example_GenericSelect extends React.Component<{}, State> {

	constructor(props: {}) {
		super(props);
		this.state = {
			selectedOption: undefined
		}
	}

	render(){
		const selectedOption = this.state.selectedOption;
		return <div>
			<button onClick={() => {
				this.setState({selectedOption: undefined})
			}}>Clear</button>
			<div style={{height: 20}}/>
			<GenericSelect<Option>
				iconClose={ICONS.arrowClose(undefined, 14)}
				iconOpen={ICONS.arrowOpen(undefined, 14)}
				selectedOption={selectedOption}
				options={options}
				onChange={(o: Option) => {
					console.log(`selected ${o.title}`);
					this.setState({selectedOption: o});
				}}
				styles={selectStyles}
				presentation={(o) => o.title}
			/>
			<div style={{height: 20}}/>
			<span>{selectedOption ? selectedOption.title : "none"}</span>
		</div>
	}
}

