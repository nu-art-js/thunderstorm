import {expect} from 'chai';
import {HttpCodes, HttpMethod} from '@nu-art/api-types';
import type {HttpRequestDef} from '@nu-art/http-request-shared';
import {dispatchStoredHttpRequest} from '../../main/index.js';

const stored: HttpRequestDef = {
	method: HttpMethod.POST,
	url: 'https://hooks.example/hook',
	headers: {Authorization: 'Bearer {{secret:cursor-implement-tasks}}'},
	body: '{"version":"{{version}}"}',
};

describe('dispatchStoredHttpRequest', () => {
	it('logs the request with the secret token, then sends the resolved request', async () => {
		const logged: HttpRequestDef[] = [];
		const sent: HttpRequestDef[] = [];
		const result = await dispatchStoredHttpRequest(stored, {version: '0.1.68'}, {
			resolveSecret: async name => name === 'cursor-implement-tasks' ? 'crsr_secret' : undefined,
			send: async request => {
				sent.push(request);
				return {status: 200, body: {ok: true}};
			},
			logRequest: request => logged.push(request),
			logFailure: () => undefined,
		});

		expect(result.status).to.equal(200);
		expect(JSON.stringify(logged)).to.include('{{secret:cursor-implement-tasks}}');
		expect(JSON.stringify(logged)).to.not.include('crsr_secret');
		expect(sent[0].headers?.Authorization).to.equal('Bearer crsr_secret');
		expect(sent[0].body).to.equal('{"version":"0.1.68"}');
	});

	it('does not resolve a secret name injected by a param value', async () => {
		const sent: HttpRequestDef[] = [];
		await dispatchStoredHttpRequest(stored, {version: '{{secret:other}}'}, {
			resolveSecret: async name => name === 'cursor-implement-tasks' ? 'crsr_secret' : 'should-not-resolve',
			send: async request => {
				sent.push(request);
				return {status: 200, body: {}};
			},
			logRequest: () => undefined,
			logFailure: () => undefined,
		});
		expect(sent[0].body).to.equal('{"version":"{{secret:other}}"}');
		expect(sent[0].headers?.Authorization).to.equal('Bearer crsr_secret');
	});

	it('fails a missing secret with 412 and does not send', async () => {
		let sent = false;
		try {
			await dispatchStoredHttpRequest(stored, {version: '1'}, {
				resolveSecret: async () => undefined,
				send: async () => {
					sent = true;
					return {status: 200, body: {}};
				},
				logRequest: () => undefined,
				logFailure: () => undefined,
			});
			expect.fail('should have thrown');
		} catch (error) {
			expect((error as {responseCode?: number}).responseCode).to.equal(HttpCodes._4XX.PRECONDITION_FAILED.code);
			expect(error instanceof Error ? error.message : '').to.include('Missing data: secret:cursor-implement-tasks');
		}
		expect(sent).to.equal(false);
	});

	it('logs a failed response without the resolved request', async () => {
		const failures: unknown[] = [];
		const result = await dispatchStoredHttpRequest(stored, {version: '1'}, {
			resolveSecret: async () => 'crsr_secret',
			send: async () => ({status: 401, body: {message: 'Invalid API key'}}),
			logRequest: () => undefined,
			logFailure: failure => failures.push(failure),
		});
		expect(result.status).to.equal(401);
		expect(JSON.stringify(failures)).to.include('Invalid API key');
		expect(JSON.stringify(failures)).to.not.include('crsr_secret');
	});
});
