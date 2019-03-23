/*
 * A typescript & react boilerplate with api call example
 *
 * Copyright (C) 2018  Adam van der Kruk aka TacB0sS
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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