import assert from 'node:assert/strict';
import {
	addQueryParamOnUrl,
	readQueryParameter,
	readQueryParams,
	removeQueryParamOnUrl,
	setQueryOnUrl,
	toLocationUrl
} from '../main/query-url.js';

const origin = 'https://beamz-staging.com';
const consentUrl = `${origin}/oauth/consent/beamz?authReqId=34accf9cb5b469d7b0a8f937ef68779c`;
const encodedConsent = 'https%3A%2F%2Fbeamz-staging.com%2Foauth%2Fconsent%2Fbeamz%3FauthReqId%3D34accf9cb5b469d7b0a8f937ef68779c';
const signIn = `${origin}/sign-in?redirectUrl=${encodedConsent}&Authorization=jwt#kept`;
/** The sign-in address that already carries the MCP consent redirect. */
const consentSignIn = `${origin}/sign-in?redirectUrl=${encodedConsent}`;
/** The address left on screen after Google, once the consent redirect had been encoded again. */
const doubleEncodedSignIn = `${origin}/sign-in?redirectUrl=https%253A%252F%252Fbeamz-staging.com%252Foauth%252Fconsent%252Fbeamz%253FauthReqId%253D34accf9cb5b469d7b0a8f937ef68779c`;

describe('readQueryParams', () => {
	it('no query', () => {
		assert.deepEqual(readQueryParams(`${origin}/sign-in`), {});
	});

	it('decodes a single-encoded consent redirect', () => {
		assert.deepEqual(readQueryParams(consentSignIn), {redirectUrl: consentUrl});
	});

	it('empty value is undefined', () => {
		assert.deepEqual(readQueryParams(`${origin}/sign-in?redirectUrl=`), {redirectUrl: undefined});
	});

	it('key with no equals is undefined', () => {
		assert.deepEqual(readQueryParams(`${origin}/sign-in?redirectUrl`), {redirectUrl: undefined});
	});

	it('keeps every key', () => {
		assert.deepEqual(readQueryParams(signIn), {redirectUrl: consentUrl, Authorization: 'jwt'});
	});

	it('ignores the hash', () => {
		assert.deepEqual(readQueryParams(`${origin}/sign-in?a=1#section`), {a: '1'});
	});

	it('decodes %20 and + as a space', () => {
		assert.deepEqual(readQueryParams(`${origin}/sign-in?a=hello%20there&b=hello+there`), {
			a: 'hello there',
			b: 'hello there',
		});
	});

	it('last duplicate key wins', () => {
		assert.deepEqual(readQueryParams(`${origin}/sign-in?a=1&a=2`), {a: '2'});
	});

	it('decodes a double-encoded consent redirect only once', () => {
		assert.deepEqual(readQueryParams(doubleEncodedSignIn), {redirectUrl: encodedConsent});
	});
});

describe('readQueryParameter', () => {
	it('missing key', () => {
		assert.equal(readQueryParameter(`${origin}/sign-in`, 'redirectUrl'), undefined);
	});

	it('empty value', () => {
		assert.equal(readQueryParameter(`${origin}/sign-in?redirectUrl=`, 'redirectUrl'), null);
	});

	it('decoded value', () => {
		assert.equal(readQueryParameter(consentSignIn, 'redirectUrl'), consentUrl);
	});
});

