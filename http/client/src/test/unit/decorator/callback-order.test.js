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
import { createTestClient } from '../../helpers.js';
import { expect } from 'chai';
describe('ApiCaller decorator - callback order', () => {
    const client = createTestClient();
    it('calls onComplete then userCallback in order with real response', async () => {
        const order = [];
        class C {
            async upsert(_body, userCallback) {
                return undefined;
            }
        }
        __decorate([
            ApiCaller({ method: HttpMethod.POST, path: '/post' }, {
                httpClient: client,
                onComplete: (_module, ctx) => {
                    order.push('onComplete');
                    order.push(String(ctx.response?.json?.name));
                }
            })
        ], C.prototype, "upsert", null);
        const c = new C();
        await c.upsert({ name: 'foo' }, (ctx) => {
            order.push('userCallback');
            order.push(String(ctx.response?.json?.name));
        });
        expect(order).to.deep.equal(['onComplete', 'foo', 'userCallback', 'foo']);
    }).timeout(30000);
});
//# sourceMappingURL=callback-order.test.js.map