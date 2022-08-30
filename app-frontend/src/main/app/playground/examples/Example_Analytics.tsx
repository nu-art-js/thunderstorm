import {ModuleFE_Toaster} from '@nu-art/thunderstorm/frontend';
import * as React from 'react';

export class Example_Analytics_Render
	extends React.Component {

	render() {
		return <div onClick={this.addEvent} style={{border: 'solid 1px gray', padding: 10}}>
			Click to add event
		</div>;
	}
	addEvent = () => {
		ModuleFE_Toaster.toastInfo('No Analytics set up yet');
	};
}

export const Example_Analytics = {renderer: Example_Analytics_Render, name: 'Analytics'};