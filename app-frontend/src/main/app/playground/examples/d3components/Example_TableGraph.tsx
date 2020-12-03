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

import * as React from "react";
import {ReactNode} from "react";
import {BaseComponent} from "@nu-art/thunderstorm/app-frontend/core/BaseComponent";
import {scaleLinear} from "d3-scale";
import {
	AxesLabels,
	Coordinates,
	D3ChartData
} from "./Example_LineGraph";
import AxisX from "./Example_AxisX";
import AxisYBorder from "./Example_AxisYBorder";

export type TableData = D3ChartData & {
	icon?: ReactNode
}

type Props = {
	rows: number,
	axesLabels: AxesLabels,
	data: TableData[]
}


export class Example_TableGraph
	extends BaseComponent<Props, {}> {

	constructor(props: Props) {
		super(props);
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

	private maxX = this.props.axesLabels.x.length;
	private maxY = this.props.rows;

	private midX = () => {
		return (this.xScale()(this.xScale().ticks(this.maxX)[1]) - this.xScale()(this.xScale().ticks(this.maxX)[0]))/ 2
	}

	private midY = () => {
		return (this.yScale()(this.yScale().ticks(this.maxY)[1]) - this.yScale()(this.yScale().ticks(this.maxY)[0]))/ 2
	}

	xScale = () => {
		return scaleLinear()
			.domain([0, this.maxX + 1])
			.range([0, this.width]);
	};

	yScale = () => scaleLinear()
		.domain([0, this.maxY])
		.range([this.height, 0]);

	plots = (data: Coordinates[], color: string, icon?: ReactNode) =>
		data.map((d, i) =>
			         <svg
				         key={i}
				         x={this.xScale()(d.x) + this.midX()}
				         y={this.yScale()(d.y) - this.midY()}
				         style={{overflow: 'visible'}}>{icon}</svg>);


	render() {
		return <>
			<svg width={this.w} height={this.h} style={{float: 'left'}}>
				<g transform={`translate(${this.margin.left},${this.margin.top})`}>
					<AxisX yScale={this.yScale()} width={this.width} ticks={this.maxY} tickValues={this.props.axesLabels.y} placeInMiddle={true}/>
					<AxisYBorder xScale={this.xScale()} height={this.height} ticks={this.maxX} tickValues={[""].concat(this.props.axesLabels.x)} placeInMiddle={true}/>
					{this.props.data.map(_data => this.plots(_data.data, _data.color, _data.icon))}
				</g>
			</svg>
		</>;
	}

}


export default Example_TableGraph;