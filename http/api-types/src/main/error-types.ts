/*
 * @nu-art/api-types - Shared API and error types for HTTP client and server
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

/**
 * Generic response error type for API error handling.
 */
export type ResponseError<K extends string = string, Data = any> = {
	type: K;
	data: Data;
};

/**
 * Standard error message response type.
 */
export type ApiError_GeneralErrorMessage = ResponseError<'error-message', { message: string }>;

/**
 * API error response structure.
 */
export type ApiErrorResponse<E extends ResponseError> = {
	debugMessage?: string;
	error?: E;
};
