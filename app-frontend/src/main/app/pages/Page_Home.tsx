import * as React from "react";
import {Hello} from "../Hello";


export class Page_Home
	extends React.Component {
	constructor(props: {}) {
		super(props);

		this.state = {
			formFields: {},
		};
	}

	render() {
		return <Hello/>;
	}
}