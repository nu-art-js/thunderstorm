/*
 * @nu-art/thunderstorm-http - A robust and type-safe HTTP client for Thunderstorm applications
 * Copyright (C) 2024 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

/**
 * Generic response error type for API error handling.
 *
 * @template K - Error type identifier (string literal)
 * @template Data - Error data payload
 */
export type ResponseError<K extends string = string, Data = any> = {
	/** Error type identifier */
	type: K
	/** Error data payload */
	data: Data
}

/**
 * Standard error message response type.
 *
 * Used for general error messages in API responses.
 */
export type ApiError_GeneralErrorMessage = ResponseError<'error-message', { message: string }>

/**
 * API error response structure.
 *
 * Contains an optional debug message (for developers) and an optional
 * structured error object (for clients).
 *
 * @template E - Response error type
 */
export type ApiErrorResponse<E extends ResponseError> = {
	/** Optional debug message (typically includes stack traces, internal details) */
	debugMessage?: string
	/** Optional structured error object */
	error?: E
}

/**
 * Progress event type for upload/download tracking.
 * 
 * Mirrors the ProgressEvent interface for compatibility with XMLHttpRequest
 * and fetch progress events.
 */
export type TS_Progress = {
	readonly lengthComputable: boolean;
	readonly loaded: number;
	readonly target: any;
	readonly total: number;
}
