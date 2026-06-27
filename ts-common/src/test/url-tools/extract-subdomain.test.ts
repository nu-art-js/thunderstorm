import {extractSubdomain} from '../../main/utils/url-tools.js';
import {runSingleTestCase, TestModel} from '@nu-art/testalot';
import {expect} from 'chai';

type Input = { origin: string; baseHost: string };
type Result = string | undefined;
type TestCase_ExtractSubdomain = TestModel<Input, Result>;

const test = async (input: Input): Promise<Result> => extractSubdomain(input.origin, input.baseHost);

const runTestCase = (testCase: TestCase_ExtractSubdomain) => {
	return () => runSingleTestCase(test, testCase);
};

const expectUndefined = async (actual: string | undefined) => {
	expect(actual).to.equal(undefined);
};

describe('extractSubdomain', () => {
	const cases: { title: string; testCase: TestCase_ExtractSubdomain }[] = [
		{
			title: 'single-label root — acme.localhost',
			testCase: {
				input: {origin: 'https://acme.localhost:8364', baseHost: 'localhost'},
				result: 'acme',
			},
		},
		{
			title: 'multi-label root — beta.beamz.dev',
			testCase: {
				input: {origin: 'https://beta.beamz.dev', baseHost: 'beamz.dev'},
				result: 'beta',
			},
		},
		{
			title: 'nested subdomain — a.b.beamz.dev',
			testCase: {
				input: {origin: 'https://a.b.beamz.dev', baseHost: 'beamz.dev'},
				result: 'a.b',
			},
		},
		{
			title: 'bare multi-label root — beamz.dev',
			testCase: {
				input: {origin: 'https://beamz.dev', baseHost: 'beamz.dev'},
				result: expectUndefined,
			},
		},
		{
			title: 'bare localhost',
			testCase: {
				input: {origin: 'https://localhost:8363', baseHost: 'localhost'},
				result: expectUndefined,
			},
		},
		{
			title: 'IPv4 host — no subdomain',
			testCase: {
				input: {origin: 'https://127.0.0.1:8363', baseHost: 'localhost'},
				result: expectUndefined,
			},
		},
		{
			title: 'hostname does not match base host',
			testCase: {
				input: {origin: 'https://beta.example.com', baseHost: 'beamz.dev'},
				result: expectUndefined,
			},
		},
		{
			title: 'invalid origin',
			testCase: {
				input: {origin: 'not-a-url', baseHost: 'localhost'},
				result: expectUndefined,
			},
		},
	];

	cases.forEach(({title, testCase}) => {
		it(title, runTestCase(testCase));
	});
});
