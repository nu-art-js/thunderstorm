import * as React from "react";
import {BaseComponent} from "@nu-art/thunderstorm/app-frontend/core/BaseComponent";
import {Line} from 'react-chartjs-2';

export class Example_ChartJSLine
	extends BaseComponent {

	private data = {
		labels: ["January", "February", "March", "April", "May", "June", "July"],
		datasets: [{
			label: "My First dataset",
			backgroundColor: 'rgb(255, 99, 132)',
			fill: false,
			lineTension: 0,
			borderColor: 'rgb(255, 99, 132)',
			data: [0, 10, 5, 2, 20, 30, 45],
		},
			{
				label: "My Second dataset",
				backgroundColor: 'lightpink',
				fill: false,
				lineTension: 0,
				borderColor: 'lightpink',
				data: [0, 5, 10, 4, 10, 30, 45],
			}]
	};


	render() {
		return <Line data={this.data}/>;
	}
}

export default Example_ChartJSLine;