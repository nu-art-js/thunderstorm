import * as React from "react";
import {BaseComponent} from "@nu-art/thunderstorm/app-frontend/core/BaseComponent";
import {TS_Input} from "@nu-art/thunderstorm/app-frontend/components/TS_Input";
import {ChartDataSets} from "chart.js";
import {
	ChartData,
	Line
} from "react-chartjs-2";
import Example_LineGraph, {LineData} from "./d3components/Example_LineGraph";

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
	extends BaseComponent<Props, { data: LineData[], chartJSdata: ChartDataSets[] }> {

	constructor(props: Props) {
		super(props);
		this.state = {
			data: [{
				label: 'line 1',
				data: [{x: 5, y: 5}],
				color: 'rgb(255, 99, 132)'
			}, {
				label: 'line 2',
				data: [{x: 5, y: 5}],
				color: 'lightpink'
			}],
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

	private x = 0;
	private y = 0;
	private x2 = 0;
	private y2 = 0

	updateData = (newData: Coordinates, label: string) => {
		this.setState((state) => {
			const chartJSline = this.state.chartJSdata.find(_dataset => _dataset.label === label);
			chartJSline && chartJSline.data?.push(newData.y);
			const d3line = this.state.data.find(_data => _data.label === label)
			d3line && d3line.data.push(newData)
			return (state);
		});
	};


	buildChartJSData = (): ChartData<any> => {
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
			<button onClick={() => this.updateData({x: this.x, y: this.y}, 'line 1')}>plot</button>
			<br/>
			<TS_Input onChange={(x2) => this.x2 = parseInt(x2)} type='text' id={'x2'} placeholder={'type x2 value'}/>
			<TS_Input onChange={(y2) => this.y2 = parseInt(y2)} type='text' id={'y2'} placeholder={'type y2 value'}/>
			<button onClick={() => this.updateData({x: this.x2, y: this.y2}, 'line 2')}>plot</button>
			<div style={{width: '100%'}}>
				<div style={{float: 'left', width: '50%'}}>
				<Example_LineGraph data={this.state.data}/>
				</div>
				<div style={{float: 'left', width: '50%'}}>
					<Line data={this.buildChartJSData()} redraw={true}/>
				</div>
			</div>
		</div>;
	}

}


export default Example_Line;