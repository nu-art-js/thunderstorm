import {SimpleTestCommando} from '../../_common';
import {TestSuite} from '@nu-art/ts-common/testing/types';

export type Input = (commando: SimpleTestCommando) => void;
export type Result = {
	out?: string,
	err?: string,
	exitCode?: number,
};

export type ExpectedResult = {
	out?: string | RegExp,
	err?: string | RegExp,
	exitCode?: number,
};

export type Result_Raw = {
	out: string[],
	err: string[],
};

export const TestCases_CommandoExecution: TestSuite<Input, Result>['testcases'] = [
	{
		description: 'echo command output',
		input: (commando) => {
			commando.append('echo Hello');
		},
		result: {out: 'Hello'}
	},
	{
		description: 'writes to both stdout and stderr',
		input: (commando) => {
			commando.append('echo Hello');
			commando.append('echo Error 1>&2');
		},
		result: {out: 'Hello', err: 'Error'}
	},
	{
		description: 'no command issued',
		input: () => {
		},
		result: {}
	},
	{
		description: 'echo environment variable',
		input: (commando) => {
			commando.append('MY_VAR=123');
			commando.append('echo $MY_VAR');
		},
		result: {out: '123'}
	},
	{
		description: 'command using subshell output',
		input: (commando) => {
			commando.append('echo $(echo Nested)');
		},
		result: {out: 'Nested'}
	},
	{
		description: 'echo multi-line string',
		input: (commando) => {
			commando.append('echo -e "line1\\nline2"');
		},
		result: {out: 'line1\nline2'}
	},
	{
		description: 'chained commands',
		input: (commando) => {
			commando.append('echo A && echo B');
		},
		result: {out: 'A\nB'}
	},
	{
		description: 'command with pipe',
		input: (commando) => {
			commando.append('echo hello | tr a-z A-Z');
		},
		result: {out: 'HELLO'}
	},
	{
		description: 'command with quotes',
		input: (commando) => {
			commando.append('echo "A string with spaces"');
		},
		result: {out: 'A string with spaces'}
	},
	{
		description: 'special characters',
		input: (commando) => {
			commando.append('echo "!@#%^&*"');
		},
		result: {out: '!@#%^&*'}
	},
	{
		description: 'long output - 5 lines',
		input: (commando) => {
			commando.append('for i in {1..5}; do echo Line$i; done');
		},
		result: {out: 'Line1\nLine2\nLine3\nLine4\nLine5'}
	},
	{
		description: 'unset environment variable',
		input: (commando) => {
			commando.append('MY_VAR=test');
			commando.append('unset MY_VAR');
			commando.append('echo $MY_VAR');
		},
		result: {}
	},
	{
		description: 'exported environment variable',
		input: (commando) => {
			commando.append('export FOO=BAR');
			commando.append('echo $FOO');
		},
		result: {out: 'BAR'}
	},
	{
		description: 'invalid command',
		input: (commando) => {
			commando.append('non_existing_command');
		},
		error: {
			expected: 'Process exited with code: 127'
		}
	}
];