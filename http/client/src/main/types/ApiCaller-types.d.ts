import type { HttpClient } from '../core/HttpClient.js';
import type { ApiDef, GeneralApi } from './api-types.js';
import { ResolvableContent } from '@nu-art/ts-common';
/**
 * Raw HTTP response structure.
 * Compatible with Axios response structure.
 */
export type RawHttpResponse<R> = {
    data: R;
    status: number;
    statusText: string;
    headers: Record<string, string | string[] | undefined>;
    config: unknown;
};
/**
 * Full context object passed to callbacks after API execution.
 */
export type ApiCallContext<API extends GeneralApi> = {
    response: API['R'];
    statusCode: number;
    headers: Record<string, string | string[] | undefined>;
    body?: API['B'];
    params?: API['P'];
    apiDef: ApiDef<API>;
    duration: number;
    rawResponse: RawHttpResponse<API['R']>;
};
/**
 * User-provided callback after API response.
 */
export type ApiCallback<API extends GeneralApi> = (ctx: ApiCallContext<API>) => void | Promise<void>;
/**
 * Module callback factory - receives module instance and context.
 */
export type ModuleCallback<Module, API extends GeneralApi> = (module: Module, ctx: ApiCallContext<API>) => void | Promise<void>;
/**
 * Configuration options for ApiCaller decorator.
 */
export type ApiCallerOptions<Module, API extends GeneralApi> = {
    onComplete?: ModuleCallback<Module, API>;
    httpClient?: ResolvableContent<HttpClient, [Module]>;
};
/** @deprecated Use ApiCallerOptions. */
export type ClientApiOptions<Module, API extends GeneralApi> = ApiCallerOptions<Module, API>;
