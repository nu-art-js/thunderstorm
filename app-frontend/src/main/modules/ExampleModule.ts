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

import {
	HttpMethod,
	Module
} from "@nu-art/ts-common";

import {HttpModule} from "@nu-art/thunder";
import {
	CommonBodyReq,
	ExampleApiGetType,
	ExampleApiPostType
} from "@shared/shared";

type Config = {
	remoteUrl: string
}

export const RequestKey_PostApi = "PostApi";
export const RequestKey_GetApi = "GetApi";

export class ExampleModule_Class
	extends Module<Config> {
	private message!: string;

	public getMessageFromServer() {
		this.logInfo("getting label from server");
		const bodyObject: CommonBodyReq = {message: this.message || "No message"};

		HttpModule.createRequest<ExampleApiPostType>(HttpMethod.POST, RequestKey_PostApi)
		          .setJsonBody(bodyObject)
		          .setRelativeUrl("/v1/sample/another-endpoint")
		          .setOnError(`Error getting new message from backend`)
		          .setOnSuccessMessage(`Success`)
		          .execute(this.setMessage);

		HttpModule.createRequest<ExampleApiGetType>(HttpMethod.GET, RequestKey_GetApi)
		          .setRelativeUrl(this.config.remoteUrl)
		          .setOnError(`Error getting new message from backend`)
		          .execute(response => this.message = response);

		this.logInfo("continue... will receive an event once request is completed..");
	}

	setMessage = (message: string) => {
		this.logInfo(`got message: ${message}`);
		this.message = message;
	};

	getMessage = () => this.message;
}

export const ExampleModule = new ExampleModule_Class();