/*
 * @nu-art/logger - Flexible logging infrastructure with multiple output targets
 * Copyright (C) 2024 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {TestSuite} from '@nu-art/ts-common/testing/types.js';
import {defaultTestProcessor, runSingleTestCase} from '@nu-art/ts-common/testing/consts.js';
import {StaticLogger, LogLevel, BeLogged} from '../main/index.js';
import {createTestBuffer, getBufferContent} from './helpers.js';
import {expect} from 'chai';

type Input_StaticLog = { tag: string; level: LogLevel; message: string };
type Result_StaticLog = { logged: boolean; content: string };

type TestSuite_StaticLog = TestSuite<Input_StaticLog, Result_StaticLog>;
type TestCase_StaticLog = TestSuite_StaticLog['testcases'][number];

const test_StaticLog = async (input: Input_StaticLog): Promise<Result_StaticLog> => {
	const buffer = createTestBuffer();
	BeLogged.addClient(buffer);
	
	StaticLogger.log(input.tag, input.level, false, [input.message]);
	
	const content = getBufferContent(buffer);
	const logged = content.includes(input.message);
	
	BeLogged.removeClient(buffer);
	return { logged, content };
};

const runTestCase_StaticLog = (testCase: TestCase_StaticLog) => () => runSingleTestCase(test_StaticLog, testCase);

describe('StaticLogger - Log Levels', () => {
	it('should log verbose message', runTestCase_StaticLog({
		input: { tag: 'StaticTest', level: LogLevel.Verbose, message: 'static verbose' },
		result: { logged: true, content: expect.stringContaining('static verbose') }
	}));

	it('should log debug message', runTestCase_StaticLog({
		input: { tag: 'StaticTest', level: LogLevel.Debug, message: 'static debug' },
		result: { logged: true, content: expect.stringContaining('static debug') }
	}));

	it('should log info message', runTestCase_StaticLog({
		input: { tag: 'StaticTest', level: LogLevel.Info, message: 'static info' },
		result: { logged: true, content: expect.stringContaining('static info') }
	}));

	it('should log warning message', runTestCase_StaticLog({
		input: { tag: 'StaticTest', level: LogLevel.Warning, message: 'static warning' },
		result: { logged: true, content: expect.stringContaining('static warning') }
	}));

	it('should log error message', runTestCase_StaticLog({
		input: { tag: 'StaticTest', level: LogLevel.Error, message: 'static error' },
		result: { logged: true, content: expect.stringContaining('static error') }
	}));
});

describe('StaticLogger - Convenience Methods', () => {
	it('should log via logVerbose', () => {
		const buffer = createTestBuffer();
		BeLogged.addClient(buffer);
		StaticLogger.logVerbose('Tag', 'verbose message');
		expect(getBufferContent(buffer)).to.include('verbose message');
		BeLogged.removeClient(buffer);
	});

	it('should log via logDebug', () => {
		const buffer = createTestBuffer();
		BeLogged.addClient(buffer);
		StaticLogger.logDebug('Tag', 'debug message');
		expect(getBufferContent(buffer)).to.include('debug message');
		BeLogged.removeClient(buffer);
	});

	it('should log via logInfo', () => {
		const buffer = createTestBuffer();
		BeLogged.addClient(buffer);
		StaticLogger.logInfo('Tag', 'info message');
		expect(getBufferContent(buffer)).to.include('info message');
		BeLogged.removeClient(buffer);
	});

	it('should log via logWarning', () => {
		const buffer = createTestBuffer();
		BeLogged.addClient(buffer);
		StaticLogger.logWarning('Tag', 'warning message');
		expect(getBufferContent(buffer)).to.include('warning message');
		BeLogged.removeClient(buffer);
	});

	it('should log via logError', () => {
		const buffer = createTestBuffer();
		BeLogged.addClient(buffer);
		StaticLogger.logError('Tag', 'error message');
		expect(getBufferContent(buffer)).to.include('error message');
		BeLogged.removeClient(buffer);
	});

	it('should log via bold variants', () => {
		const buffer = createTestBuffer();
		BeLogged.addClient(buffer);
		StaticLogger.logInfoBold('Tag', 'bold message');
		expect(getBufferContent(buffer)).to.include('bold message');
		BeLogged.removeClient(buffer);
	});
});

describe('StaticLogger - Min Level', () => {
	it('should respect min level setting', () => {
		const buffer = createTestBuffer();
		BeLogged.addClient(buffer);
		
		StaticLogger.setMinLevel(LogLevel.Info);
		StaticLogger.logDebug('Tag', 'debug message');
		StaticLogger.logInfo('Tag', 'info message');
		
		const content = getBufferContent(buffer);
		expect(content).not.to.include('debug message');
		expect(content).to.include('info message');
		
		BeLogged.removeClient(buffer);
	});

	it('should filter by min level when disabled', () => {
		const buffer = createTestBuffer();
		BeLogged.addClient(buffer);
		
		StaticLogger._DEBUG_FLAG.enable(false);
		StaticLogger.logInfo('Tag', 'should not log');
		
		expect(getBufferContent(buffer)).to.equal('');
		
		StaticLogger._DEBUG_FLAG.enable(true);
		BeLogged.removeClient(buffer);
	});
});
