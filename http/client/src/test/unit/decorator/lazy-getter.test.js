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
import { createTestApiDef, createTestClient } from '../../helpers.js';
import { expect } from 'chai';
describe('ApiCaller decorator - lazy getter', () => {
    const client = createTestClient();
    it('calls ApiDef getter with this equal to instance and uses returned ApiDef for request', async () => {
        const apiDefFromGetter = createTestApiDef(HttpMethod.GET, '/get');
        let receivedThis = null;
        class C {
            getApiDef() {
                receivedThis = this;
                return apiDefFromGetter;
            }
            async fetch(_p) {
                return undefined;
            }
        }
        __decorate([
            ApiCaller(function (m) {
                return m.getApiDef();
            }, { httpClient: client })
        ], C.prototype, "fetch", null);
        const c = new C();
        const response = await c.fetch({ test: 'lazy' });
        expect(receivedThis).to.equal(c);
        expect(response).to.be.an('object');
        expect(response.args).to.deep.equal({ test: 'lazy' });
        expect(response.url).to.include('test=lazy');
    }).timeout(30000);
});
//# sourceMappingURL=lazy-getter.test.js.map