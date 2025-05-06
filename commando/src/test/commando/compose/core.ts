// file: ./compose/core.ts

import {expect} from 'chai';
import {TestSuite} from '@nu-art/ts-common/testing/types';
import {testSuiteTester} from '@nu-art/ts-common/testing/consts';
import {Commando_Basic, CommandoInteractive, SimpleTestCommando} from '../../_common';

type Input = (commando: SimpleTestCommando) => void;
type Result = string;

const test = async (input: Input) => {
	const commando = CommandoInteractive.create(Commando_Basic);
	try {
		input(commando);
		return commando.getCommand();
	} catch (e) {
		throw e;
	} finally {
		await commando.gracefullyKill();
	}
};

export const TestSuite_CommandComposition: TestSuite<Input, Result> = {
	label: 'Commando - Command Composition',
	testcases: [
		{
			description: 'Single command append',
			input: (commando: SimpleTestCommando) => {
				commando.append('echo Hello');
			},
			result: 'echo Hello'
		},
		{
			description: 'Multi-line command block',
			input: (commando: SimpleTestCommando) => {
				commando.append('echo Start');
				commando.indentIn();
				commando.append('echo Inner');
				commando.indentOut();
				commando.append('echo End');
			},
			result: 'echo Start\n  echo Inner\necho End'
		},
		{
			description: 'Empty line insertion',
			input: (commando: SimpleTestCommando) => {
				commando.append('echo Line1');
				commando.emptyLine();
				commando.append('echo Line2');
			},
			result: 'echo Line1\n\necho Line2'
		},
		{
			description: 'Double indent',
			input: (commando: SimpleTestCommando) => {
				commando.append('echo Top');
				commando.indentIn();
				commando.append('echo Mid');
				commando.indentIn();
				commando.append('echo Bottom');
			},
			result: 'echo Top\n  echo Mid\n    echo Bottom'
		},
		{
			description: 'Excessive indentOut calls',
			input: (commando: SimpleTestCommando) => {
				commando.append('echo Start');
				commando.indentOut();
				commando.append('echo End');
			},
			error: {
				expected: 'Invalid count value: -2'
			}
		},
		{
			description: 'Complex block with empty lines and indentation',
			input: (commando: SimpleTestCommando) => {
				commando.append('echo Pre');
				commando.emptyLine();
				commando.indentIn();
				commando.append('echo Nested');
				commando.emptyLine();
				commando.indentOut();
				commando.append('echo Post');
			},
			result: 'echo Pre\n\n  echo Nested\n\necho Post'
		},
		{
			description: 'Multiple append calls',
			input: (commando: SimpleTestCommando) => {
				commando.append('echo A');
				commando.append('echo B');
				commando.append('echo C');
			},
			result: 'echo A\necho B\necho C'
		},
		{
			description: 'Indent in and out multiple times',
			input: (commando: SimpleTestCommando) => {
				commando.append('echo Level 0');
				commando.indentIn();
				commando.append('echo Level 1');
				commando.indentOut();
				commando.indentOut();
				commando.append('echo Back to 0');
			},
			error: {
				expected: 'Invalid count value: -2'
			}
		},
		{
			description: 'Append after emptyLine with indent',
			input: (commando: SimpleTestCommando) => {
				commando.indentIn();
				commando.append('echo One');
				commando.emptyLine();
				commando.append('echo Two');
			},
			result: '  echo One\n\n  echo Two'
		},
		{
			description: 'Append single quoted command',
			input: (commando: SimpleTestCommando) => {
				commando.append(`echo 'quoted text'`);
			},
			result: `echo 'quoted text'`
		},
		{
			description: 'Append empty string (should render as empty line)',
			input: (commando: SimpleTestCommando) => {
				commando.append('');
			},
			result: ''
		},
		{
			description: 'Append interpolated multiline string',
			input: (commando: SimpleTestCommando) => {
				const lines = ['echo One', 'echo Two'];
				lines.forEach(line => commando.append(line));
			},
			result: 'echo One\necho Two'
		},
		{
			description: 'Deep indentation (10 levels)',
			input: (commando: SimpleTestCommando) => {
				for (let i = 0; i < 10; i++)
					commando.indentIn();
				commando.append('echo Deep');
			},
			result: '                    echo Deep'
		},
		{
			description: 'getCommand called twice (idempotent)',
			input: (commando: SimpleTestCommando) => {
				commando.append('echo A');
				commando.getCommand();
			},
			result: 'echo A'
		}
	],
	processor: async (testCase) => {
		const {input} = testCase;
		if ('error' in testCase)
			return await expect(test(input)).to.be.rejectedWith(testCase.error.expected, testCase.error.message);

		expect(await test(input)).to.deep.equal(testCase.result);
	}
};

describe(TestSuite_CommandComposition.label, () => testSuiteTester(TestSuite_CommandComposition));
