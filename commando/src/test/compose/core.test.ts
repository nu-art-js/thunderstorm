import {runSingleTestCase, TestModel} from '@nu-art/testalot';
import {Commando_Basic, CommandoInteractive, SimpleTestCommando} from '../_common.js';

// Input and output types
export type Input = (commando: SimpleTestCommando) => void;
export type Result = string;

// TestCase types
export type TestCase_CommandComposition = TestModel<Input, Result>;

const runTestCase = (testCase: TestCase_CommandComposition) => {
	return () => runSingleTestCase(test, testCase);
};

const test = async (input: Input): Promise<Result> => {
	const commando = CommandoInteractive.create(Commando_Basic);
	try {
		input(commando);
		return commando.getCommand();
	} finally {
		await commando.kill();
	}
};

describe('Commando - Command Composition (v3)', () => {
	it('Single command append', runTestCase({
		input: c => c.append('echo Hello'),
		result: 'echo Hello'
	}));

	it('Multi-line command block', runTestCase({
		input: c => {
			c.append('echo Start');
			c.indentIn();
			c.append('echo Inner');
			c.indentOut();
			c.append('echo End');
		},
		result: 'echo Start\n  echo Inner\necho End'
	}));

	it('Empty line insertion', runTestCase({
		input: c => {
			c.append('echo Line1');
			c.emptyLine();
			c.append('echo Line2');
		},
		result: 'echo Line1\n\necho Line2'
	}));

	it('Double indent', runTestCase({
		input: c => {
			c.append('echo Top');
			c.indentIn();
			c.append('echo Mid');
			c.indentIn();
			c.append('echo Bottom');
		},
		result: 'echo Top\n  echo Mid\n    echo Bottom'
	}));

	it('Excessive indentOut calls', runTestCase({
		input: c => {
			c.append('echo Start');
			c.indentOut();
			c.append('echo End');
		},
		error: {expected: 'Invalid count value: -2'}
	}));

	it('Complex block with empty lines and indentation', runTestCase({
		input: c => {
			c.append('echo Pre');
			c.emptyLine();
			c.indentIn();
			c.append('echo Nested');
			c.emptyLine();
			c.indentOut();
			c.append('echo Post');
		},
		result: 'echo Pre\n\n  echo Nested\n\necho Post'
	}));

	it('Multiple append calls', runTestCase({
		input: c => {
			c.append('echo A');
			c.append('echo B');
			c.append('echo C');
		},
		result: 'echo A\necho B\necho C'
	}));

	it('Indent in and out multiple times', runTestCase({
		input: c => {
			c.append('echo Level 0');
			c.indentIn();
			c.append('echo Level 1');
			c.indentOut();
			c.indentOut();
			c.append('echo Back to 0');
		},
		error: {expected: 'Invalid count value: -2'}
	}));

	it('Append after emptyLine with indent', runTestCase({
		input: c => {
			c.indentIn();
			c.append('echo One');
			c.emptyLine();
			c.append('echo Two');
		},
		result: '  echo One\n\n  echo Two'
	}));

	it('Append single quoted command', runTestCase({
		input: c => c.append(`echo 'quoted text'`),
		result: `echo 'quoted text'`
	}));

	it('Append empty string (should render as empty line)', runTestCase({
		input: c => c.append(''),
		result: ''
	}));

	it('Append interpolated multiline string', runTestCase({
		input: c => ['echo One', 'echo Two'].forEach(cmd => c.append(cmd)),
		result: 'echo One\necho Two'
	}));

	it('Deep indentation (10 levels)', runTestCase({
		input: c => {
			for (let i = 0; i < 10; i++) c.indentIn();
			c.append('echo Deep');
		},
		result: '                    echo Deep'
	}));

	it('getCommand called twice (idempotent)', runTestCase({
		input: c => {
			c.append('echo A');
			c.getCommand();
		},
		result: 'echo A'
	}));
});