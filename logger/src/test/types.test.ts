/*
 * @nu-art/logger - Flexible logging infrastructure with multiple output targets
 * Copyright (C) 2024 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {runSingleTestCase, TestModel} from '@nu-art/testalot';
import {_logger_getPrefix, LogLevel, LogLevelOrdinal} from '../main/index.js';
import {expect} from 'chai';

type Input_LogLevel = { level: LogLevel };
type Result_LogLevel = { prefix: string; ordinal: number };

type TestCase_LogLevel = TestModel<Input_LogLevel, Result_LogLevel>;

const test_LogLevel = async (input: Input_LogLevel): Promise<Result_LogLevel> => {
	const prefix = _logger_getPrefix(input.level);
	const ordinal = LogLevelOrdinal.indexOf(input.level);
	return { prefix, ordinal };
};

const runTestCase_LogLevel = (testCase: TestCase_LogLevel) => () => runSingleTestCase(test_LogLevel, testCase);

describe('LogLevel Types', () => {
	it('should map Verbose to correct prefix and ordinal', runTestCase_LogLevel({
		input: { level: LogLevel.Verbose },
		result: { prefix: '-V-', ordinal: 0 }
	}));

	it('should map Debug to correct prefix and ordinal', runTestCase_LogLevel({
		input: { level: LogLevel.Debug },
		result: { prefix: '-D-', ordinal: 1 }
	}));

	it('should map Info to correct prefix and ordinal', runTestCase_LogLevel({
		input: { level: LogLevel.Info },
		result: { prefix: '-I-', ordinal: 2 }
	}));

	it('should map Warning to correct prefix and ordinal', runTestCase_LogLevel({
		input: { level: LogLevel.Warning },
		result: { prefix: '-W-', ordinal: 3 }
	}));

	it('should map Error to correct prefix and ordinal', runTestCase_LogLevel({
		input: { level: LogLevel.Error },
		result: { prefix: '-E-', ordinal: 4 }
	}));

	it('should have LogLevelOrdinal in correct order', () => {
		expect(LogLevelOrdinal).to.deep.equal([
			LogLevel.Verbose,
			LogLevel.Debug,
			LogLevel.Info,
			LogLevel.Warning,
			LogLevel.Error
		]);
	});

	it('should return default prefix for unknown level', () => {
		// @ts-ignore - testing edge case
		const prefix = _logger_getPrefix('Unknown' as LogLevel);
		expect(prefix).to.equal('---');
	});
});
