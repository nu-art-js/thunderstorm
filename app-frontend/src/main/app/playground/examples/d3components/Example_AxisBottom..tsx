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
import {BaseComponent} from "@ir/thunderstorm/frontend";
import {ScaleLinear} from "d3-scale";

type Props = {
	xScale: ScaleLinear<number, number, any>,
	height: number,
	ticks?: number,
	tickValues?: string[],
	placeInMiddle?: boolean,
	borderBox?: boolean,
	borderBoxValues?: string[]
}

export class AxisBottom
	extends BaseComponent<Props, {}> {

	constructor(props: Props) {
		super(props);
	}

	axisBottom = () => {
		const textPaddingY = this.props.borderBox ? 35 : 10;
		// const textPaddingX = this.props.textPaddingX || 0

		const axis = this.props.xScale.ticks(this.props.ticks).map((d, i) => (
			<svg className="x-tick" key={i} style={{overflow: 'visible'}}>
				<line
					style={{stroke: "#e4e5eb"}}
					y1={0}
					y2={this.props.height}
					x1={this.props.xScale(d)}
					x2={this.props.xScale(d)}
				/>
				{this.props.borderBox && <svg style={{overflow: 'visible'}}>
					<rect
						width={this.props.xScale(this.props.xScale.ticks(this.props.ticks)[i + 1]) - this.props.xScale(d)}
						height={30}
						x={this.props.xScale(d)}
						y={this.props.height}
						style={{strokeWidth: 1, fill: 'none', stroke: 'black'}}/>
					<text x={this.props.xScale(d) + ((this.props.xScale(this.props.xScale.ticks(this.props.ticks)[i + 1]) - this.props.xScale(d)) / 2)} y={this.props.height + 15} dominantBaseline={"middle"}
					      textAnchor={"middle"}>{this.props.borderBoxValues && this.props.borderBoxValues[i]}</text>
				</svg>}
				<text
					style={{textAnchor: "middle", fontSize: 12}}
					dy=".71em"
					x={this.props.placeInMiddle ? this.props.xScale(d) + ((this.props.xScale(this.props.xScale.ticks(this.props.ticks)[i + 1]) - this.props.xScale(d)) / 2) : this.props.xScale(d)}
					y={this.props.height + textPaddingY}
				>
					{this.props.tickValues ? this.props.tickValues[d] : d}
				</text>
			</svg>
		));
		return <>{axis}</>;
	};

	render() {
		return this.axisBottom();
	}

}


export default AxisBottom;