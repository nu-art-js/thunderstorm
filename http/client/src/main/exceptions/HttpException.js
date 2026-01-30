/*
 * @nu-art/http-client - Type-safe HTTP client for Thunderstorm
 * Copyright (C) 2024 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */
import { CustomException } from '@nu-art/ts-common';
/**
 * HTTP exception containing error details and the original request.
 *
 * @template E - Response error type
 */
export class HttpException extends CustomException {
    responseCode;
    errorResponse;
    request;
    constructor(responseCode, request, errorResponse) {
        const url = request.getUrl();
        super(HttpException, `${responseCode} - ${url}`);
        this.responseCode = responseCode;
        this.errorResponse = errorResponse;
        this.request = request;
    }
}
export { ApiException } from '@nu-art/api-types';
//# sourceMappingURL=HttpException.js.map