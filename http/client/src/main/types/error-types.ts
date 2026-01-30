/*
 * @nu-art/http-client - Type-safe HTTP client for Thunderstorm
 * Copyright (C) 2024 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

export type {
	ResponseError,
	ApiError_GeneralErrorMessage,
	ApiErrorResponse
} from '@nu-art/api-types';

/**
 * Progress event type for upload/download tracking.
 */
export type TS_Progress = {
	readonly lengthComputable: boolean;
	readonly loaded: number;
	readonly target: any;
	readonly total: number;
};
