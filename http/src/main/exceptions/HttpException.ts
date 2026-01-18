/*
 * @nu-art/http-client - Type-safe HTTP client for Thunderstorm
 * Copyright (C) 2024 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {_logger_logException, CustomException} from '@nu-art/ts-common';
import type {HttpRequest} from '../core/HttpRequest.js';
import type {ApiError_GeneralErrorMessage, ApiErrorResponse, ResponseError} from '../types/error-types.js';

/**
 * HTTP exception containing error details and the original request.
 *
 * Provides complete context for error handling including the request that failed,
 * allowing error handlers to retry, inspect request details, or perform recovery operations.
 *
 * @template E - Response error type
 */
export class HttpException<E extends ResponseError = ResponseError>
	extends CustomException {

	/** HTTP status code */
	responseCode: number;
	/** Error response from server (if available) */
	errorResponse?: ApiErrorResponse<E>;
	/** The HTTP request that failed - provides access to method, headers, URL, body, params, etc. */
	request: HttpRequest<any>;

	constructor(responseCode: number, request: HttpRequest<any>, errorResponse?: ApiErrorResponse<E>) {
		const url = request.getUrl();
		super(HttpException, `${responseCode} - ${url}`);

		this.responseCode = responseCode;
		this.errorResponse = errorResponse;
		this.request = request;
	}
}


/**
 * Exception class for API errors with HTTP response codes and structured error bodies.
 *
 * Used for errors that need to be returned to API clients with:
 * - HTTP status code
 * - Structured error response body
 * - Debug message for server-side logging
 *
 * The constructor accepts `causeOrMessage` as either a string (message) or Error (cause),
 * allowing flexible error construction. If both `causeOrMessage` (as Error) and `cause`
 * are provided, `causeOrMessage` takes precedence.
 *
 * @template Err - Type of the error body (must extend ResponseError)
 *
 * @category Exceptions
 *
 * @example
 * ```typescript
 * // With message string
 * throw new ApiException(404, 'Resource not found');
 *
 * // With cause Error
 * throw new ApiException(500, originalError);
 *
 * // With both message and cause
 * throw new ApiException(400, 'Invalid input', validationError);
 * ```
 */
export class ApiException<Err extends ResponseError = ApiError_GeneralErrorMessage>
	extends CustomException {

	/** Structured error response body for API clients */
	public readonly responseBody: ApiErrorResponse<Err> = {};
	/** HTTP status code for the error response */
	public readonly responseCode: number;

	/**
	 * Sets the error body and returns this instance for method chaining.
	 *
	 * @param errorBody - Error body object to include in the response
	 * @returns This instance for chaining
	 */
	public readonly setErrorBody = (errorBody: Err) => {
		this.responseBody.error = errorBody;
		return this;
	};

	/**
	 * Creates a new ApiException.
	 *
	 * @param responseCode - HTTP status code (e.g., 404, 500)
	 * @param causeOrMessage - Either a message string or an Error object (as cause)
	 * @param cause - Optional additional cause Error (only used if causeOrMessage is a string)
	 */
	constructor(responseCode: number, causeOrMessage?: string | Error, cause?: Error) {
		super(ApiException, `${responseCode}${ApiException.getMessage(causeOrMessage)}`, ApiException.getCause(causeOrMessage, cause));

		this.responseCode = responseCode;
		this.responseBody.debugMessage = _logger_logException(this);
	}

	/**
	 * Extracts message string from causeOrMessage if it's a string.
	 */
	private static getMessage(causeOrMessage?: string | Error) {
		return typeof causeOrMessage === 'string' ? `-${JSON.stringify(causeOrMessage)}` : '';
	}

	/**
	 * Extracts cause Error from parameters.
	 * If causeOrMessage is an Error, it's used as the cause.
	 * Otherwise, the cause parameter is used.
	 */
	private static getCause(causeOrMessage?: string | Error, cause?: Error) {
		return typeof causeOrMessage != 'string' ? causeOrMessage : cause;
	}
}
