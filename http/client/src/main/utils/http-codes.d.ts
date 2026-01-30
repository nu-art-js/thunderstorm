/**
 * HTTP status code constants organized by status class.
 *
 * Provides:
 * - Standard HTTP status codes (1XX, 2XX, 3XX, 4XX, 5XX)
 * - Custom status codes (459-463, 490, 555, 560-561, 598-599)
 * - Factory functions for 4XX and 5XX errors that create ApiException instances
 *
 * **Usage**:
 * - For errors: `throw HttpCodes._4XX.NOT_FOUND('User not found', 'User ID: 123')`
 * - For status codes: `HttpCodes._2XX.OK` (returns 200)
 *
 * **Note**: 4XX and 5XX codes are functions that create exceptions, while
 * 1XX, 2XX, and 3XX are just numeric constants.
 */
export declare const HttpCodes: {
    readonly _1XX: {
        readonly CONTINUE: 100;
        readonly SWITCHING_PROTOCOLS: 101;
        readonly PROCESSING: 102;
        readonly EARLY_HINTS: 103;
    };
    readonly _2XX: {
        readonly OK: 200;
        readonly CREATED: 201;
        readonly ACCEPTED: 202;
        readonly NON_AUTHORITATIVE_INFORMATION: 203;
        readonly NO_CONTENT: 204;
        readonly RESET_CONTENT: 205;
        readonly PARTIAL_CONTENT: 206;
        readonly MULTI_STATUS: 207;
        readonly ALREADY_REPORTED: 208;
        readonly IM_USED: 226;
    };
    readonly _3XX: {
        readonly MULTIPLE_CHOICES: 300;
        readonly MOVED_PERMANENTLY: 301;
        readonly FOUND: 302;
        readonly SEE_OTHER: 303;
        readonly NOT_MODIFIED: 304;
        readonly USE_PROXY: 305;
        readonly TEMPORARY_REDIRECT: 307;
        readonly PERMANENT_REDIRECT: 308;
    };
    readonly _4XX: {
        readonly BAD_REQUEST: ((userMessage: string, debugMessage?: string, cause?: Error) => any) & {
            code: number;
        };
        readonly UNAUTHORIZED: ((userMessage: string, debugMessage?: string, cause?: Error) => any) & {
            code: number;
        };
        readonly PAYMENT_REQUIRED: ((userMessage: string, debugMessage?: string, cause?: Error) => any) & {
            code: number;
        };
        readonly FORBIDDEN: ((userMessage: string, debugMessage?: string, cause?: Error) => any) & {
            code: number;
        };
        readonly NOT_FOUND: ((userMessage: string, debugMessage?: string, cause?: Error) => any) & {
            code: number;
        };
        readonly METHOD_NOT_ALLOWED: ((userMessage: string, debugMessage?: string, cause?: Error) => any) & {
            code: number;
        };
        readonly NOT_ACCEPTABLE: ((userMessage: string, debugMessage?: string, cause?: Error) => any) & {
            code: number;
        };
        readonly PROXY_AUTHENTICATION_REQUIRED: ((userMessage: string, debugMessage?: string, cause?: Error) => any) & {
            code: number;
        };
        readonly REQUEST_TIMEOUT: ((userMessage: string, debugMessage?: string, cause?: Error) => any) & {
            code: number;
        };
        readonly CONFLICT: ((userMessage: string, debugMessage?: string, cause?: Error) => any) & {
            code: number;
        };
        readonly GONE: ((userMessage: string, debugMessage?: string, cause?: Error) => any) & {
            code: number;
        };
        readonly LENGTH_REQUIRED: ((userMessage: string, debugMessage?: string, cause?: Error) => any) & {
            code: number;
        };
        readonly PRECONDITION_FAILED: ((userMessage: string, debugMessage?: string, cause?: Error) => any) & {
            code: number;
        };
        readonly PAYLOAD_TOO_LARGE: ((userMessage: string, debugMessage?: string, cause?: Error) => any) & {
            code: number;
        };
        readonly URI_TOO_LONG: ((userMessage: string, debugMessage?: string, cause?: Error) => any) & {
            code: number;
        };
        readonly UNSUPPORTED_MEDIA_TYPE: ((userMessage: string, debugMessage?: string, cause?: Error) => any) & {
            code: number;
        };
        readonly RANGE_NOT_SATISFIABLE: ((userMessage: string, debugMessage?: string, cause?: Error) => any) & {
            code: number;
        };
        readonly EXPECTATION_FAILED: ((userMessage: string, debugMessage?: string, cause?: Error) => any) & {
            code: number;
        };
        readonly IM_A_TEAPOT: ((userMessage: string, debugMessage?: string, cause?: Error) => any) & {
            code: number;
        };
        readonly FAILED_VALIDATION: ((userMessage: string, debugMessage?: string, cause?: Error) => any) & {
            code: number;
        };
        readonly MISDIRECTED_REQUEST: ((userMessage: string, debugMessage?: string, cause?: Error) => any) & {
            code: number;
        };
        readonly UNPROCESSABLE_ENTITY: ((userMessage: string, debugMessage?: string, cause?: Error) => any) & {
            code: number;
        };
        readonly LOCKED: ((userMessage: string, debugMessage?: string, cause?: Error) => any) & {
            code: number;
        };
        readonly FAILED_DEPENDENCY: ((userMessage: string, debugMessage?: string, cause?: Error) => any) & {
            code: number;
        };
        readonly TOO_EARLY: ((userMessage: string, debugMessage?: string, cause?: Error) => any) & {
            code: number;
        };
        readonly UPGRADE_REQUIRED: ((userMessage: string, debugMessage?: string, cause?: Error) => any) & {
            code: number;
        };
        readonly PRECONDITION_REQUIRED: ((userMessage: string, debugMessage?: string, cause?: Error) => any) & {
            code: number;
        };
        readonly TOO_MANY_REQUESTS: ((userMessage: string, debugMessage?: string, cause?: Error) => any) & {
            code: number;
        };
        readonly REQUEST_HEADER_FIELDS_TOO_LARGE: ((userMessage: string, debugMessage?: string, cause?: Error) => any) & {
            code: number;
        };
        readonly UNAVAILABLE_FOR_LEGAL_REASONS: ((userMessage: string, debugMessage?: string, cause?: Error) => any) & {
            code: number;
        };
        readonly ENTITY_MISSING: ((userMessage: string, debugMessage?: string, cause?: Error) => any) & {
            code: number;
        };
        readonly ENTITY_ALREADY_EXISTS: ((userMessage: string, debugMessage?: string, cause?: Error) => any) & {
            code: number;
        };
        readonly ENTITY_IS_OUTDATED: ((userMessage: string, debugMessage?: string, cause?: Error) => any) & {
            code: number;
        };
        readonly INTERNAL_MISMATCH: ((userMessage: string, debugMessage?: string, cause?: Error) => any) & {
            code: number;
        };
        readonly ENTITY_DOESNT_EXISTS: ((userMessage: string, debugMessage?: string, cause?: Error) => any) & {
            code: number;
        };
        readonly OPERATION_FAILED: ((userMessage: string, debugMessage?: string, cause?: Error) => any) & {
            code: number;
        };
    };
    readonly _5XX: {
        readonly INTERNAL_SERVER_ERROR: ((userMessage: string, debugMessage?: string, cause?: Error) => any) & {
            code: number;
        };
        readonly NOT_IMPLEMENTED: ((userMessage: string, debugMessage?: string, cause?: Error) => any) & {
            code: number;
        };
        readonly BAD_GATEWAY: ((userMessage: string, debugMessage?: string, cause?: Error) => any) & {
            code: number;
        };
        readonly SERVICE_UNAVAILABLE: ((userMessage: string, debugMessage?: string, cause?: Error) => any) & {
            code: number;
        };
        readonly GATEWAY_TIMEOUT: ((userMessage: string, debugMessage?: string, cause?: Error) => any) & {
            code: number;
        };
        readonly HTTP_VERSION_NOT_SUPPORTED: ((userMessage: string, debugMessage?: string, cause?: Error) => any) & {
            code: number;
        };
        readonly VARIANT_ALSO_NEGOTIATES: ((userMessage: string, debugMessage?: string, cause?: Error) => any) & {
            code: number;
        };
        readonly INSUFFICIENT_STORAGE: ((userMessage: string, debugMessage?: string, cause?: Error) => any) & {
            code: number;
        };
        readonly LOOP_DETECTED: ((userMessage: string, debugMessage?: string, cause?: Error) => any) & {
            code: number;
        };
        readonly NOT_EXTENDED: ((userMessage: string, debugMessage?: string, cause?: Error) => any) & {
            code: number;
        };
        readonly NETWORK_AUTHENTICATION_REQUIRED: ((userMessage: string, debugMessage?: string, cause?: Error) => any) & {
            code: number;
        };
        readonly DEBUG_WHO_CALLED_THIS: 555;
        readonly BAD_IMPLEMENTATION: 560;
        readonly IMPLEMENTATION_MISSING: 561;
        readonly SHOULD_NOT_HAPPENED: 598;
        readonly MUST_NEVER_HAPPENED: 599;
    };
};
