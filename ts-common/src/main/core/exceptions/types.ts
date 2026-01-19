
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