import * as React from "react";
import {BaseComponent} from "@nu-art/thunderstorm/frontend";
import {ScaleLinear} from "d3-scale";

type Props = {
	yScale: ScaleLinear<number, number, any>,
	width: number,
	ticks?: number,
	tickValues?: string[],
	placeInMiddle?: boolean
}

export class AxisLeft
	extends BaseComponent<Props, {}> {

	constructor(props: Props) {
		super(props);
	}

	axisX = () => {
		const axis = this.props.yScale.ticks(this.props.ticks || 5).map((d, i) => (
			<g className="y-tick" key={i}>
				<line
					style={{stroke: "#e4e5eb"}}
					y1={this.props.yScale(d)}
					y2={this.props.yScale(d)}
					x2={this.props.width}
				/>
				<text style={{fontSize: 12}} x={-20} dy=".32em"
				      y={this.props.placeInMiddle ? this.props.yScale(d) + ((this.props.yScale(this.props.yScale.ticks(this.props.ticks)[i + 1]) - this.props.yScale(d)) / 2) : this.props.yScale(d)}>
					{this.props.tickValues ? this.props.tickValues[d] : d}
				</text>
			</g>
		));
		return <>{axis}</>;
	};

	render() {
		return this.axisX();
	}
}

export default AxisLeft;