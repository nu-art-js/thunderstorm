/*
 * A typescript & react boilerplate with api call example
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
import {ComponentSync} from '@nu-art/thunderstorm/frontend/core/ComponentSync';
import {scaleLinear} from 'd3-scale';
import AxisLeft from './d3components/Example_AxisX';
import AxisBottom from './d3components/Example_AxisBottom.';
import {TS_Input} from '@nu-art/thunderstorm/frontend';


export type Coordinates = {
	x: number,
	y: number
}

export class Example_Scatter_Renderer
	extends ComponentSync<{}, { data: Coordinates[] }> {

	protected deriveStateFromProps(nextProps: {}): { data: Coordinates[] } {
		return {data: [{x: 5, y: 5}]};
	}

	constructor(props: {}) {
		super(props);
		this.state = {
			data: [{x: 5, y: 5}]
		};
	}

	private minAndMax = () => this.extent(this.state.data);

	private circles = () => this.state.data.map((d, i) => (
		<circle
			key={i}
			r={5}
			cx={this.xScale()(d.x)}
			cy={this.yScale()(d.y)}
			style={{fill: 'lightblue'}}
		/>
	));

	w = 600;
	h = 600;
	margin = {
		top: 40,
		bottom: 40,
		left: 40,
		right: 40
	};
	width = this.w - this.margin.right - this.margin.left;
	height = this.h - this.margin.top - this.margin.bottom;

	extent = (domain: Coordinates[]) => {
		console.log('this is the domain, ', domain);
		let minX = Number.MAX_VALUE;
		let maxX = Number.MIN_VALUE;
		let minY = Number.MAX_VALUE;
		let maxY = Number.MIN_VALUE;
		domain.forEach(_xy => {
			if (_xy.x < minX)
				minX = _xy.x;
			if (_xy.y < minY)
				minY = _xy.y;
			if (_xy.x > maxX)
				maxX = _xy.x;
			if (_xy.y > maxY)
				maxY = _xy.y;
		});
		return {minX, maxX, minY, maxY};
	};

	private x = 0;
	private y = 0;

	xScale = () => {
		return scaleLinear()
			.domain([this.minAndMax().minX, this.minAndMax().maxX])
			.range([0, this.width]);
	};

	yScale = () => scaleLinear()
		.domain([this.minAndMax().minY, this.minAndMax().maxY])
		.range([this.height, 0]);

	updateData = (newData: Coordinates) => {
		console.log('updating...');
		this.setState((state) => {
			state.data.push(newData);
			return state;
		});
	};

	render() {
		return <div>
			<TS_Input onChange={(x) => this.x = parseInt(x)} type="text" id={'x'} placeholder={'type x value'}/>
			<TS_Input onChange={(y) => this.y = parseInt(y)} type="text" id={'y'} placeholder={'type y value'}/>
			<button onClick={() => this.updateData({x: this.x, y: this.y})}>plot</button>
			<h1>Scatter plot using React + D3</h1>
			<svg width={this.w} height={this.h}>
				<g transform={`translate(${this.margin.left},${this.margin.top})`}>
					<AxisLeft yScale={this.yScale()} width={this.width}/>
					<AxisBottom xScale={this.xScale()} height={this.height} frequency={1} viewBox={7}/>
					{this.circles()}
				</g>
			</svg>
		</div>;
	}

}

export const Example_Scatter = {renderer: Example_Scatter_Renderer, name: 'Scatter Plot'};