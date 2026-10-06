import {expect} from 'chai';
import {HttpCodes, HttpMethod} from '@nu-art/api-types';
import {parseCurl, renderHttpRequest, type HttpRequestDef} from '../../main/index.js';

const request = (overrides?: Partial<HttpRequestDef>): HttpRequestDef => ({
	method: HttpMethod.POST,
	url: 'https://hooks.example/hook',
	headers: {
		Authorization: 'Bearer {{secret:cursor-implement-tasks}}',
		'Content-Type': 'application/json',
	},
	body: '{"version":"{{version}}"}',
	...overrides,
});

const codeOf = (work: () => void): number | undefined => {
	try {
		work();
		return undefined;
	} catch (error) {
		return (error as {responseCode?: number}).responseCode;
	}
};

describe('renderHttpRequest', () => {
	it('inserts caller params and leaves secret tokens', () => {
		const rendered = renderHttpRequest(request(), {version: '0.1.68'});
		expect(rendered.body).to.equal('{"version":"0.1.68"}');
		expect(rendered.headers?.Authorization).to.equal('Bearer {{secret:cursor-implement-tasks}}');
	});

	it('json-escapes a param so the document still parses', () => {
		const rendered = renderHttpRequest(request({
			headers: {
				Authorization: 'Bearer {{secret:cursor-implement-tasks}}',
				'X-Note': '{{note}}',
			},
		}), {version: '1', note: 'say "hi"'});
		expect(rendered.headers?.['X-Note']).to.equal('say "hi"');
		expect(JSON.parse(JSON.stringify(rendered)).headers['X-Note']).to.equal('say "hi"');
	});

	it('fails missing params with 412', () => {
		expect(codeOf(() => renderHttpRequest(request(), {}))).to.equal(HttpCodes._4XX.PRECONDITION_FAILED.code);
		try {
			renderHttpRequest(request(), {});
		} catch (error) {
			expect(error instanceof Error ? error.message : '').to.include('Missing data: version');
		}
	});

	it('rejects a body on GET', () => {
		expect(() => renderHttpRequest(request({method: HttpMethod.GET, body: '{"a":1}'}), {version: '1'}))
			.to.throw(/cannot carry a body/);
	});
});

describe('parseCurl', () => {
	it('builds method, url, headers, and body from a pasted command', () => {
		const parsed = parseCurl(`curl -X POST "https://hooks.example/hook" \\
  -H "Authorization: Bearer crsr_example" \\
  -H "Content-Type: application/json" \\
  -d '{"version":"{{version}}"}'`);
		expect(parsed.method).to.equal(HttpMethod.POST);
		expect(parsed.url).to.equal('https://hooks.example/hook');
		expect(parsed.headers?.Authorization).to.equal('Bearer crsr_example');
		expect(parsed.headers?.['Content-Type']).to.equal('application/json');
		expect(parsed.body).to.equal('{"version":"{{version}}"}');
	});

	it('defaults to POST when the command has a body and no method', () => {
		const parsed = parseCurl(`curl https://hooks.example/run -d '{"ok":true}'`);
		expect(parsed.method).to.equal(HttpMethod.POST);
		expect(parsed.headers?.['Content-Type']).to.equal('application/json');
	});

	it('defaults to GET when the command has no body', () => {
		const parsed = parseCurl('curl -fsSL --compressed https://hooks.example/run');
		expect(parsed.method).to.equal(HttpMethod.GET);
		expect(parsed.url).to.equal('https://hooks.example/run');
		expect(parsed.body).to.equal(undefined);
		expect(parsed.headers).to.equal(undefined);
	});

	it('reads long flags and an inline header', () => {
		const parsed = parseCurl('curl --request PUT --url=https://hooks.example/run --header "Accept: text/plain" --data-raw x=1');
		expect(parsed.method).to.equal(HttpMethod.PUT);
		expect(parsed.url).to.equal('https://hooks.example/run');
		expect(parsed.headers?.Accept).to.equal('text/plain');
		expect(parsed.body).to.equal('x=1');
		expect(parsed.headers?.['Content-Type']).to.equal('application/x-www-form-urlencoded');
	});

	it('joins several data flags and treats a non-json body as a form', () => {
		const parsed = parseCurl(`curl https://hooks.example/run -d 'a=1' --data-binary 'b=2'`);
		expect(parsed.body).to.equal('a=1&b=2');
		expect(parsed.headers?.['Content-Type']).to.equal('application/x-www-form-urlencoded');
	});

	it('treats a json array body as json', () => {
		const parsed = parseCurl(`curl https://hooks.example/run -d '[1,2]'`);
		expect(parsed.body).to.equal('[1,2]');
		expect(parsed.headers?.['Content-Type']).to.equal('application/json');
	});

	it('keeps a content-type the command already set', () => {
		const parsed = parseCurl(`curl https://hooks.example/run -H 'Content-Type: text/plain' -d hello`);
		expect(parsed.body).to.equal('hello');
		expect(parsed.headers?.['Content-Type']).to.equal('text/plain');
	});

	it('turns -u into a basic authorization header and leaves a pasted bearer as written', () => {
		const basic = parseCurl('curl -u user:pass https://hooks.example/run');
		expect(basic.headers?.Authorization).to.equal('Basic dXNlcjpwYXNz');

		const named = parseCurl('curl --user=alice:secret https://hooks.example/run');
		expect(named.headers?.Authorization).to.equal(`Basic ${btoa('alice:secret')}`);

		const bearer = parseCurl('curl -H "Authorization: Bearer crsr_example" https://hooks.example/run');
		expect(bearer.headers?.Authorization).to.equal('Bearer crsr_example');
	});

	it('unescapes a backslash inside double quotes', () => {
		const parsed = parseCurl('curl https://hooks.example/run -d "a\\"b"');
		expect(parsed.body).to.equal('a"b');
	});

	it('rejects a body on a method that cannot carry one', () => {
		expect(() => parseCurl(`curl -X GET https://hooks.example/run -d '{}'`)).to.throw(/cannot carry a body/);
	});

	it('rejects an http url, a second url, and an unsupported method', () => {
		expect(() => parseCurl('curl http://hooks.example/run')).to.throw(/url must be https/);
		expect(() => parseCurl('curl https://hooks.example/a https://hooks.example/b')).to.throw(/more than one URL/);
		expect(() => parseCurl('curl -X TRACE https://hooks.example/run')).to.throw(/Unsupported curl method: TRACE/);
	});

	it('rejects an unknown flag, a bad header, a missing value, an unclosed quote, and an empty command', () => {
		expect(() => parseCurl('curl --form @file https://hooks.example/run')).to.throw(/Unsupported curl flag: --form/);
		expect(() => parseCurl('curl -H Authorization https://hooks.example/run')).to.throw(/Name: value/);
		expect(() => parseCurl('curl -X')).to.throw(/Curl flag -X needs a value/);
		expect(() => parseCurl('curl "https://hooks.example')).to.throw(/unclosed quote/);
		expect(() => parseCurl('   ')).to.throw(/Paste a curl command/);
		expect(() => parseCurl('curl -X POST')).to.throw(/no URL/);
	});
});
