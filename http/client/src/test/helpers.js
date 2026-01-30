/*
 * Thunderstorm is a full web app framework!
 *
 * Typescript & Express backend infrastructure that natively runs on firebase function
 * Typescript & React frontend infrastructure
 *
 * Copyright (C) 2020 Adam van der Kruk aka TacB0sS
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { HttpClient } from '../main/index.js';
/**
 * Creates a test HttpClient with the specified origin and optional config
 */
export function createTestClient(origin = 'https://httpbin.org', config) {
    return new HttpClient({
        origin,
        timeout: 30000,
        compress: false,
        ...config
    });
}
/**
 * Creates a test API definition
 */
export function createTestApiDef(method, path) {
    return { method, path };
}
export class TestHttpClient extends HttpClient {
    lastOptions;
    mockResponse;
    /** Set a canned axios-like response (partial allowed). Accepts any shape for convenience in tests. */
    setMockResponse(response) {
        this.mockResponse = response;
    }
    /** Clear recorded options and mock response */
    reset() {
        this.lastOptions = undefined;
        this.mockResponse = undefined;
    }
    /** Override boundary that performs the real request – tests intercept here. */
    async sendRequest(options) {
        this.lastOptions = options;
        if (!this.mockResponse) {
            // default fallback response
            return {
                data: {},
                status: 200,
                statusText: 'OK',
                headers: {},
                config: options
            };
        }
        return this.mockResponse;
    }
}
//# sourceMappingURL=helpers.js.map