/*
 * @nu-art/ws-api-shared - Shared WebSocket envelope types and helpers
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect} from 'chai';
import {encodeWsEnvelope, isWsEnvelope, parseWsEnvelope, wsAck, wsError, WsBuiltinType} from '../main/index.js';

describe('ws-api-shared envelope', () => {
	it('parseWsEnvelope accepts valid envelope', () => {
		const raw = encodeWsEnvelope({type: 'ping', id: '1', payload: {t: 1}});
		const msg = parseWsEnvelope(raw);
		expect(msg).to.deep.equal({type: 'ping', id: '1', payload: {t: 1}});
	});

	it('parseWsEnvelope rejects non-envelope JSON', () => {
		expect(parseWsEnvelope('{"noType":true}')).to.equal(undefined);
		expect(parseWsEnvelope('not-json')).to.equal(undefined);
	});

	it('isWsEnvelope / ack / error helpers', () => {
		expect(isWsEnvelope({type: 'echo'})).to.equal(true);
		expect(isWsEnvelope({})).to.equal(false);
		expect(wsAck({type: 'echo', id: 'a'})).to.deep.equal({
			type: WsBuiltinType.ack,
			id: 'a',
			payload: {ok: true, forType: 'echo', forId: 'a'},
		});
		expect(wsError('boom', {type: 'x', id: 'y'}).payload?.message).to.equal('boom');
	});
});
