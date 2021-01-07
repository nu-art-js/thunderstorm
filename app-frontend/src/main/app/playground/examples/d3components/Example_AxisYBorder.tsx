import * as React from "react";
import {BaseComponent} from "@intuitionrobotics/thunderstorm/frontend";
import {ScaleLinear} from "d3-scale";

type Props = {
	xScale: ScaleLinear<number, number, any>,
	height: number,
	ticks?: number,
	tickValues?: string[],
	placeInMiddle?: boolean
}

export class AxisYBorder
	extends BaseComponent<Props, {}> {

	constructor(props: Props) {
		super(props);
	}

	axisBottom = () => {
		const textPaddingY = 10;

		const axis = this.props.xScale.ticks(this.props.ticks).map((d, i) => (
			<g className="x-tick" key={i}>
				<line
					style={{stroke: "#e4e5eb"}}
					y1={0}
					y2={i === 1 ? this.props.height : 0}
					x1={this.props.xScale(d)}
					x2={this.props.xScale(d)}
				/>
				<text
					style={{textAnchor: "middle", fontSize: 12}}
					dy=".71em"
					x={this.props.placeInMiddle ? this.props.xScale(d) + ((this.props.xScale(this.props.xScale.ticks(this.props.ticks)[i + 1]) - this.props.xScale(d)) / 2) : this.props.xScale(d)}
					y={this.props.height + textPaddingY}
				>
					{this.props.tickValues ? this.props.tickValues[d] : d}
				</text>
			</g>
		));
		return <>{axis}</>;
	};

	render() {
		return this.axisBottom();
	}

}


export default AxisYBorder;