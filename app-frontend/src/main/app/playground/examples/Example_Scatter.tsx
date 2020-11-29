import * as React from "react";
import {BaseComponent} from "@nu-art/thunderstorm/app-frontend/core/BaseComponent";
import {scaleLinear} from "d3-scale";
import AxisLeft from "./d3components/Example_AxisLeft";
import AxisBottom from "./d3components/Example_AxisBottom.";

export class Example_Scatter
	extends BaseComponent {

	randomData = () => {
		const data = [...Array(100)].map((e, i) => {
			return {
				x: Math.random() * 50,
				y: Math.random() * 50,
				temperature: Math.random() * 500
			};
		});
		return data;
	};

	private data = this.randomData();
	w = 600;
	h = 600;
	margin = {
		top: 40,
		bottom: 40,
		left: 40,
		right: 40
	};
	width = this.w - this.margin.right - this.margin.left
	height = this.h - this.margin.top - this.margin.bottom

	xScale = scaleLinear()
		.domain([0, 50])
		.range([0, this.width]);

	yScale = scaleLinear()
		.domain([0, 50])
		.range([this.height, 0]);

	circles = this.data.map((d, i) => (
		<circle
			key={i}
			r={5}
			cx={this.xScale(d.x)}
			cy={this.yScale(d.y)}
			style={{fill: "lightblue"}}
		/>
	));

	render() {
		return <div>
			<h1>Scatter plot using React + D3</h1>
			<svg width={this.w} height={this.h}>
				<g transform={`translate(${this.margin.left},${this.margin.top})`}>
					<AxisLeft yScale={this.yScale} width={this.width}/>
					<AxisBottom xScale={this.xScale} height={this.height}/>
					{this.circles}
				</g>
			</svg>
		</div>;
	}

}


export default Example_Scatter;