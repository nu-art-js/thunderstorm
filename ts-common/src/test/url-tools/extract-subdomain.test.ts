import {extractSubdomain} from '../../main/utils/url-tools.js';
import {runSingleTestCase, TestModel} from '@nu-art/testalot';

type Input = { origin: string; baseHost: string };
type Result = string | undefined;
type TestCase_ExtractSubdomain = TestModel<Input, Result>;

const test = async (input: Input): Promise<Result> => extractSubdomain(input.origin, input.baseHost);

const runTestCase = (testCase: TestCase_ExtractSubdomain) => {
	return () => runSingleTestCase(test, testCase);
};

describe('extractSubdomain', () => {
	const cases: TestCase_ExtractSubdomain[] = [
		{
			description: 'single-label root — acme.localhost',
			input: {origin: 'https://acme.localhost:8364', baseHost: 'localhost'},
			result: 'acme',
		},
		{
			description: 'multi-label root — beta.beamz.dev',
			input: {origin: 'https://beta.beamz.dev', baseHost: 'beamz.dev'},
			result: 'beta',
		},
		{
			description: 'nested subdomain — a.b.beamz.dev',
			input: {origin: 'https://a.b.beamz.dev', baseHost: 'beamz.dev'},
			result: 'a.b',
		},
		{
			description: 'bare multi-label root — beamz.dev',
			input: {origin: 'https://beamz.dev', baseHost: 'beamz.dev'},
			result: undefined,
		},
		{
			description: 'bare localhost',
			input: {origin: 'https://localhost:8363', baseHost: 'localhost'},
			result: undefined,
		},
		{
			description: 'IPv4 host — no subdomain',
			input: {origin: 'https://127.0.0.1:8363', baseHost: 'localhost'},
			result: undefined,
		},
		{
			description: 'hostname does not match base host',
			input: {origin: 'https://beta.example.com', baseHost: 'beamz.dev'},
			result: undefined,
		},
		{
			description: 'invalid origin',
			input: {origin: 'not-a-url', baseHost: 'localhost'},
			result: undefined,
		},
	];

	cases.forEach(testCase => {
		it(testCase.description, runTestCase(testCase));
	});
});
