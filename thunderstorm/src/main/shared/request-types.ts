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

export class HttpException
	extends Error {

	responseCode: number;
	errorResponse: any;

	constructor(responseCode: number, url: string, errorResponse?: any) {
		super(`${responseCode} - ${url}`);

		this.responseCode = responseCode;
		this.errorResponse = errorResponse;
	}
}

export type TS_Progress = {
	readonly lengthComputable: boolean;
	readonly loaded: number;
	readonly target: any;
	readonly total: number;
}

export interface OnRequestListener {
	__onRequestCompleted: (key: string, success: boolean, requestData?: any) => void;
}
