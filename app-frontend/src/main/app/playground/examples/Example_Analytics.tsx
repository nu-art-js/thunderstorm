import * as React from 'react';
import {AnalyticsModule} from "@nu-art/analytics/app-frontend/modules/AnalyticsModule";

export class Example_Analytics extends React.Component {

	render() {
		return <div onClick={this.addEvent} style={{border: "solid 1px gray", padding: 10}}>
			Click to add event
		</div>;
	}

	addEvent = () => {
		AnalyticsModule.logEvent("test")
		console.log("event added")
	}

}