import * as React from "react";
import {ReactNode} from "react";
import {BaseComponent} from "@nu-art/thunderstorm/app-frontend/core/BaseComponent";
import {scaleLinear} from "d3-scale";
import AxisX from "./Example_AxisX";
import AxisBottom from "./Example_AxisBottom.";

export type Coordinates = {
	x: number,
	y: number
}

export type D3ChartData = {
	label: string | number | ReactNode,
	data: Coordinates[],
	color: string
}

type baseValue = {
	y: number
}

export type AxesLabels = {
	x: string[],
	y: string[]
}

export type Props = {
	data: D3ChartData[],
	axesLabels?: AxesLabels,
	baseValue?: baseValue
}

export class Example_LineGraph
	extends BaseComponent<Props, { x?: number, y?: number }> {

	constructor(props: Props) {
		super(props);
		this.state = {x: undefined, y: undefined}
	}

	updateLegend = (x: number, y: number) => {
		this.setState({x, y});
	};

	private minAndMax = () => {
		let arrayOfProps: Coordinates[] = [];
		this.props.data.map(_lineData => {
			arrayOfProps = arrayOfProps.concat([], _lineData.data);
		});
		return this.extent(arrayOfProps);
	};

	private circles = (data: Coordinates[], color: string) => data.map((d, i) => (
		<circle onMouseEnter={(e) => {
			this.updateLegend(d.x, d.y);
		}}
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
				lineArray.push(<line key={i} x1={this.xScale()(data[i].x)} x2={this.xScale()(data[i + 1].x)} y1={this.yScale()(data[i].y)}
				                     y2={this.yScale()(data[i + 1].y)}
				                     strokeWidth={3} stroke={color}/>);
			}
		return lineArray;
	};

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

	extent = (domain: Coordinates[]) => {
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
					<AxisX yScale={this.yScale()} width={this.width}/>
					<AxisBottom xScale={this.xScale()} height={this.height}/>
					{this.props.data.map(_data => this.lines(_data.color, _data.data))}
					{this.props.data.map(_data => this.circles(_data.data, _data.color))}
					{this.props.baseValue && this.lines('gray', [{x: this.minAndMax().minX, y: this.props.baseValue.y}])}
				</g>
			</svg>
			<div style={{fontSize: 12}}>
				{`mouse is hovering over x: ${this.state.x ? this.state.x : 'null'}, ${this.state.y ? this.state.y : 'null'}`}
			</div>
		</>;
	}

}


export default Example_LineGraph;