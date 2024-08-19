import {ApiException} from './exceptions';
import {ApiError_GeneralErrorMessage} from './types';


function createGeneralError(code: number) {
	const errorFunction = (userMessage: string, debugMessage: string = userMessage, cause?: Error) =>
		new ApiException<ApiError_GeneralErrorMessage>(code, debugMessage, cause).setErrorBody({
			type: 'error-message',
			data: {message: userMessage}
		});
	return Object.assign(errorFunction, {code});
}

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
		BAD_REQUEST: createGeneralError(400),
		UNAUTHORIZED: createGeneralError(401),
		PAYMENT_REQUIRED: createGeneralError(402),
		FORBIDDEN: createGeneralError(403),
		NOT_FOUND: createGeneralError(404),
		METHOD_NOT_ALLOWED: createGeneralError(405),
		NOT_ACCEPTABLE: createGeneralError(406),
		PROXY_AUTHENTICATION_REQUIRED: createGeneralError(407),
		REQUEST_TIMEOUT: createGeneralError(408),
		CONFLICT: createGeneralError(409),
		GONE: createGeneralError(410),
		LENGTH_REQUIRED: createGeneralError(411),
		PRECONDITION_FAILED: createGeneralError(412),
		PAYLOAD_TOO_LARGE: createGeneralError(413),
		URI_TOO_LONG: createGeneralError(414),
		UNSUPPORTED_MEDIA_TYPE: createGeneralError(415),
		RANGE_NOT_SATISFIABLE: createGeneralError(416),
		EXPECTATION_FAILED: createGeneralError(417),
		IM_A_TEAPOT: createGeneralError(418),
		FAILED_VALIDATION: createGeneralError(420),
		MISDIRECTED_REQUEST: createGeneralError(421),
		UNPROCESSABLE_ENTITY: createGeneralError(422),
		LOCKED: createGeneralError(423),
		FAILED_DEPENDENCY: createGeneralError(424),
		TOO_EARLY: createGeneralError(425),
		UPGRADE_REQUIRED: createGeneralError(426),
		PRECONDITION_REQUIRED: createGeneralError(428),
		TOO_MANY_REQUESTS: createGeneralError(429),
		REQUEST_HEADER_FIELDS_TOO_LARGE: createGeneralError(431),
		UNAVAILABLE_FOR_LEGAL_REASONS: createGeneralError(451),

		//custom
		ENTITY_MISSING: createGeneralError(459),
		ENTITY_ALREADY_EXISTS: createGeneralError(460),
		ENTITY_IS_OUTDATED: createGeneralError(461),
		INTERNAL_MISMATCH: createGeneralError(462),
		OPERATION_FAILED: createGeneralError(490),
	},
	_5XX: {
		INTERNAL_SERVER_ERROR: createGeneralError(500),
		NOT_IMPLEMENTED: createGeneralError(501),
		BAD_GATEWAY: createGeneralError(502),
		SERVICE_UNAVAILABLE: createGeneralError(503),
		GATEWAY_TIMEOUT: createGeneralError(504),
		HTTP_VERSION_NOT_SUPPORTED: createGeneralError(505),
		VARIANT_ALSO_NEGOTIATES: createGeneralError(506),
		INSUFFICIENT_STORAGE: createGeneralError(507),
		LOOP_DETECTED: createGeneralError(508),
		NOT_EXTENDED: createGeneralError(510),
		NETWORK_AUTHENTICATION_REQUIRED: createGeneralError(511),

		//custom
		DEBUG_WHO_CALLED_THIS: 555,
		BAD_IMPLEMENTATION: 560,
		IMPLEMENTATION_MISSING: 561,
		SHOULD_NOT_HAPPENED: 598,
		MUST_NEVER_HAPPENED: 599,

	},
} as const;
