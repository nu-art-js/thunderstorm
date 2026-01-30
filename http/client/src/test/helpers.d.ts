import { ApiDef, GeneralApi, HttpClient, HttpConfig, HttpMethod } from '../main/index.js';
import { AxiosRequestConfig } from 'axios';
/**
 * Creates a test HttpClient with the specified origin and optional config
 */
export declare function createTestClient(origin?: string, config?: Partial<HttpConfig>): HttpClient;
/**
 * Creates a test API definition
 */
export declare function createTestApiDef<API extends GeneralApi>(method: HttpMethod, path: string): ApiDef<API>;
export declare class TestHttpClient extends HttpClient {
    lastOptions?: AxiosRequestConfig;
    private mockResponse?;
    /** Set a canned axios-like response (partial allowed). Accepts any shape for convenience in tests. */
    setMockResponse(response: any): void;
    /** Clear recorded options and mock response */
    reset(): void;
    /** Override boundary that performs the real request – tests intercept here. */
    sendRequest(options: AxiosRequestConfig): Promise<any>;
}
