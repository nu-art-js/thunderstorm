/*
 * Permissions management system, define access level for each of
 * your server apis, and restrict users by giving them access levels
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
import {BaseComponent} from "@intuitionrobotics/thunderstorm/app-frontend/core/BaseComponent";
import Example_LineGraph, {D3ChartData} from "./d3components/Example_LineGraph";
import Example_TableGraph, {TableData} from "./d3components/Example_TableGraph";
import {TS_Input} from "@intuitionrobotics/thunderstorm/app-frontend/components/TS_Input";

export type Coordinates = {
	x: number,
	y: number
}
type baseValue = {
	y: number
}
export type Props = {
	baseValue?: baseValue[]
}

export class Example_CCgraphs
	extends BaseComponent<Props, { data: D3ChartData[], tableData: TableData[] }> {

	constructor(props: Props) {
		super(props);
		this.state = {
			data: [{
				label: 'line 1',
				data: [{x: 0, y: 100}, {x: 1, y: 79}, {x: 2, y: 98}],
				color: 'rgb(255, 99, 132)'
			}, {
				label: 'line 2',
				data: [{x: 0, y: 68}, {x: 1, y: 74}, {x: 2, y: 89}],
				color: 'lightpink'
			}],
			tableData: [{
				label: 'x',
				data: [{x: 2, y: 2}],
				color: 'lightpink',
				icon: <circle r={15} style={{fill: 'lightpink'}}/>
			},
				{
					label: 'x',
					data: [{x: 1, y: 2}],
					color: 'lightblue',
					icon: <circle r={15} style={{fill: 'lightblue'}}/>
				},
				{
					label: 'x',
					data: [{x: 5, y: 1}],
					color: 'DarkTurquoise',
					icon: <circle r={15} style={{fill: 'DarkTurquoise'}}/>
				},
				{
					label: 'x',
					data: [{x: 7, y: 1}],
					color: 'PaleGreen',
					icon: <circle r={15} style={{fill: 'PaleGreen'}}/>
				}]
		};
	}

	updateData = (newData: Coordinates, label: string) => {
		this.setState((state) => {
			const d3line = this.state.data.find(_data => _data.label === label);
			d3line && d3line.data.push(newData);
			return (state);
		});
	};

	private x = 'Monday'
	private y = 0;
	private axesLabelsX = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]


	render() {
		return <div>
			<div style={{width: '100%'}}>
				<div style={{float: 'left', width: '70%'}}>
					<Example_LineGraph data={this.state.data} startFromZero={true} axesLabels={{x: this.axesLabelsX}} borderBox={true}
					borderBoxValues={['90', '88', '92', '99', '89', '91', '90']}/>
					<br/>
					<TS_Input onChange={(x) => this.x = x} type='text' id={'x'} placeholder={'type systic x value'}/>
					<TS_Input onChange={(y) => this.y = parseInt(y)} type='text' id={'y'} placeholder={'type systic y value'}/>
					<button onClick={() => this.updateData({x: this.axesLabelsX.indexOf(this.x), y: this.y}, 'line 1')}>plot</button>
				</div>
				<div style={{float: 'left', width: '70%'}}>
					<Example_TableGraph rows={3} data={this.state.tableData}
					                    axesLabels={{x: this.axesLabelsX, y: ['Stress reduction', 'Physical']}}/>
				</div>
			</div>
		</div>;
	}
}


export default Example_CCgraphs;