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
import {ReactNode} from 'react';
import {ComponentSync} from '@nu-art/thunderstorm/frontend/core/ComponentSync';
import {scaleLinear} from 'd3-scale';
import {AxesLabels, Coordinates, D3ChartData} from './Example_LineGraph';
import AxisLeft from './Example_AxisX';
import AxisBottom from './Example_AxisBottom.';


export type TableData = D3ChartData & {
	icon?: ReactNode
}

type Props = {
	rows?: number,
	axesLabels: AxesLabels,
	data: TableData[],
	xDomain?: number,
	frequency: number
}

export class Example_TableGraph
	extends ComponentSync<Props, {}> {

	protected deriveStateFromProps(nextProps: Props): {} {
		return {};
	}

	w = 600;
	h = 300;
	margin = {
		top: 40,
		bottom: 40,
		left: 40,
		right: 40
	};
	width = this.w - this.margin.right - this.margin.left;
	height = this.h - this.margin.top - this.margin.bottom;

	private maxX = this.props.axesLabels.x ? this.props.axesLabels.x.length : 0;

	private midY = () => {
		return (this.yScale()(this.yScale().ticks(this.minAndMax().maxY)[1]) - this.yScale()(this.yScale().ticks(this.minAndMax().maxY)[0])) / 2;
	};

	private minAndMax = () => {
		let arrayOfProps: Coordinates[] = [];
		this.props.data.map(_lineData => {
			arrayOfProps = arrayOfProps.concat([], _lineData.data);
		});
		return this.extent(arrayOfProps);
	};

	private extent = (domain: Coordinates[]) => {
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

	xScale = () => {
		return scaleLinear()
			.domain([0, this.props.xDomain || this.maxX + 1])
			.range([0, this.width]);
	};

	yScale = () => scaleLinear()
		.domain([0, (this.minAndMax().maxY + 1)])
		.range([this.height, 0]);

	plots = (data: Coordinates[], color: string, icon?: ReactNode) =>
		data.map((d, i) =>
			<svg
				key={i}
				x={this.xScale()(d.x)}
				y={this.yScale()(d.y) + this.midY() / 2}
				style={{overflow: 'visible'}}>{icon}</svg>);

	render() {
		return <>
			<svg width={this.w} height={this.h} style={{float: 'left'}}>
				<g transform={`translate(${this.margin.left},${this.margin.top})`}>
					<AxisLeft yScale={this.yScale()}
										width={this.xScale()(this.props.xDomain ? this.props.xDomain + 1 : 8)}
										ticks={this.minAndMax().maxY + 1}
										tickValues={this.props.axesLabels.y}
										placeInMiddle={true}
										tickLines={true}/>
					<AxisBottom xScale={this.xScale()}
											frequency={this.props.frequency}
											height={this.height}
											tickValues={this.props.axesLabels?.x}
											axisPoint={0}
											viewBox={7}/>
					{this.props.data.map(_data => this.plots(_data.data, _data.color, _data.icon))}
				</g>
			</svg>
		</>;
	}

}

export default Example_TableGraph;