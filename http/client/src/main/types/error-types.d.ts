export type { ResponseError, ApiError_GeneralErrorMessage, ApiErrorResponse } from '@nu-art/api-types';
/**
 * Progress event type for upload/download tracking.
 */
export type TS_Progress = {
    readonly lengthComputable: boolean;
    readonly loaded: number;
    readonly target: any;
    readonly total: number;
};
