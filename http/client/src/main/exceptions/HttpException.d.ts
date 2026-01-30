import { CustomException } from '@nu-art/ts-common';
import type { HttpRequest } from '../core/HttpRequest.js';
import type { ApiErrorResponse, ResponseError } from '../types/error-types.js';
/**
 * HTTP exception containing error details and the original request.
 *
 * @template E - Response error type
 */
export declare class HttpException<E extends ResponseError = ResponseError> extends CustomException {
    responseCode: number;
    errorResponse?: ApiErrorResponse<E>;
    request: HttpRequest<any>;
    constructor(responseCode: number, request: HttpRequest<any>, errorResponse?: ApiErrorResponse<E>);
}
export { ApiException } from '@nu-art/api-types';
