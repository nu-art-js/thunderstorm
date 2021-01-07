import * as React from "react";
import {BaseComponent} from "@intuitionrobotics/thunderstorm/app-frontend/core/BaseComponent";
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
					padding: 35
				}
			}]
		}
	};

	pulseData = [92, 102, 94, 92];

	pulse = () => {
		let left = 5
		return this.pulseData.map(_pulse => {
			const element =  <div style={{height: '9%', width: '15.3%', backgroundColor: 'white', border: 'solid 1px', borderColor: 'gray', position: 'absolute', top: '81%', left: `${left}%`}}>
				<div style={{position: 'relative', fontSize: 14, textAlign: 'center', marginTop: '5px', color: 'rgb(255, 99, 132)'}}>
					{_pulse}
				</div>
			</div>;
			left += 15.3
			return element
		});
	};

	render() {
		return <div style={{width: '50%', position: 'relative'}}>
			<Line data={this.data} options={this.options}/>
			{this.pulse()}
		</div>;
	}
}

export default Example_ChartJSLine;