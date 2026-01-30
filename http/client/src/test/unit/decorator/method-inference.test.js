/*
 * @nu-art/http-client - Type-safe HTTP client for Thunderstorm
 * Copyright (C) 2024 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { ApiCaller, HttpMethod } from '../../../main/index.js';
import { expect } from 'chai';
import { TestHttpClient } from '../../helpers.js';
describe('ApiCaller decorator - method inference', () => {
    const client = new TestHttpClient();
    client.setConfig({ origin: 'https://example.org' });
    it('uses setUrlParams for GET', async () => {
        class C {
            async get(_p) {
                return undefined;
            }
        }
        __decorate([
            ApiCaller({ method: HttpMethod.GET, path: '/get' }, { httpClient: client })
        ], C.prototype, "get", null);
        const responseBody = { url: 'https://example.org/get?id=x', args: { id: 'x' }, headers: {} };
        client.setMockResponse({ data: responseBody, status: 200, statusText: 'OK', headers: {}, config: {} });
        const c = new C();
        const response = await c.get({ id: 'x' });
        expect(client.lastOptions).to.be.an('object');
        expect(client.lastOptions.url).to.include('id=x');
        expect(response).to.be.an('object');
        expect(response).to.deep.equal(responseBody);
    }).timeout(30000);
    it('uses setUrlParams for DELETE', async () => {
        class C {
            async del(_p) {
                return undefined;
            }
        }
        __decorate([
            ApiCaller({ method: HttpMethod.DELETE, path: '/delete' }, { httpClient: client })
        ], C.prototype, "del", null);
        const responseBody = { url: 'https://example.org/delete?_id=y', args: { _id: 'y' }, headers: {} };
        client.setMockResponse({ data: responseBody, status: 200, statusText: 'OK', headers: {}, config: {} });
        const c = new C();
        const response = await c.del({ _id: 'y' });
        expect(client.lastOptions).to.be.an('object');
        expect(client.lastOptions.url).to.include('_id=y');
        expect(response).to.deep.equal(responseBody);
    }).timeout(30000);
    it('uses setBodyAsJson for POST', async () => {
        class C {
            async post(_b) {
                return undefined;
            }
        }
        __decorate([
            ApiCaller({ method: HttpMethod.POST, path: '/post' }, { httpClient: client })
        ], C.prototype, "post", null);
        const responseBody = { url: 'https://example.org/post', json: { name: 'foo' }, data: '' };
        client.setMockResponse({ data: responseBody, status: 200, statusText: 'OK', headers: {}, config: {} });
        const c = new C();
        const response = await c.post({ name: 'foo' });
        expect(client.lastOptions).to.be.an('object');
        expect(client.lastOptions.data).to.deep.equal({ name: 'foo' });
        expect(response).to.deep.equal(responseBody);
    }).timeout(30000);
    it('uses setBodyAsJson for PUT and PATCH', async () => {
        class C {
            async put(_b) {
                return undefined;
            }
            async patch(_b) {
                return undefined;
            }
        }
        __decorate([
            ApiCaller({ method: HttpMethod.PUT, path: '/put' }, { httpClient: client })
        ], C.prototype, "put", null);
        __decorate([
            ApiCaller({ method: HttpMethod.PATCH, path: '/patch' }, { httpClient: client })
        ], C.prototype, "patch", null);
        const putBody = { url: 'https://example.org/put', json: { x: 1 } };
        const patchBody = { url: 'https://example.org/patch', json: { y: 2 } };
        client.setMockResponse({ data: putBody, status: 200, statusText: 'OK', headers: {}, config: {} });
        const c = new C();
        const putResponse = await c.put({ x: 1 });
        expect(client.lastOptions.data).to.deep.equal({ x: 1 });
        expect(putResponse).to.deep.equal(putBody);
        client.setMockResponse({ data: patchBody, status: 200, statusText: 'OK', headers: {}, config: {} });
        const patchResponse = await c.patch({ y: 2 });
        expect(client.lastOptions.data).to.deep.equal({ y: 2 });
        expect(patchResponse).to.deep.equal(patchBody);
    }).timeout(30000);
});
//# sourceMappingURL=method-inference.test.js.map