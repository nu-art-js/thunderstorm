/*
 * @nu-art/logger - Flexible logging infrastructure with multiple output targets
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {runSingleTestCase, TestModel} from '@nu-art/testalot';
import {BeLogged, Logger, LogLevel} from '../main/index.js';
import {createTestBuffer, getBufferContent} from './helpers.js';
import {expect} from 'chai';

// Global cleanup to ensure all clients are removed after all tests
after(() => {
	BeLogged.removeAllClients();
});

type Input_LoggerCreate = { tag?: string };
type Result_LoggerCreate = { tag: string; hasFlag: boolean };

type TestCase_LoggerCreate = TestModel<Input_LoggerCreate, Result_LoggerCreate>;

const test_LoggerCreate = async (input: Input_LoggerCreate): Promise<Result_LoggerCreate> => {
	const logger = new Logger(input.tag);
	// @ts-ignore - access protected property for testing
	const hasFlag = logger._DEBUG_FLAG !== undefined;
	return { tag: logger.tag, hasFlag };
};

const runTestCase_LoggerCreate = (testCase: TestCase_LoggerCreate) => () => runSingleTestCase(test_LoggerCreate, testCase);

describe('Logger - Creation', () => {
	it('should create logger with explicit tag', runTestCase_LoggerCreate({
		input: { tag: 'MyLogger' },
		result: { tag: 'MyLogger', hasFlag: true }
	}));

	it('should create logger without tag (uses class name)', runTestCase_LoggerCreate({
		input: {},
		result: async (result) => {
			expect(result.tag).to.be.a('string');
			expect(result.hasFlag).to.be.true;
		}
	}));
});

type Input_LoggerLog = { tag: string; level: LogLevel; enabled: boolean; minLevel?: LogLevel; message: string };
type Result_LoggerLog = { logged: boolean; content: string };

type TestCase_LoggerLog = TestModel<Input_LoggerLog, Result_LoggerLog>;

const test_LoggerLog = async (input: Input_LoggerLog): Promise<Result_LoggerLog> => {
	const buffer = createTestBuffer();
	BeLogged.addClient(buffer);
	
	const logger = new Logger(input.tag);
	// @ts-ignore - access protected property for testing
	logger._DEBUG_FLAG.enable(input.enabled);
	if (input.minLevel) {
		logger.setMinLevel(input.minLevel);
	} else {
		// Set min level to Verbose to allow all levels unless specified
		logger.setMinLevel(LogLevel.Verbose);
	}
	
	logger.log(input.level, false, [input.message]);
	
	const content = getBufferContent(buffer);
	const logged = content.includes(input.message);
	
	BeLogged.removeClient(buffer);
	return { logged, content };
};

const runTestCase_LoggerLog = (testCase: TestCase_LoggerLog) => () => runSingleTestCase(test_LoggerLog, testCase);

describe('Logger - Log Levels', () => {
	it('should log verbose message when enabled', runTestCase_LoggerLog({
		input: { tag: 'TestLogger', level: LogLevel.Verbose, enabled: true, message: 'verbose test' },
		result: async (result) => {
			expect(result.logged).to.be.true;
			expect(result.content).to.include('verbose test');
		}
	}));

	it('should log debug message when enabled', runTestCase_LoggerLog({
		input: { tag: 'TestLogger', level: LogLevel.Debug, enabled: true, message: 'debug test' },
		result: async (result) => {
			expect(result.logged).to.be.true;
			expect(result.content).to.include('debug test');
		}
	}));

	it('should log info message when enabled', runTestCase_LoggerLog({
		input: { tag: 'TestLogger', level: LogLevel.Info, enabled: true, message: 'info test' },
		result: async (result) => {
			expect(result.logged).to.be.true;
			expect(result.content).to.include('info test');
		}
	}));

	it('should log warning message when enabled', runTestCase_LoggerLog({
		input: { tag: 'TestLogger', level: LogLevel.Warning, enabled: true, message: 'warning test' },
		result: async (result) => {
			expect(result.logged).to.be.true;
			expect(result.content).to.include('warning test');
		}
	}));

	it('should log error message when enabled', runTestCase_LoggerLog({
		input: { tag: 'TestLogger', level: LogLevel.Error, enabled: true, message: 'error test' },
		result: async (result) => {
			expect(result.logged).to.be.true;
			expect(result.content).to.include('error test');
		}
	}));

	it('should not log when disabled', runTestCase_LoggerLog({
		input: { tag: 'TestLogger', level: LogLevel.Info, enabled: false, message: 'should not log' },
		result: { logged: false, content: '' }
	}));

	it('should not log below min level', runTestCase_LoggerLog({
		input: { tag: 'TestLogger', level: LogLevel.Debug, enabled: true, minLevel: LogLevel.Info, message: 'below min' },
		result: { logged: false, content: '' }
	}));

	it('should log at min level', runTestCase_LoggerLog({
		input: { tag: 'TestLogger', level: LogLevel.Info, enabled: true, minLevel: LogLevel.Info, message: 'at min' },
		result: async (result) => {
			expect(result.logged).to.be.true;
			expect(result.content).to.include('at min');
		}
	}));

	it('should log above min level', runTestCase_LoggerLog({
		input: { tag: 'TestLogger', level: LogLevel.Error, enabled: true, minLevel: LogLevel.Info, message: 'above min' },
		result: async (result) => {
			expect(result.logged).to.be.true;
			expect(result.content).to.include('above min');
		}
	}));
});

describe('Logger - Convenience Methods', () => {
	it('should log via logVerbose', () => {
		const buffer = createTestBuffer();
		BeLogged.addClient(buffer);
		const logger = new Logger('Test');
		logger.setMinLevel(LogLevel.Verbose);
		logger.logVerbose('verbose message');
		expect(getBufferContent(buffer)).to.include('verbose message');
		BeLogged.removeClient(buffer);
	});

	it('should log via logDebug', () => {
		const buffer = createTestBuffer();
		BeLogged.addClient(buffer);
		const logger = new Logger('Test');
		logger.setMinLevel(LogLevel.Verbose);
		logger.logDebug('debug message');
		expect(getBufferContent(buffer)).to.include('debug message');
		BeLogged.removeClient(buffer);
	});

	it('should log via logInfo', () => {
		const buffer = createTestBuffer();
		BeLogged.addClient(buffer);
		const logger = new Logger('Test');
		logger.logInfo('info message');
		expect(getBufferContent(buffer)).to.include('info message');
		BeLogged.removeClient(buffer);
	});

	it('should log via logWarning', () => {
		const buffer = createTestBuffer();
		BeLogged.addClient(buffer);
		const logger = new Logger('Test');
		logger.logWarning('warning message');
		expect(getBufferContent(buffer)).to.include('warning message');
		BeLogged.removeClient(buffer);
	});

	it('should log via logError', () => {
		const buffer = createTestBuffer();
		BeLogged.addClient(buffer);
		const logger = new Logger('Test');
		logger.logError('error message');
		expect(getBufferContent(buffer)).to.include('error message');
		BeLogged.removeClient(buffer);
	});

	it('should log via bold variants', () => {
		const buffer = createTestBuffer();
		BeLogged.addClient(buffer);
		const logger = new Logger('Test');
		logger.logInfoBold('bold message');
		expect(getBufferContent(buffer)).to.include('bold message');
		BeLogged.removeClient(buffer);
	});
});

describe('Logger - Multiple Loggers', () => {
	it('should handle multiple loggers independently', () => {
		const buffer = createTestBuffer();
		BeLogged.addClient(buffer);
		
		const logger1 = new Logger('Logger1');
		const logger2 = new Logger('Logger2');
		
		// @ts-ignore - access protected property for testing
		logger1._DEBUG_FLAG.enable(true);
		// @ts-ignore - access protected property for testing
		logger2._DEBUG_FLAG.enable(false);
		
		logger1.logInfo('logger1 message');
		logger2.logInfo('logger2 message');
		
		const content = getBufferContent(buffer);
		expect(content).to.include('logger1 message');
		expect(content).not.to.include('logger2 message');
		
		BeLogged.removeClient(buffer);
	});
});

describe('Logger - Tag Management', () => {
	it('should allow tag change via setTag', () => {
		class TestLogger extends Logger {
			constructor() {
				super('InitialTag');
			}
		}
		
		const logger = new TestLogger();
		expect(logger.tag).to.equal('InitialTag');
		
		// @ts-ignore - access protected method for testing
		logger.setTag('NewTag');
		expect(logger.tag).to.equal('NewTag');
	});
});
