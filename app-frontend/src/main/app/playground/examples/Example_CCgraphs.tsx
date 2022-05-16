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

import * as React from 'react';
import {ComponentSync} from '@nu-art/thunderstorm/app-frontend/core/ComponentSync';
import Example_LineGraph, {D3ChartData} from './d3components/Example_LineGraph';
import Example_TableGraph, {TableData} from './d3components/Example_TableGraph';

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

export class Example_CCgraphs_Renderer
	extends ComponentSync<Props, { data: D3ChartData[], tableData: TableData[] }> {

	protected deriveStateFromProps(nextProps: Props): { data: D3ChartData[]; tableData: TableData[]; } {
		return {
			data: [{
				label: 'line 1',
				data: [{x: 1609545600000, y: 100}, {x: 1609632000000, y: 79}, {x: 1609718400000, y: 98}, {x: 1609804800000, y: 99}, {
					x: 1609891200000,
					y: 78
				}, {x: 1610064000000, y: 101}, {x: 1610236800000, y: 99},
					{x: 1610323200000, y: 88}, {x: 1610496000000, y: 92}, {x: 1610755200000, y: 95}],
				color: '#b596b7',
				baseValue: 95
			}
				, {
					label: 'line 2',
					data: [{x: 1609545600000, y: 88}, {x: 1609632000000, y: 72}, {x: 1609718400000, y: 71}, {x: 1609804800000, y: 84}, {
						x: 1609891200000,
						y: 90
					}, {x: 1610064000000, y: 81}],
					color: '#92c0c0',
					baseValue: 88
				}
			],
			tableData: [{
				label: 'x',
				data: [{x: 2, y: 1}],
				color: 'lightpink',
				icon: <circle r={15} style={{fill: 'lightpink'}}/>
			},
				{
					label: 'x',
					data: [{x: 1, y: 1}],
					color: 'lightblue',
					icon: <circle r={15} style={{fill: 'lightblue'}}/>
				},
				{
					label: 'x',
					data: [{x: 5, y: 0}],
					color: 'DarkTurquoise',
					icon: <circle r={15} style={{fill: 'DarkTurquoise'}}/>
				},
				{
					label: 'x',
					data: [{x: 7, y: 0}],
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

	private axesLabelsX = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

	render() {
		return <div>
			<div style={{width: '100%'}}>
				<div style={{float: 'left', width: '70%'}}>
					<Example_LineGraph
						data={this.state.data}
						frequency={86400000}
						startFromValue={50}
						axesLabels={{x: this.axesLabelsX}}
						borderBoxValues={['90', '88', '92', '99', '89', '91', '90']}
						xDomain={7}/>
					<br/>
				</div>
				<div style={{float: 'left', width: '70%'}}>
					<Example_TableGraph
						frequency={1}
						rows={3}
						data={this.state.tableData}
						xDomain={7}
						axesLabels={{x: this.axesLabelsX, y: ['Stress reduction', 'Physical']}}/>
				</div>
			</div>
		</div>;
	}
}


export const Example_CCgraphs = {renderer: Example_CCgraphs_Renderer, name: 'CC Graphs'};