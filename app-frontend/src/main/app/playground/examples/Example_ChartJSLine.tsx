import * as React from "react";
import {BaseComponent} from "@nu-art/thunderstorm/app-frontend/core/BaseComponent";
import {Line} from 'react-chartjs-2';

export class Example_ChartJSLine
	extends BaseComponent {

	private data = {
		labels: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
		datasets: [{
			label: "diastolic",
			backgroundColor: 'rgb(255, 99, 132)',
			fill: false,
			lineTension: 0,
			borderColor: 'rgb(255, 99, 132)',
			data: [78, 73, 69, 90, 65],
		},
			{
				label: "systolic",
				backgroundColor: 'lightpink',
				fill: false,
				lineTension: 0,
				borderColor: 'lightpink',
				data: [115, 105, 120, 145]
			}]
	};

	private options = {
		scales: {
			yAxes: [{
				ticks: {
					min: 0
				}
			}],
			xAxes: [{
				ticks: {
					padding: 50
				}
			}]
		}
	}

	pulse = () => {
		return <div>

		</div>
	}

	render() {
		return <div style={{width: '50%'}}>
			<Line data={this.data} options={this.options}/>
		</div> ;
	}
}

export default Example_ChartJSLine;