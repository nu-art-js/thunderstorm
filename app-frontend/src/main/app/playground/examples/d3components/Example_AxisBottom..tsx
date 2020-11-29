import * as React from "react";
import {BaseComponent} from "@nu-art/thunderstorm/frontend";
import {ScaleLinear} from "d3-scale";

type Props = {
	xScale: ScaleLinear<number, number, any>,
	height: number,
	ticks?: number
}

export class AxisBottom
	extends BaseComponent<Props, {}> {

	constructor(props: Props) {
		super(props);
	}

	axisBottom = () => {
		const textPadding = 10;

		const axis = this.props.xScale.ticks().map((d, i) => (
			<g className="x-tick" key={i}>
				<line
					style={{stroke: "#e4e5eb"}}
					y1={0}
					y2={this.props.height}
					x1={this.props.xScale(d)}
					x2={this.props.xScale(d)}
				/>
				<text
					style={{textAnchor: "middle", fontSize: 12}}
					dy=".71em"
					x={this.props.xScale(d)}
					y={this.props.height + textPadding}
				>
					{d}
				</text>
			</g>
		));
		return <>{axis}</>;
	};

	render() {
		return this.axisBottom();
	}

}


export default AxisBottom;