describe('removeQueryParamOnUrl', () => {
	it('drops the session token and leaves the consent redirect single-encoded', () => {
		assert.equal(removeQueryParamOnUrl(signIn, 'Authorization'), `/sign-in?redirectUrl=${encodedConsent}#kept`);
	});

	it('drops the only query key', () => {
		assert.equal(removeQueryParamOnUrl(`${origin}/sign-in?Authorization=jwt`, 'Authorization'), '/sign-in');
	});

	it('removing a missing key does not encode the consent redirect again', () => {
		assert.equal(removeQueryParamOnUrl(consentSignIn, 'Authorization'), '/sign-in?redirectUrl=' + encodedConsent);
	});

	it('drops one key and keeps the others', () => {
		assert.equal(removeQueryParamOnUrl(`${origin}/sign-in?a=1&b=2&c=3`, 'b'), '/sign-in?a=1&c=3');
	});

	it('keeps the post-Google consent redirect single-encoded after the session token is removed', () => {
		const returnedFromGoogle = `${origin}/sign-in?Authorization=jwt&redirectUrl=${encodedConsent}`;
		const next = `${origin}${removeQueryParamOnUrl(returnedFromGoogle, 'Authorization')}`;
		assert.equal(next, consentSignIn);
		assert.notEqual(next, doubleEncodedSignIn);
		assert.equal(readQueryParameter(next, 'redirectUrl'), consentUrl);
	});

	it('a second removal does not turn that address into the double-encoded one', () => {
		const returnedFromGoogle = `${origin}/sign-in?Authorization=jwt&redirectUrl=${encodedConsent}`;
		const once = `${origin}${removeQueryParamOnUrl(returnedFromGoogle, 'Authorization')}`;
		const twice = `${origin}${removeQueryParamOnUrl(once, 'Authorization')}`;
		assert.equal(twice, consentSignIn);
		assert.notEqual(twice, doubleEncodedSignIn);
	});
});

describe('addQueryParamOnUrl', () => {
	it('encodes a consent URL once', () => {
		assert.equal(addQueryParamOnUrl(`${origin}/sign-in`, 'redirectUrl', consentUrl), `/sign-in?redirectUrl=${encodedConsent}`);
	});

	it('keeps an existing consent redirect single-encoded', () => {
		assert.equal(
			addQueryParamOnUrl(consentSignIn, 'Authorization', 'jwt'),
			`/sign-in?redirectUrl=${encodedConsent}&Authorization=jwt`,
		);
	});

	it('replaces an existing key', () => {
		assert.equal(addQueryParamOnUrl(`${origin}/sign-in?a=1`, 'a', '2'), '/sign-in?a=2');
	});

	it('keeps the hash', () => {
		assert.equal(addQueryParamOnUrl(`${origin}/sign-in#kept`, 'a', '1'), '/sign-in?a=1#kept');
	});

	it('encodes a space, ampersand, and equals once', () => {
		assert.equal(addQueryParamOnUrl(`${origin}/sign-in`, 'q', 'a b&c=d'), '/sign-in?q=a+b%26c%3Dd');
	});
});

describe('setQueryOnUrl', () => {
	it('replaces the query and encodes the consent URL once', () => {
		assert.equal(
			setQueryOnUrl(`${origin}/sign-in?Authorization=jwt#kept`, {redirectUrl: consentUrl}),
			`/sign-in?redirectUrl=${encodedConsent}#kept`,
		);
	});

	it('omits empty and missing values', () => {
		assert.equal(setQueryOnUrl(`${origin}/sign-in?a=1`, {a: '', b: undefined, c: 'ok'}), '/sign-in?c=ok');
	});

	it('clears the query', () => {
		assert.equal(setQueryOnUrl(`${origin}/sign-in?a=1#kept`, {}), '/sign-in#kept');
	});

	it('does not write the double-encoded consent address', () => {
		const next = `${origin}${setQueryOnUrl(`${origin}/sign-in?Authorization=jwt`, {redirectUrl: consentUrl})}`;
		assert.equal(next, consentSignIn);
		assert.notEqual(next, doubleEncodedSignIn);
	});
});

describe('toLocationUrl', () => {
	it('keeps an already encoded consent redirect single-encoded', () => {
		assert.equal(
			toLocationUrl(origin, {pathname: '/sign-in', search: `?redirectUrl=${encodedConsent}`}),
			`/sign-in?redirectUrl=${encodedConsent}`,
		);
	});

	it('sets the hash', () => {
		assert.equal(toLocationUrl(origin, {pathname: '/sign-in', search: '?a=1', hash: '#kept'}), '/sign-in?a=1#kept');
	});

	it('adds a hash marker when one was not passed', () => {
		assert.equal(toLocationUrl(origin, {pathname: '/sign-in', hash: 'kept'}), '/sign-in#kept');
	});

	it('clears the search when none is passed', () => {
		assert.equal(toLocationUrl(origin, {pathname: '/sign-in'}), '/sign-in');
	});
});
