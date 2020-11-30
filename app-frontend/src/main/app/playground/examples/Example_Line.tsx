import * as React from "react";
import {BaseComponent} from "@nu-art/thunderstorm/app-frontend/core/BaseComponent";
import {scaleLinear} from "d3-scale";
import AxisLeft from "./d3components/Example_AxisLeft";
import AxisBottom from "./d3components/Example_AxisBottom.";
import {TS_Input} from "@nu-art/thunderstorm/app-frontend/components/TS_Input";
import {
	ChartDataSets
} from "chart.js";
import {
	ChartData,
	Line
} from "react-chartjs-2";

export type Coordinates = {
	x: number,
	y: number
}
type baseValue = {
	y: number
}
export type Props = {
	baseValue?: baseValue[]
}

export class Example_Line
	extends BaseComponent<Props, { data1: Coordinates[], data2: Coordinates[], chartJSdata: ChartDataSets[] }> {

	constructor(props: Props) {
		super(props);
		this.state = {
			data1: [{x: 5, y: 5}],
			data2: [{x: 5, y: 5}],
			chartJSdata: [{
				label: "line 1",
				backgroundColor: 'rgb(255, 99, 132)',
				fill: false,
				lineTension: 0,
				borderColor: 'rgb(255, 99, 132)',
				data: [5],
			},
				{
					label: "line 2",
					backgroundColor: 'rgb(255, 99, 132)',
					fill: false,
					lineTension: 0,
					borderColor: 'lightpink',
					data: [5],
				}]
		};
	}

	private minAndMax = () => this.extent(this.state.data1.concat(this.state.data2));

	private circles = (data: Coordinates[], color: string) => data.map((d, i) => (
		<circle
			key={i}
			r={2}
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
				                     strokeWidth={5} stroke={color}/>);
			}
		return lineArray;
	};

	w = 600;
	h = 600;
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

	private x = 0;
	private y = 0;
	private x2 = 0;
	private y2 = 0;

	xScale = () => {
		return scaleLinear()
			.domain([this.minAndMax().minX, this.minAndMax().maxX])
			.range([0, this.width]);
	};

	yScale = () => scaleLinear()
		.domain([this.minAndMax().minY, this.minAndMax().maxY])
		.range([this.height, 0]);

	updateData1 = (newData: Coordinates) => {
		this.setState((state) => {
			state.data1.push(newData);
			const line1 = this.state.chartJSdata.find(_dataset => _dataset.label === 'line 1');
			line1 &&	line1.data?.push(newData.y);
			return (state);
		});
	};
	updateData2 = (newData: Coordinates) => {
		this.setState((state) => {
			state.data2.push(newData);
			const line2 = this.state.chartJSdata.find(_dataset => _dataset.label === 'line 2');
			line2 &&	line2.data?.push(newData.y);
			return (state);
		});
	};

	buildData = () : ChartData<any> => {
		return {
			labels: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
			datasets: [this.state.chartJSdata.find(_dataset => _dataset.label === 'line 1') || [],
			           this.state.chartJSdata.find(_dataset => _dataset.label === 'line 2') || []]
		};
	};

	render() {
		return <div>
			<TS_Input onChange={(x) => this.x = parseInt(x)} type='text' id={'x'} placeholder={'type x value'}/>
			<TS_Input onChange={(y) => this.y = parseInt(y)} type='text' id={'y'} placeholder={'type y value'}/>
			<button onClick={() => this.updateData1({x: this.x, y: this.y})}>plot</button>
			<br/>
			<TS_Input onChange={(x2) => this.x2 = parseInt(x2)} type='text' id={'x2'} placeholder={'type x2 value'}/>
			<TS_Input onChange={(y2) => this.y2 = parseInt(y2)} type='text' id={'y2'} placeholder={'type y2 value'}/>
			<button onClick={() => this.updateData2({x: this.x2, y: this.y2})}>plot</button>
			<Line data={this.buildData()} redraw={true}/>
			<div style={{width: '100%'}}>
				<div style={{float: 'left', width: '50%'}}>
					<svg width={this.w} height={this.h} style={{float: 'left'}}>
						<g transform={`translate(${this.margin.left},${this.margin.top})`}>
							<AxisLeft yScale={this.yScale()} width={this.width}/>
							<AxisBottom xScale={this.xScale()} height={this.height}/>
							{this.circles(this.state.data1, 'lightblue')}
							{this.lines('lightblue', this.state.data1)}
							{this.circles(this.state.data2, 'lightpink')}
							{this.lines('lightpink', this.state.data2)}
						</g>
					</svg>
				</div>
			</div>

		</div>;
	}

}


export default Example_Line;