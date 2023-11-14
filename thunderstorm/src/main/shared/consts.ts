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

export const HeaderKey_Env = 'x-env';
export const HeaderKey_CurrentPage = 'x-current-page';

export type Browser = 'chrome';//| "firefox" | "blink" | "edge" | "ie" | "safari" | "opera"

export const DefaultHttpServerConfig = {
	'bodyParserLimit': 200,
	'cors': {
		'headers': [
			'x-session-id',
			'x-browser-type',
			'x-app-version'
		],
		'methods': [
			'GET',
			'POST'
		],
		'responseHeaders': [
			'x-session-id'
		]
	},
	'host': 'localhost'
};

export const HttpCodes = {
	_1XX: {
		CONTINUE: 100,
		SWITCHING_PROTOCOLS: 101,
		PROCESSING: 102,
		EARLY_HINTS: 103,
	},
	_2XX: {
		OK: 200,
		CREATED: 201,
		ACCEPTED: 202,
		NON_AUTHORITATIVE_INFORMATION: 203,
		NO_CONTENT: 204,
		RESET_CONTENT: 205,
		PARTIAL_CONTENT: 206,
		MULTI_STATUS: 207,
		ALREADY_REPORTED: 208,
		IM_USED: 226,
	},
	_3XX: {
		MULTIPLE_CHOICES: 300,
		MOVED_PERMANENTLY: 301,
		FOUND: 302,
		SEE_OTHER: 303,
		NOT_MODIFIED: 304,
		USE_PROXY: 305,
		TEMPORARY_REDIRECT: 307,
		PERMANENT_REDIRECT: 308,
	},
	_4XX: {
		BAD_REQUEST: 400,
		UNAUTHORIZED: 401,
		PAYMENT_REQUIRED: 402,
		FORBIDDEN: 403,
		NOT_FOUND: 404,
		METHOD_NOT_ALLOWED: 405,
		NOT_ACCEPTABLE: 406,
		PROXY_AUTHENTICATION_REQUIRED: 407,
		REQUEST_TIMEOUT: 408,
		CONFLICT: 409,
		GONE: 410,
		LENGTH_REQUIRED: 411,
		PRECONDITION_FAILED: 412,
		PAYLOAD_TOO_LARGE: 413,
		URI_TOO_LONG: 414,
		UNSUPPORTED_MEDIA_TYPE: 415,
		RANGE_NOT_SATISFIABLE: 416,
		EXPECTATION_FAILED: 417,
		IM_A_TEAPOT: 418,
		MISDIRECTED_REQUEST: 421,
		UNPROCESSABLE_ENTITY: 422,
		LOCKED: 423,
		FAILED_DEPENDENCY: 424,
		TOO_EARLY: 425,
		UPGRADE_REQUIRED: 426,
		PRECONDITION_REQUIRED: 428,
		TOO_MANY_REQUESTS: 429,
		REQUEST_HEADER_FIELDS_TOO_LARGE: 431,
		UNAVAILABLE_FOR_LEGAL_REASONS: 451,

		//custom
		ENTITY_ALREADY_EXISTS: 460,
		OPERATION_FAILED: 461,
	},
	_5XX: {
		INTERNAL_SERVER_ERROR: 500,
		NOT_IMPLEMENTED: 501,
		BAD_GATEWAY: 502,
		SERVICE_UNAVAILABLE: 503,
		GATEWAY_TIMEOUT: 504,
		HTTP_VERSION_NOT_SUPPORTED: 505,
		VARIANT_ALSO_NEGOTIATES: 506,
		INSUFFICIENT_STORAGE: 507,
		LOOP_DETECTED: 508,
		NOT_EXTENDED: 510,
		NETWORK_AUTHENTICATION_REQUIRED: 511,

		//custom
		DEBUG_WHO_CALLED_THIS: 555,
		BAD_IMPLEMENTATION: 560,
		IMPLEMENTATION_MISSION: 561,
		SHOULD_NOT_HAPPENED: 598,
		MUST_NEVER_HAPPENED: 599,

	},
} as const;
