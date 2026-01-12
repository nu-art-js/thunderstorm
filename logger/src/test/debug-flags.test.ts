/*
 * @nu-art/logger - Flexible logging infrastructure with multiple output targets
 * Copyright (C) 2024 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {runSingleTestCase, TestSuite} from '@nu-art/testalot';
import {DebugFlag, DebugFlags, LogLevel} from '../main/index.js';
import {expect} from 'chai';

type Input_CreateFlag = { key: string; minLevel?: LogLevel };
type Result_CreateFlag = { flag: DebugFlag; registered: boolean };

type TestSuite_CreateFlag = TestSuite<Input_CreateFlag, Result_CreateFlag>;
type TestCase_CreateFlag = TestSuite_CreateFlag['testcases'][number];

const test_CreateFlag = async (input: Input_CreateFlag): Promise<Result_CreateFlag> => {
	const flag = DebugFlags.createFlag(input.key, input.minLevel);
	const registered = DebugFlags.instance.AllDebugFlags[input.key] === flag;
	return { flag, registered };
};

const runTestCase_CreateFlag = (testCase: TestCase_CreateFlag) => () => runSingleTestCase(test_CreateFlag, testCase);

describe('DebugFlags - Create Flag', () => {
	it('should create and register a flag', runTestCase_CreateFlag({
		input: { key: 'TestFlag' },
		result: async (result) => {
			expect(result.flag).to.be.instanceOf(DebugFlag);
			expect(result.registered).to.be.true;
			expect(result.flag.getKey()).to.equal('TestFlag');
		}
	}));

	it('should create flag with custom min level', runTestCase_CreateFlag({
		input: { key: 'TestFlag2', minLevel: LogLevel.Warning },
		result: async (result) => {
			expect(result.flag).to.be.instanceOf(DebugFlag);
			result.flag.enable(true);
			expect(result.flag.canLog(LogLevel.Warning)).to.be.true;
			expect(result.flag.canLog(LogLevel.Debug)).to.be.false;
		}
	}));
});

type Input_EnableDisable = { key: string; enable: boolean };
type Result_EnableDisable = { enabled: boolean };

type TestSuite_EnableDisable = TestSuite<Input_EnableDisable, Result_EnableDisable>;
type TestCase_EnableDisable = TestSuite_EnableDisable['testcases'][number];

const test_EnableDisable = async (input: Input_EnableDisable): Promise<Result_EnableDisable> => {
	const flag = DebugFlags.createFlag(input.key);
	flag.enable(input.enable);
	const enabled = flag.isEnabled();
	return { enabled };
};

const runTestCase_EnableDisable = (testCase: TestCase_EnableDisable) => () => runSingleTestCase(test_EnableDisable, testCase);

describe('DebugFlags - Enable/Disable', () => {
	it('should enable a flag', runTestCase_EnableDisable({
		input: { key: 'EnableTest', enable: true },
		result: { enabled: true }
	}));

	it('should disable a flag', runTestCase_EnableDisable({
		input: { key: 'DisableTest', enable: false },
		result: { enabled: false }
	}));

	it('should toggle flag state', () => {
		const flag = DebugFlags.createFlag('ToggleTest');
		flag.enable(true);
		expect(flag.isEnabled()).to.be.true;
		flag.enable(false);
		expect(flag.isEnabled()).to.be.false;
		flag.enable(true);
		expect(flag.isEnabled()).to.be.true;
	});
});

type Input_MinLevel = { key: string; minLevel: LogLevel; testLevel: LogLevel };
type Result_MinLevel = { canLog: boolean };

type TestSuite_MinLevel = TestSuite<Input_MinLevel, Result_MinLevel>;
type TestCase_MinLevel = TestSuite_MinLevel['testcases'][number];

const test_MinLevel = async (input: Input_MinLevel): Promise<Result_MinLevel> => {
	const flag = DebugFlags.createFlag(input.key);
	flag.enable(true);
	flag.setMinLevel(input.minLevel);
	const canLog = flag.canLog(input.testLevel);
	return { canLog };
};

const runTestCase_MinLevel = (testCase: TestCase_MinLevel) => () => runSingleTestCase(test_MinLevel, testCase);

describe('DebugFlags - Min Level', () => {
	it('should allow logging at min level', runTestCase_MinLevel({
		input: { key: 'MinLevel1', minLevel: LogLevel.Info, testLevel: LogLevel.Info },
		result: { canLog: true }
	}));

	it('should allow logging above min level', runTestCase_MinLevel({
		input: { key: 'MinLevel2', minLevel: LogLevel.Info, testLevel: LogLevel.Warning },
		result: { canLog: true }
	}));

	it('should block logging below min level', runTestCase_MinLevel({
		input: { key: 'MinLevel3', minLevel: LogLevel.Info, testLevel: LogLevel.Debug },
		result: { canLog: false }
	}));

	it('should block logging when disabled regardless of level', () => {
		const flag = DebugFlags.createFlag('DisabledTest');
		flag.enable(false);
		flag.setMinLevel(LogLevel.Verbose);
		expect(flag.canLog(LogLevel.Error)).to.be.false;
	});
});

describe('DebugFlags - Rename', () => {
	it('should rename a flag', () => {
		const flag = DebugFlags.createFlag('OldName');
		flag.rename('NewName');
		expect(flag.getKey()).to.equal('NewName');
		expect(DebugFlags.instance.AllDebugFlags['NewName']).to.equal(flag);
		expect(DebugFlags.instance.AllDebugFlags['OldName']).to.be.undefined;
	});

	it('should handle rename of non-existent flag', () => {
		// Should not throw
		DebugFlags.rename('NonExistent', 'NewName');
	});
});

describe('DebugFlags - Singleton', () => {
	it('should maintain singleton instance', () => {
		const instance1 = DebugFlags.instance;
		const instance2 = DebugFlags.instance;
		expect(instance1).to.equal(instance2);
	});

	it('should share AllDebugFlags across instances', () => {
		const flag1 = DebugFlags.createFlag('SharedTest1');
		const flag2 = DebugFlags.createFlag('SharedTest2');
		expect(DebugFlags.instance.AllDebugFlags['SharedTest1']).to.equal(flag1);
		expect(DebugFlags.instance.AllDebugFlags['SharedTest2']).to.equal(flag2);
	});
});
