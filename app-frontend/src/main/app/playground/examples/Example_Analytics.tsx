import * as React from 'react';

export class Example_Analytics extends React.Component {

	render() {
		return <div onClick={this.addEvent} style={{border: "solid 1px gray", padding: 10}}>
			Click to add event
		</div>;
	}

	addEvent = () => {
		console.log("adding event...")
	}

}