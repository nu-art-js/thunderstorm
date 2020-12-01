import * as React from "react";
import {BaseComponent} from "@nu-art/thunderstorm/app-frontend/core/BaseComponent";
import {scaleLinear} from "d3-scale";
import AxisLeft from "./Example_AxisLeft";
import AxisBottom from "./Example_AxisBottom.";

export type Coordinates = {
	x: number,
	y: number
}

export type LineData = {
	label: string,
	data: Coordinates[],
	color: string
}
type baseValue = {
	y: number
}

type AxesLabels = {
	x: string,
	y: string
}

export type Props = {
	data: LineData[],
	axesLabels?: AxesLabels,
	baseValue?: baseValue[]
}

export class Example_LineGraph
	extends BaseComponent<Props, {}> {

	constructor(props: Props) {
		super(props);
	}

	private minAndMax = () => {
		let arrayOfProps: Coordinates[] = [];
		this.props.data.map(_lineData => {
			console.log('props data:', _lineData.data)
			arrayOfProps = arrayOfProps.concat([], _lineData.data);
		});
		console.log(arrayOfProps);
		return this.extent(arrayOfProps);
	};

	private circles = (data: Coordinates[], color: string) => data.map((d, i) => (
		<circle
			key={i}
			r={5}
			cx={this.xScale()(d.x)}
			cy={this.yScale()(d.y)}
			style={{fill: color}}
		/>
	));

	private lines = (color: string, data: Coordinates[]) => {
		const lineArray = [];
		if (data.length > 1)
			for (let i = 0; i < data.length - 1; i++) {
				lineArray.push(<line x1={this.xScale()(data[i].x)} x2={this.xScale()(data[i + 1].x)} y1={this.yScale()(data[i].y)}
				                     y2={this.yScale()(data[i + 1].y)}
				                     strokeWidth={3} stroke={color}/>);
			}
		return lineArray;
	};

	w = 600;
	h = 400;
	margin = {
		top: 40,
		bottom: 40,
		left: 40,
		right: 40
	};
	width = this.w - this.margin.right - this.margin.left;
	height = this.h - this.margin.top - this.margin.bottom;

	extent = (domain: Coordinates[]) => {
		console.log('domain, ', domain);
		console.log('domain, ', domain);
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
		console.log('min and max: ', minX, maxX, minY, maxY);
		return {minX, maxX, minY, maxY};
	};

	xScale = () => {
		return scaleLinear()
			.domain([this.minAndMax().minX, this.minAndMax().maxX])
			.range([0, this.width]);
	};

	yScale = () => scaleLinear()
		.domain([this.minAndMax().minY, this.minAndMax().maxY])
		.range([this.height, 0]);

	render() {
		return <>
			<svg width={this.w} height={this.h} style={{float: 'left'}}>
				<g transform={`translate(${this.margin.left},${this.margin.top})`}>
					<AxisLeft yScale={this.yScale()} width={this.width}/>
					<AxisBottom xScale={this.xScale()} height={this.height}/>
					{this.props.data.map(_data => this.lines(_data.color, _data.data))}
					{this.props.data.map(_data => this.circles(_data.data, _data.color))}
				</g>
			</svg>
		</>;
	}

}


export default Example_LineGraph;