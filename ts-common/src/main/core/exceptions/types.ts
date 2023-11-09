
export type ResponseError<K extends string = string, Data extends any = any> = {
	type: K
	data: Data
}

export type ApiError_GeneralErrorMessage = ResponseError<'error-message', { message: string }>
export type ApiErrorResponse<E extends ResponseError> = {
	debugMessage?: string
	error?: E
}