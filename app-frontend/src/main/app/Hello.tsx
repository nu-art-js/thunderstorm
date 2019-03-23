import * as React from "react";
import {getModule} from "@nu-art/core";
import {HttpMethod, HttpModule} from "@nu-art/fronzy";

export class Hello
	extends React.Component<{}, { label: string }> {
	constructor(props: any) {
		super(props);
		this.state = {
			label: "Hello World"
		};
		this.getTextFromServer = this.getTextFromServer.bind(this);
	}

	render() {
		return <h1 onClick={this.getTextFromServer}>{this.state.label}</h1>;
	}

	private async getTextFromServer() {
		const httpRequest = await (getModule(HttpModule) as HttpModule).createRequest(HttpMethod.GET).setRelativeUrl("/api/v1/sample/endpoint-example").execute();
		this.setState({
			label: httpRequest.xhr.status != 200 ? `got error: ${httpRequest.xhr.status}` : httpRequest.xhr.response
		})
	}
}