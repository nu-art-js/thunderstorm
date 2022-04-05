import * as React from "react";
import {ComponentSync} from "@nu-art/thunderstorm/frontend";
import {ScaleLinear} from "d3-scale";

type Props = {
	yScale: ScaleLinear<number, number, any>,
	width: number,
	ticks?: number,
	axisPoint?: number,
	tickValues?: string[],
	placeInMiddle?: boolean,
	tickLines?: boolean
}

export class AxisLeft
	extends ComponentSync<Props, {}> {

	constructor(props: Props) {
		super(props);
	}

	axisGridLabels = () => {
		const axis = this.props.yScale.ticks(this.props.ticks || 5).map((d, i) => (
			<g className="y-tick" key={i}>
				{this.props.tickLines && <line
					style={{stroke: "#a6aab2"}}
					y1={this.props.yScale(d)}
					y2={this.props.yScale(d)}
					x1={-30}
					x2={this.props.width}
				/>}
				<text style={{fontSize: 12}} x={-20} dy=".32em"
				      y={this.props.placeInMiddle ? this.props.yScale(d) + ((this.props.yScale(this.props.yScale.ticks(this.props.ticks)[i + 1]) - this.props.yScale(d)) / 2) : this.props.yScale(d)}>
					{this.props.tickValues ? this.tspans(this.props.tickValues[d]) : this.tspans(d.toString())}
					{/*{this.props.tickValues ? this.props.tickValues[d] : d}*/}
				</text>
			</g>
		));
		return <>{axis}</>;
	};

	tspans = (value: string) => {
		if (!value)
			return;
		if(value.split(" ").length === 1)
			return value
		return value.split(" ").map((_value, index) => <tspan x={-30} dy={index > 0 ? '1.2em': '0.1em'}>{_value}</tspan>);
	};


	axisLine = () => {
		const min = Math.min(...this.props.yScale.ticks(this.props.ticks || 5));
		return <g className="x-line">
			<line
				style={{
					stroke: "#a6aab2", strokeWidth: 1
				}}
				y1={this.props.yScale(min)}
				y2={this.props.yScale(min)}
				x1={this.props.axisPoint}
				x2={this.props.width}
			/>
		</g>;
	};

	render() {
		return <>
			{this.axisGridLabels()}
			{this.axisLine()}
		</>;
	}
}

export default AxisLeft;