/*
 * Thunderstorm is a full web app framework!
 *
 * Typescript & Express backend infrastructure that natively runs on firebase function
 * Typescript & React frontend infrastructure
 *
 * Copyright (C) 2020 Adam van der Kruk aka TacB0sS
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

import * as _request from "request";
import {Response} from "request";
import {ApiException} from "../exceptions";
import {__stringify} from "@nu-art/ts-common";
import {RequestOptions} from "../../backend";

export async function promisifyRequest(request: RequestOptions, throwException: boolean = true): Promise<Response> {
	return new Promise<Response>((resolve, rejected) => {
		_request(request, (error, response: Response) => {
			if (error)
				return rejected(new ApiException(503, `Error: ${error}\n Request: ${__stringify(request, true)}`));

			if (throwException && response.statusCode !== 200)
				return rejected(new ApiException(response.statusCode, `Redirect proxy message, ${__stringify(response.body)} \n${__stringify(request, true)}`));

			resolve(response);
		});
	});
}