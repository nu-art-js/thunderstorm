import {TestModel, defaultTestProcessor, runSingleTestCase} from '@nu-art/testalot';
import {expect} from 'chai';
import {BAI_Config} from '../../main/config/types/project-config.js';
import {resolveBaiTemplateParams, transformJsonTemplate} from '../../main/core/template-params.js';


const config = (overrides: Partial<NonNullable<BAI_Config['templateParams']>> = {}): BAI_Config => ({
	thunderstormVersion: '1.0.0',
	appVersion: '1.0.0',
	templateParams: {
		packageJson: {THUNDERSTORM_VERSION: '0.500.0'},
		params: {PORT_BACKEND_APEX: 8352},
		...overrides,
	},
	files: {backend: {proxy: null}},
});

type ResolveInput = { env?: NodeJS.Dict<string>; overrides?: Partial<NonNullable<BAI_Config['templateParams']>> };
type ResolveResult = Record<string, string>;
type TestCase_Resolve = TestModel<ResolveInput, ResolveResult>;

const resolve = async (input: ResolveInput): Promise<ResolveResult> =>
	resolveBaiTemplateParams(config(input.overrides), input.env ?? {});
const runResolve = (testCase: TestCase_Resolve) => () => runSingleTestCase(resolve, testCase, defaultTestProcessor);

type TransformInput = { json: string; params: Record<string, string> };
type TransformResult = unknown;
type TestCase_Transform = TestModel<TransformInput, TransformResult>;

const transform = async (input: TransformInput): Promise<TransformResult> =>
	JSON.parse(transformJsonTemplate(input.json, input.params));
const runTransform = (testCase: TestCase_Transform) => () => runSingleTestCase(transform, testCase, defaultTestProcessor);

describe('resolveBaiTemplateParams', () => {
	it('defaults come from bai-config', runResolve({
		input: {},
		result: async (actual) => {
			expect(actual.THUNDERSTORM_VERSION).to.equal('0.500.0');
			expect(actual.PORT_BACKEND_APEX).to.equal('8352');
		},
	}));

	it('env overlays matching bai-config keys', runResolve({
		input: {env: {PORT_BACKEND_APEX: '8552'}},
		result: async (actual) => {
			expect(actual.PORT_BACKEND_APEX).to.equal('8552');
			expect(actual.THUNDERSTORM_VERSION).to.equal('0.500.0');
		},
	}));

	it('all env vars land in the param map', runResolve({
		input: {env: {PORT_BACKEND_APEX: '8552', PATH: '/tmp'}},
		result: async (actual) => {
			expect(actual.PORT_BACKEND_APEX).to.equal('8552');
			expect(actual.PATH).to.equal('/tmp');
		},
	}));
});

describe('transformJsonTemplate', () => {
	it('unquotes integer placeholders so ports stay numbers', runTransform({
		input: {
			json: '{"basePort":"{{PORT_BACKEND_APEX}}","label":"{{NAME}}"}',
			params: {PORT_BACKEND_APEX: '8552', NAME: 'sandbox'},
		},
		result: {basePort: 8552, label: 'sandbox'},
	}));

	it('replaces placeholders inside longer strings', runTransform({
		input: {
			json: '{"url":"http://127.0.0.1:{{PORT_CONFIG}}/cfg"}',
			params: {PORT_CONFIG: '8554'},
		},
		result: {url: 'http://127.0.0.1:8554/cfg'},
	}));

	it('missing param throws', runTransform({
		input: {json: '{"basePort":"{{PORT_BACKEND_APEX}}"}', params: {}},
		error: {expected: 'Missing template param: PORT_BACKEND_APEX'},
	}));
});
