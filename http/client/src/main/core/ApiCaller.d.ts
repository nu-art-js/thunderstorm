import { ApiDef, GeneralApi } from '../types/api-types.js';
import type { ApiCallback, ApiCallerOptions } from '../types/ApiCaller-types.js';
import { ResolvableContent } from '@nu-art/ts-common';
/** True when ApiDef uses query params (GET/DELETE); false when it uses body (POST/PUT/PATCH). */
export declare function isQueryMethod(method: string): boolean;
/**
 * TC39 Stage 3 decorator for API calls. Infers body vs query from apiDef.method:
 * GET/DELETE → params, setUrlParams; POST/PUT/PATCH → body, setBodyAsJson.
 *
 * @param _apiDef - API definition or ResolvableContent (value or getter with instance as first arg)
 * @param options - Optional: onComplete, httpClient (default shared HttpClient)
 */
export declare function ApiCaller<API extends GeneralApi, Module = any>(_apiDef: ResolvableContent<ApiDef<API>, [Module]>, options?: ApiCallerOptions<Module, API>): <This extends Module>(originalMethod: (this: This, payload: API["B"] | API["P"], userCallback?: ApiCallback<API>) => unknown, context: ClassMethodDecoratorContext<This>) => (this: This, payload: API["B"] | API["P"], userCallback?: ApiCallback<API>) => Promise<API["R"]>;
/** @deprecated Use ApiCaller. Kept for backward compatibility. */
export declare const ClientApi: typeof ApiCaller;
