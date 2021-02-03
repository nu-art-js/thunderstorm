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
import {BaseComponent} from "@nu-art/thunderstorm/frontend";
import {ScaleLinear} from "d3-scale";
import {ReactNode} from "react";

type Props = {
	xScale: ScaleLinear<number, number, any>,
	height: number,
	width?: number
	frequency: number,
	viewBox: number,
	paginated?: boolean,
	axisPoint?: number,
	tickValues?: string[],
	borderBoxValues?: ReactNode[],
	shiftData?: boolean,
	axisLine?: number
}

export class AxisBottom
	extends BaseComponent<Props, {}> {

	constructor(props: Props) {
		super(props);
	}

	calculateTicksByFreq = () => {
		if (!this.props.axisPoint)
			return this.props.xScale.ticks(this.props.viewBox);
		let i = 0;
		let currentValue = this.props.axisPoint
		if(this.props.shiftData)
			currentValue += this.props.frequency
		const tickValues = [];
		while (i < this.props.viewBox) {
			tickValues.push(currentValue);
			currentValue += this.props.frequency;
			i += 1;
		}
		console.log('these are the ticks', tickValues);
		return tickValues
	};

	axisBottom = () => {
		const textPaddingY = !!this.props.borderBoxValues ? 45 : 10;
		return this.calculateTicksByFreq().map((d, i) => (
			<svg className="x-tick" key={i} style={{overflow: 'visible'}}>
				<line
					style={{stroke: "#e4e5eb"}}
					y1={0}
					y2={this.props.height}
					x1={this.props.xScale(d)}
					x2={this.props.xScale(d)}
				/>
				{!!this.props.borderBoxValues && <svg style={{overflow: 'visible'}}>
					<text x={this.props.xScale(d)}
					      y={this.props.height + 15}
					      dominantBaseline={"middle"}
					      textAnchor={"middle"}>{this.props.borderBoxValues && this.props.borderBoxValues[i]}</text>
					<line
						style={{stroke: "#a6aab2"}}
						y1={this.props.height + 30}
						y2={this.props.height + 30}
						x1={this.props.xScale(this.props.axisPoint || 0)}
						x2={this.props.width || 200}
					/>
				</svg>}
				<text
					style={{textAnchor: "middle", fontSize: 12}}
					dy=".71em"
					x={this.props.xScale(d + 1)}
					y={this.props.height + textPaddingY}
				>
					{this.props.tickValues ? this.props.tickValues[i] : d}
				</text>
			</svg>
		));
	};

	axisLine = () => {
		return <line
			style={{stroke: "#a6aab2"}}
			y1={0}
			y2={!!this.props.borderBoxValues ? this.props.height + 30 : this.props.height}
			x1={this.props.xScale(this.props.axisPoint || 0)}
			x2={this.props.xScale(this.props.axisPoint || 0)}
		/>;
	};

	private scroll = () => <svg>
		<rect width={this.props.xScale(this.props.frequency)} height="15" style={{fill: '#f6f6f9', strokeWidth: 3}} y={this.props.height + 30}/>
		<text y={this.props.height + 40} x={this.props.xScale(this.props.frequency)}>{'>'}</text>
	</svg>;

	render() {
		return <>
			{this.axisBottom()}
			{this.props.paginated && this.scroll()}
			{this.axisLine()}
		</>;
	}

}


export default AxisBottom;