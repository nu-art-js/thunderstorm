import * as React from 'react';
import {InfoToast} from "../../themes/toaster";

export class Example_Analytics
	extends React.Component {

	render() {
		return <div onClick={this.addEvent} style={{border: "solid 1px gray", padding: 10}}>
			Click to add event
		</div>;
	}

	addEvent = () => {
		InfoToast('No Analytics set up yet');
	};

}