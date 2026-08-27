import {assert} from 'chai';
import {HttpException} from '@nu-art/http-client';
import {ErrorType_LoginBlocked} from '@nu-art/password-auth-shared';
import {
	LoginFailureMessage_Credentials,
	LoginFailureMessage_Unavailable,
	resolveLoginFailure,
} from '../main/ui/resolve-login-failure.js';

const fakeRequest = {getUrl: () => '/v1/organization/apex-login'} as ConstructorParameters<typeof HttpException>[1];

describe('resolveLoginFailure', () => {
	it('reads BLOCKED_LOGIN from errorResponse.error', () => {
		const blockedUntil = 1_700_000_000_000;
		const err = new HttpException(403, fakeRequest, {
			error: {type: ErrorType_LoginBlocked, data: {blockedUntil}},
		});
		const result = resolveLoginFailure(err);
		assert.equal(result.blockedUntil, blockedUntil);
		assert.include(result.errorMessages[0], 'Login blocked until');
	});

	it('reads BLOCKED_LOGIN when the body is nested under debugMessage', () => {
		const blockedUntil = 1_700_000_000_000;
		const err = new HttpException(403, fakeRequest, {});
		err.errorResponse = {
			debugMessage: {error: {type: ErrorType_LoginBlocked, data: {blockedUntil}}},
		} as unknown as HttpException['errorResponse'];
		const result = resolveLoginFailure(err);
		assert.equal(result.blockedUntil, blockedUntil);
	});

	it('maps 5xx to a retry message', () => {
		const err = new HttpException(500, fakeRequest, {});
		assert.deepEqual(resolveLoginFailure(err).errorMessages, [LoginFailureMessage_Unavailable]);
	});

	it('maps other 4xx to credentials copy', () => {
		const err = new HttpException(401, fakeRequest, {});
		assert.deepEqual(resolveLoginFailure(err).errorMessages, [LoginFailureMessage_Credentials]);
	});

	it('maps a non-HTTP error to credentials copy', () => {
		assert.deepEqual(resolveLoginFailure(new Error('nope')).errorMessages, [LoginFailureMessage_Credentials]);
	});
});
