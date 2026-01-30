/*
 * @nu-art/http-client - Type-safe HTTP client for Thunderstorm
 * Copyright (C) 2024 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {CustomException} from '@nu-art/ts-common';
import type {HttpRequest} from '../core/HttpRequest.js';
import type {ApiErrorResponse, ResponseError} from '../types/error-types.js';

/**
 * HTTP exception containing error details and the original request.
 *
 * @template E - Response error type
 */
export class HttpException<E extends ResponseError = ResponseError>
	extends CustomException {

	responseCode: number;
	errorResponse?: ApiErrorResponse<E>;
	request: HttpRequest<any>;

	constructor(responseCode: number, request: HttpRequest<any>, errorResponse?: ApiErrorResponse<E>) {
		const url = request.getUrl();
		super(HttpException, `${responseCode} - ${url}`);

		this.responseCode = responseCode;
		this.errorResponse = errorResponse;
		this.request = request;
	}
}

export {ApiException} from '@nu-art/api-types';
