import {TestModel, defaultTestProcessor, runSingleTestCase} from '@nu-art/testalot';
import {baiTools, BaiToolDef} from '../main/bai-tools.js';


type Input = {
	toolName: string;
	params: Record<string, unknown>;
};
type Result = string[];

type TestCase_BaiFlags = TestModel<Input, Result>;

const findTool = (name: string): BaiToolDef => {
	const tool = baiTools.find(t => t.name === name);
	if (!tool)
		throw new Error(`Tool not found: ${name}`);

	return tool;
};

const test = async (input: Input): Promise<Result> => {
	const tool = findTool(input.toolName);
	return tool.buildFlags(input.params);
};

const runTestCase = (testCase: TestCase_BaiFlags, processor?: typeof defaultTestProcessor) => () => runSingleTestCase(test, testCase, processor);

describe('BAI tool flag construction', () => {

	describe('bai_init', () => {
		it('should produce install + purge flags', runTestCase({
			input: {toolName: 'bai_init', params: {}},
			result: ['--install', '--purge'],
		}));
	});

	describe('bai_install', () => {
		it('should produce install flag', runTestCase({
			input: {toolName: 'bai_install', params: {}},
			result: ['--install'],
		}));
	});

	describe('bai_build', () => {
		it('should produce no flags for full build', runTestCase({
			input: {toolName: 'bai_build', params: {}},
			result: [],
		}));

		it('should produce use-package flag for single package', runTestCase({
			input: {toolName: 'bai_build', params: {package: 'market-prediction-shared'}},
			result: ['--use-package=market-prediction-shared'],
		}));

		it('should produce build-tree flag when requested', runTestCase({
			input: {toolName: 'bai_build', params: {package: 'my-pkg', buildTree: true}},
			result: ['--use-package=my-pkg', '--build-tree'],
		}));

		it('should not produce build-tree flag when false', runTestCase({
			input: {toolName: 'bai_build', params: {package: 'my-pkg', buildTree: false}},
			result: ['--use-package=my-pkg'],
		}));
	});

	describe('bai_test', () => {
		it('should produce test flag only for full test run', runTestCase({
			input: {toolName: 'bai_test', params: {}},
			result: ['--test'],
		}));

		it('should produce test + package flags', runTestCase({
			input: {toolName: 'bai_test', params: {package: 'my-pkg'}},
			result: ['--test', '--use-package=my-pkg'],
		}));

		it('should produce test type flag', runTestCase({
			input: {toolName: 'bai_test', params: {testType: 'pure'}},
			result: ['--test', '--test-type=pure'],
		}));

		it('should produce test file flag', runTestCase({
			input: {toolName: 'bai_test', params: {testFile: '**/*.test.ts'}},
			result: ['--test', '--test-file=**/*.test.ts'],
		}));

		it('should produce test case flag', runTestCase({
			input: {toolName: 'bai_test', params: {testCase: 'Build|Deploy'}},
			result: ['--test', '--test-case=Build|Deploy'],
		}));

		it('should combine all test flags', runTestCase({
			input: {toolName: 'bai_test', params: {package: 'my-pkg', testType: 'firebase', testCase: 'auth'}},
			result: ['--test', '--use-package=my-pkg', '--test-type=firebase', '--test-case=auth'],
		}));
	});

	describe('bai_continue', () => {
		it('should produce continue flag', runTestCase({
			input: {toolName: 'bai_continue', params: {}},
			result: ['--continue'],
		}));
	});

	describe('bai_launch', () => {
		it('should produce no-build + launch + package flags', runTestCase({
			input: {toolName: 'bai_launch', params: {package: 'app-backend'}},
			result: ['--no-build', '--launch', '--use-package=app-backend'],
		}));

		it('should include debug flag when requested', runTestCase({
			input: {toolName: 'bai_launch', params: {package: 'app-backend', debug: true}},
			result: ['--no-build', '--launch', '--use-package=app-backend', '--debug-backend'],
		}));
	});

	describe('bai_clean', () => {
		it('should produce clean flag', runTestCase({
			input: {toolName: 'bai_clean', params: {}},
			result: ['--clean'],
		}));
	});

	describe('tool registry', () => {
		it('should have all expected tools', () => {
			const toolNames = baiTools.map(t => t.name).sort();
			const expected = ['bai_build', 'bai_clean', 'bai_continue', 'bai_init', 'bai_install', 'bai_launch', 'bai_test'].sort();
			if (JSON.stringify(toolNames) !== JSON.stringify(expected))
				throw new Error(`Expected tools ${JSON.stringify(expected)}, got ${JSON.stringify(toolNames)}`);
		});

		it('should require projectPath on every tool', () => {
			for (const tool of baiTools) {
				if (!('projectPath' in tool.schema))
					throw new Error(`Tool ${tool.name} schema does not include projectPath`);
			}
		});
	});
});
